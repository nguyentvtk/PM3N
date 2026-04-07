import { NextResponse } from 'next/server';
import { getGoogleAuth } from '@/lib/google-auth';
import { getSheetData } from '@/lib/sheets';

export const dynamic = 'force-dynamic'; // Không cache

export async function GET() {
  try {
    const logs: string[] = [];
    logs.push("Bắt đầu kiểm tra cấu hình Google Sheets...");

    // 1. Kiểm tra biến môi trường
    logs.push(`- EMAIL: ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'THIẾU'}`);
    
    const keyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '';
    logs.push(`- KEY RAW length: ${keyRaw.length}`);
    logs.push(`- KEY RAW start: ${keyRaw.substring(0, 30)}...`);
    logs.push(`- KEY RAW end: ...${keyRaw.substring(keyRaw.length - 30)}`);
    logs.push(`- Có chứa \\n (chuỗi ký tự): ${keyRaw.includes('\\n')}`);
    logs.push(`- Có chứa newline (chữ xuống dòng thật): ${keyRaw.includes('\n')}`);
    
    // 2. Thử lấy client Auth
    logs.push("Tiến hành lấy Google Auth...");
    await getGoogleAuth();
    logs.push("- Google Auth thành công!");

    // 3. Thử đọc dữ liệu sheet
    logs.push(`- Đọc sheet 'Nguoi_dung' từ SPREADSHEET_ID: ${process.env.GOOGLE_SPREADSHEET_ID}`);
    const data = await getSheetData('Nguoi_dung');
    logs.push(`- Đọc thành công! Tổng số dòng: ${data.length}`);

    return NextResponse.json({
      success: true,
      data_length: data.length,
      logs
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : undefined;
    return NextResponse.json({
      success: false,
      error: errorMessage,
      stack: errorStack,
      logs: ['LỖI TẠI ĐÂY:']
    }, { status: 500 });
  }
}

