/**
 * POST /api/ho-so/approve
 *
 * Quy trình phê duyệt hồ sơ — server-side hoàn toàn (không phụ thuộc GAS):
 *   1. Kiểm tra session + quyền lãnh đạo/admin
 *   2. Cập nhật TrangThai → da_duyet trong Sheets
 *   3. Lấy file gốc (DOCX/DOC) từ Drive qua FilePath
 *   4. Copy sang Google Docs format (mimeType conversion) — Drive API
 *   5. Dùng Docs API batchUpdate để đổi toàn bộ text → màu đen (#000000)
 *   6. Export Google Doc → PDF blob qua Drive export endpoint
 *   7. Upload PDF lên cùng thư mục gốc — Drive API
 *   8. Xóa Google Doc tạm thời
 *   9. Cập nhật LinkKySo trong Sheets với URL PDF vừa tạo
 *  10. Ghi log
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { updateHoSoStatus, appendLog, getSheetData } from '@/lib/sheets';
import { getGoogleAuth, clearAuthCache } from '@/lib/google-auth';
import { google } from 'googleapis';
import type { HoSo } from '@/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Trích xuất Drive file ID từ URL hoặc direct ID */
function extractFileId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const m =
    urlOrId.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    urlOrId.match(/id=([a-zA-Z0-9_-]+)/) ||
    urlOrId.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  // Nếu là raw ID (không có /)
  if (/^[a-zA-Z0-9_-]{25,}$/.test(urlOrId)) return urlOrId;
  return null;
}

