import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { getHoSoById } from '@/lib/sheets';
import { getGoogleAuth } from '@/lib/google-auth';
import { google } from 'googleapis';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
  }

  try {
    const { maHoSo, x, y, pageIndex, scale } = await req.json();

    if (!maHoSo || x === undefined || y === undefined) {
      return NextResponse.json({ success: false, error: 'Thiếu thông tin maHoSo hoặc tọa độ' }, { status: 400 });
    }

    const hoSo = await getHoSoById(maHoSo);
    if (!hoSo) return NextResponse.json({ success: false, error: 'Không tìm thấy hồ sơ' }, { status: 404 });

    // 1. Tải file từ Drive
    const auth = await getGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    
    const fileIdMatch = (hoSo.LinkKySo || hoSo.FilePath).match(/\/d\/([a-zA-Z0-9_-]{25,})/);
    if (!fileIdMatch) return NextResponse.json({ success: false, error: 'Không tìm thấy Google Drive File ID' }, { status: 400 });
    const fileId = fileIdMatch[1];

    const response = await drive.files.get({ fileId: fileId, alt: 'media' }, { responseType: 'arraybuffer' });
    const pdfBytes = response.data as ArrayBuffer;

    // 2. Xử lý PDF với pdf-lib
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const targetPageIndex = pageIndex ?? (pages.length - 1); // Mặc định trang cuối
    const page = pages[targetPageIndex];
    const { height } = page.getSize();

    // 3. Tải con dấu (Giả định nằm trong public/assets/stamp.png)
    // Nếu user chưa có, ta dùng một file tạm hoặc báo lỗi
    const stampPath = path.join(process.cwd(), 'public', 'assets', 'stamp.png');
    if (!fs.existsSync(stampPath)) {
       return NextResponse.json({ success: false, error: 'Không tìm thấy file con dấu tại public/assets/stamp.png. Vui lòng upload ảnh con dấu trước.' }, { status: 400 });
    }
    const stampBytes = fs.readFileSync(stampPath);
    const stampImage = await pdfDoc.embedPng(stampBytes);

    // Tính toán tỷ lệ và tọa độ (từ Canvas px sang PDF points)
    // Tọa độ PDF bắt đầu từ góc dưới bên trái (0,0)
    // Tọa độ Canvas bắt đầu từ góc trên bên trái
    const stampWidth = (scale || 1) * 100; // Mặc định 100pt
    const stampHeight = (stampImage.height / stampImage.width) * stampWidth;

    page.drawImage(stampImage, {
      x: x,
      y: height - y - stampHeight, // Chuyển đổi tọa độ Y
      width: stampWidth,
      height: stampHeight,
    });

    const modifiedPdfBytes = await pdfDoc.save();

    // 4. Lưu đè lên Drive (hoặc tạo file mới)
    // Ở bước này ta upload đè (update content)
    await drive.files.update({
      fileId: fileId,
      media: {
        mimeType: 'application/pdf',
        body: Buffer.from(modifiedPdfBytes),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Đã đóng dấu thành công',
      data: {
        fileId,
        pageIndex: targetPageIndex,
        coords: { x, y }
      }
    });

  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Lỗi không xác định';
    console.error('[ho-so/stamp] Error:', err);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
