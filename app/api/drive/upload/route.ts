import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { uploadFileToDrive } from '@/lib/drive';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
  }

  try {
    const { maDA, tenDuan, fileName, fileContent, subFolder } = await req.json();

    if (!maDA || !tenDuan || !fileName || !fileContent) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin bắt buộc: maDA, tenDuan, fileName, fileContent' },
        { status: 400 }
      );
    }

    const result = await uploadFileToDrive(
      maDA,
      tenDuan,
      fileName,
      fileContent,
      subFolder || 'Draft'
    );

    return NextResponse.json({
      success: true,
      data: {
        fileUrl:  result.fileUrl,
        fileId:   result.fileId,
        fileName: result.fileName,
      },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[API Drive Upload Error]:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