/** Chờ tối đa maxMs ms rồi resolve */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Main Handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Auth check
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
  }
  const vaiTro = (session.user as { vaiTro?: string }).vaiTro;
  if (vaiTro !== 'lanh_dao' && vaiTro !== 'admin') {
    return NextResponse.json({ success: false, error: 'Bạn không có quyền phê duyệt hồ sơ' }, { status: 403 });
  }

  try {
    const { maHoSo } = await req.json();
    if (!maHoSo) {
      return NextResponse.json({ success: false, error: 'Thiếu maHoSo' }, { status: 400 });
    }

    // 2. Cập nhật trạng thái → da_duyet ngay (không chờ PDF)
    const updated = await updateHoSoStatus(maHoSo, 'da_duyet');
    if (!updated) {
      return NextResponse.json({ success: false, error: `Không tìm thấy hồ sơ: ${maHoSo}` }, { status: 404 });
    }

    // Ghi log phê duyệt
    await appendLog(maHoSo, 'DUYET', `Phê duyệt bởi ${session.user.name || session.user.email}`);

    // 3. Lấy FilePath từ sheet để biết file nguồn
    const hoSoList = await getSheetData<HoSo>('Ho_So');
    const hoSo = hoSoList.find((h) => h.MaHoSo === maHoSo);
    if (!hoSo?.FilePath) {
      return NextResponse.json({
        success: true,
        message: 'Phê duyệt thành công (không có file nguồn để convert PDF)',
        data: { maHoSo, trangThai: 'da_duyet', pdfUrl: '' },
      });
    }

    const fileId = extractFileId(hoSo.FilePath);
    if (!fileId) {
      console.warn('[approve] Không thể trích xuất fileId từ FilePath:', hoSo.FilePath);
      return NextResponse.json({
        success: true,
        message: 'Phê duyệt thành công',
        data: { maHoSo, trangThai: 'da_duyet', pdfUrl: '' },
      });
    }

    // 4-9: Pipeline tô đen text và xuất PDF
    // Reset auth cache để đảm bảo dùng scopes mới (drive + documents)
    clearAuthCache();
    const auth = await getGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    const docs  = google.docs({ version: 'v1', auth });

    let tempDocId: string | null = null;
    let pdfUrl = '';

    try {
      // 4. Lấy metadata file gốc
      const fileMeta = await drive.files.get({
        fileId,
        fields: 'name,mimeType,parents',
        supportsAllDrives: true,
      });
      const sourceName = fileMeta.data.name || hoSo.TenTaiLieu || 'document';
      const baseName   = sourceName.replace(/\.[^/.]+$/, '');
      const parentId   = fileMeta.data.parents?.[0] || process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID!;

      // 5. Copy DOCX → Google Docs format (Drive API chuyển đổi inline)
      console.log('[approve] Copying DOCX to Google Docs format...');
      const copyRes = await drive.files.copy({
        fileId,
        supportsAllDrives: true,
        requestBody: {
          name: `${baseName}_black_temp`,
          mimeType: 'application/vnd.google-apps.document',
          parents: [parentId],
        },
        fields: 'id',
      });
      tempDocId = copyRes.data.id!;
      console.log('[approve] Temp Google Doc created:', tempDocId);

      // Chờ Google Drive hoàn tất convert (tối đa 15 giây)
      let waitMs = 0;
      while (waitMs < 15000) {
        await sleep(1500);
        waitMs += 1500;
        try {
          const check = await drive.files.get({
            fileId: tempDocId,
            fields: 'id,mimeType',
            supportsAllDrives: true,
          });
          if (check.data.mimeType === 'application/vnd.google-apps.document') {
            console.log('[approve] Doc ready after', waitMs, 'ms');
            break;
          }
        } catch {
          // tiếp tục chờ
        }
      }

      // 6. Lấy nội dung document để tính endIndex
      const docContent = await docs.documents.get({ documentId: tempDocId });
      const content = docContent.data.body?.content || [];
      // endIndex của phần tử cuối cùng trong body
      const lastEndIndex = content.length > 0
        ? (content[content.length - 1].endIndex ?? 1) - 1
        : 1;

      // 7. Docs API batchUpdate: đổi toàn bộ text → màu đen
      console.log('[approve] Setting all text to black, endIndex:', lastEndIndex);
      if (lastEndIndex > 1) {
        await docs.documents.batchUpdate({
          documentId: tempDocId,
          requestBody: {
            requests: [
              {
                updateTextStyle: {
                  textStyle: {
                    foregroundColor: {
                      color: {
                        rgbColor: { red: 0, green: 0, blue: 0 },
                      },
                    },
                  },
                  range: { startIndex: 1, endIndex: lastEndIndex },
                  fields: 'foregroundColor',
                },
              },
            ],
          },
        });
      }
      console.log('[approve] Text color set to black ✅');

      // 8. Export Google Doc → PDF
      console.log('[approve] Exporting to PDF...');
      const exportRes = await drive.files.export(
        { fileId: tempDocId, mimeType: 'application/pdf' },
        { responseType: 'arraybuffer' }
      );
      const pdfBuffer = Buffer.from(exportRes.data as ArrayBuffer);

      // 9. Upload PDF lên Drive (cùng thư mục với file gốc)
      console.log('[approve] Uploading PDF to Drive...');
      const { Readable } = await import('stream');
      const pdfStream = new Readable();
      pdfStream.push(pdfBuffer);
      pdfStream.push(null);

      const uploadRes = await drive.files.create({
        supportsAllDrives: true,
        requestBody: {
          name: `${baseName}.pdf`,
          parents: [parentId],
          mimeType: 'application/pdf',
        },
        media: { mimeType: 'application/pdf', body: pdfStream },
        fields: 'id,webViewLink',
      });

      const pdfFileId = uploadRes.data.id!;
      pdfUrl = uploadRes.data.webViewLink ||
        `https://drive.google.com/file/d/${pdfFileId}/view`;
      console.log('[approve] PDF uploaded:', pdfUrl);

      // 10. Cập nhật LinkKySo trong Sheet
      await updateHoSoStatus(maHoSo, 'da_duyet', pdfUrl);
      console.log('[approve] LinkKySo updated in Sheet ✅');

    } finally {
      // Cleanup: xóa Google Doc tạm (kể cả khi có lỗi)
      if (tempDocId) {
        try {
          await drive.files.delete({ fileId: tempDocId, supportsAllDrives: true });
          console.log('[approve] Temp doc deleted:', tempDocId);
        } catch (delErr) {
          console.warn('[approve] Could not delete temp doc:', delErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Hồ sơ đã được phê duyệt — PDF màu đen tạo thành công',
      data: { maHoSo, trangThai: 'da_duyet', pdfUrl },
    });

  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Lỗi không xác định';
    console.error('[ho-so/approve] Error:', err);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
