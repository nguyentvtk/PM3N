/**
 * POST /api/ho-so/approve
 *
 * Quy trình phê duyệt hồ sơ — 2 giai đoạn:
 *   1. Cập nhật TrangThai → da_duyet trong Sheets (fast, ~1-2s)
 *   2. Gọi GAS để chuyển DOCX → PDF màu đen (fire-and-forget)
 *   3. Trả success: true ngay → Frontend redirect vào trang đóng dấu
 *
 * GAS chạy ngầm và tự cập nhật LinkKySo khi xong.
 * Trang dong-dau sẽ dùng FilePath (DOCX) hoặc LinkKySo (PDF) khi đã sẵn sàng.
 */

export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { updateHoSoStatus, appendLog } from '@/lib/sheets';

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

    // 2. Cập nhật trạng thái → da_duyet ngay (blocking, fast)
    const updated = await updateHoSoStatus(maHoSo, 'da_duyet');
    if (!updated) {
      return NextResponse.json(
        { success: false, error: `Không tìm thấy hồ sơ: ${maHoSo}` },
        { status: 404 }
      );
    }

    // Ghi log
    await appendLog(
      maHoSo,
      'DUYET',
      `Phê duyệt bởi ${session.user.name || session.user.email}`
    );

    // 3. Fire-and-forget: Gọi GAS để chuyển DOCX → PDF ngầm
    //    Không await → không block response
    const gasUrl = process.env.GAS_WEB_APP_URL;
    if (gasUrl) {
      // Dùng AbortController với timeout 25s để tránh memory leak
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource: 'drive',
          action: 'approve_and_convert',
          data: { MaHoSo: maHoSo },
        }),
        signal: controller.signal,
      })
        .then(async (r) => {
          clearTimeout(timeoutId);
          const json = await r.json().catch(() => ({}));
          if (json.success) {
            console.log(`[approve] GAS convert OK for ${maHoSo}, pdfUrl:`, json.data?.pdfUrl);
          } else {
            console.warn(`[approve] GAS convert failed for ${maHoSo}:`, json.error);
          }
        })
        .catch((err) => {
          clearTimeout(timeoutId);
          if (err.name !== 'AbortError') {
            console.warn(`[approve] GAS fetch error for ${maHoSo}:`, err.message);
          }
        });
    } else {
      console.warn('[approve] GAS_WEB_APP_URL chưa được cấu hình — bỏ qua convert PDF');
    }

    // 4. Trả về success ngay — frontend sẽ redirect sang dong-dau
    return NextResponse.json({
      success: true,
      message: 'Hồ sơ đã được phê duyệt. PDF đang được tạo ở nền.',
      data: {
        maHoSo,
        trangThai: 'da_duyet',
        // pdfUrl chưa có ngay — trang dong-dau sẽ dùng FilePath rồi poll LinkKySo
      },
    });

  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Lỗi không xác định';
    console.error('[ho-so/approve] Error:', err);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
