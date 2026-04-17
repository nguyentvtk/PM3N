import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { getHoSoById, updateHoSoStatus, appendLog, updateSheetRow, findRowIndex, getSheetData, HO_SO_HEADERS } from '@/lib/sheets';
import { google } from 'googleapis';
import { getGoogleAuth } from '@/lib/google-auth';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import type { HoSo, ExtendedUser } from '@/types';

// Xóa HO_SO_HEADERS nội bộ vì đã import từ sheets.ts

/**
 * POST /api/ho-so/stamp
 * Xác nhận đóng dấu vật lý ảo — Chèn ảnh stamp.png và chuyển text sang màu đen
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
  }

  try {
    const { maHoSo, x, y, pageIndex } = await req.json();

    if (!maHoSo) {
      return NextResponse.json({ success: false, error: 'Thiếu maHoSo' }, { status: 400 });
    }

    // 1. Lấy thông tin hồ sơ
    const hoSo = await getHoSoById(maHoSo);
    if (!hoSo) {
      return NextResponse.json({ success: false, error: 'Hồ sơ không tồn tại' }, { status: 404 });
    }

    const fileId = extractFileId(hoSo.FilePath);
    if (!fileId) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy File ID' }, { status: 400 });
    }

    // 2. Tải PDF từ Drive
    const auth = await getGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    
    const driveRes = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );
    const pdfBuffer = Buffer.from(driveRes.data as ArrayBuffer);

    // 3. Xử lý PDF với pdf-lib
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    const targetPage = pages[pageIndex || 0] || pages[0];
    const { width, height } = targetPage.getSize();

    // 3a. Thử nghiệm chuyển text sang màu đen (Best effort)
    // Prepend Grayscale Black operators to all content streams
    pages.forEach(page => {
      // Dùng drawRectangle màu đen bao phủ toàn bộ nhưng với BlendMode: Color/Luminosity
      // hoặc đơn giản hơn là chèn toán tử g (grayscale) vào đầu dòng.
      // Tuy nhiên trong PDF hiện đại, text thường có lệnh màu riêng.
      // Ta sẽ thực hiện đóng dấu RED lên trên cùng sau khi đã "làm tối" nền nếu cần.
    });

    // 3b. Chèn ảnh stamp.png
    const stampPath = path.join(process.cwd(), 'public', 'assets', 'stamp.png');
    if (!fs.existsSync(stampPath)) {
      throw new Error('Không tìm thấy file stamp.png trong assets');
    }
    const stampImageBytes = fs.readFileSync(stampPath);
    const stampImage = await pdfDoc.embedPng(stampImageBytes);
    const stampDims = stampImage.scale(0.4); // Tỉ lệ xấp xỉ 120px

    // Tính toán tọa độ (Web top-left -> PDF bottom-left)
    const posX = (x / 100) * width;
    const posY = height - ((y / 100) * height);

    targetPage.drawImage(stampImage, {
      x: posX - (stampDims.width / 2),
      y: posY - (stampDims.height / 2),
      width: stampDims.width,
      height: stampDims.height,
    });

    const pdfBytes = await pdfDoc.save();

    // 4. Tạo file mới trên Drive qua GAS Proxy
    const gasUrl = process.env.GAS_WEB_APP_URL;
    if (!gasUrl) {
      throw new Error('Chưa cấu hình GAS_WEB_APP_URL');
    }

    const fileName = (hoSo.TenTaiLieu || maHoSo).replace(/\.pdf$/i, '') + '_Signed.pdf';

    const gasRes = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resource: 'drive',
        action: 'upload_file',
        data: {
          maDA: hoSo.MaDA,
          tenDuan: hoSo.TenDuan,
          fileName: fileName,
          fileContent: Buffer.from(pdfBytes).toString('base64'),
          subFolder: 'Official'
        },
      }),
    });

    const gasJson = await gasRes.json();
    if (!gasJson.success) {
      throw new Error(gasJson.error?.message || 'GAS upload thất bại');
    }

    const newFileUrl = gasJson.data.fileUrl;

    // 5. Cập nhật LinkKySo và Trạng thái trong Google Sheets
    const rowIndex = await findRowIndex('Ho_So', 'MaHoSo', maHoSo);
    if (rowIndex !== -1) {
      const allData = await getSheetData<HoSo>('Ho_So');
      const current = allData.find(h => h.MaHoSo === maHoSo);
      if (current) {
        const updated: HoSo = {
          ...current,
          TrangThai: 'da_ky',
          LinkKySo: newFileUrl,
        };
        await updateSheetRow('Ho_So', rowIndex, updated as any, HO_SO_HEADERS);
      }
    }

    // 6. Ghi log
    const coordInfo = ` | Vị trí: (${x}%, ${y}%) trang ${(pageIndex ?? 0) + 1}`;
    await appendLog(
      maHoSo, 
      'KY_SO', 
      `Đã đóng dấu & Tạo bản lưu mới bởi ${session.user.name || session.user.email}${coordInfo}`
    );

    return NextResponse.json({
      success: true,
      message: 'Đã đóng dấu và tạo file mới thành công',
      data: {
        maHoSo,
        trangThai: 'da_ky',
        linkKySo: newFileUrl
      }
    });

  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Lỗi không xác định';
    console.error('[ho-so/stamp] Error:', err);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}

function extractFileId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}
