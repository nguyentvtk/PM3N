import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';

/**
 * POST /api/drive/upload
 *
 * Proxy request tới GAS Web App để upload file vào Google Drive.
 * GAS chạy với quota của Google Account owner → không bị hạn chế quota Service Account.
 *
 * Body: { maDA, tenDuan, fileName, fileContent (base64), subFolder? }
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: 'Chưa đăng nhập' },
      { status: 401 }
    );
  }

  const gasUrl = process.env.GAS_WEB_APP_URL;
  if (!gasUrl) {
    return NextResponse.json(
      { success: false, error: 'Chưa cấu hình GAS_WEB_APP_URL trong môi trường' },
      { status: 500 }
    );
  }

  try {
    const { maDA, tenDuan, fileName, fileContent, subFolder } = await req.json();

    if (!maDA || !tenDuan || !fileName || !fileContent) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin bắt buộc: maDA, tenDuan, fileName, fileContent' },
        { status: 400 }
      );
    }

    // Gọi GAS Web App — chạy với quota Drive của Google Account owner
    const gasRes = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resource: 'drive',
        action: 'upload_file',
        data: {
          maDA,
          tenDuan,
          fileName,
          fileContent,  // base64 string
          subFolder: subFolder || 'Draft',
        },
      }),
    });

    const gasJson = await gasRes.json();

    if (!gasJson.success) {
      const errMsg = gasJson.error?.message || gasJson.error || 'GAS upload thất bại';
      console.error('[Drive Upload GAS Error]:', errMsg);
      return NextResponse.json(
        { success: false, error: errMsg },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        fileUrl:  gasJson.data?.fileUrl  ?? '',
        fileId:   gasJson.data?.fileId   ?? '',
        fileName: gasJson.data?.fileName ?? fileName,
      },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[Drive Upload Error]:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
