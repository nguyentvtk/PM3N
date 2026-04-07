import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
  }

  try {
    const { maDA, tenDuan, fileName, fileContent, subFolder } = await req.json();

    if (!maDA || !tenDuan || !fileName || !fileContent) {
      return NextResponse.json({ success: false, error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    const gasUrl = process.env.GAS_WEB_APP_URL;
    if (!gasUrl) {
      return NextResponse.json({ success: false, error: 'Chưa cấu hình GAS URL' }, { status: 500 });
    }

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
          fileContent,
          subFolder: subFolder || 'Draft'
        }
      }),
      redirect: 'follow'
    });

    const gasResult = await gasRes.json();
    if (!gasResult.success) {
      return NextResponse.json({ success: false, error: gasResult.error?.message || 'Lỗi từ GAS' }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      data: {
        fileUrl: gasResult.data.fileUrl,
        fileId: gasResult.data.fileId
      }
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API Drive Upload Error]:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
