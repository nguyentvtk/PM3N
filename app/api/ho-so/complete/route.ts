import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';

// No unused imports here


export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const { maHoSo, soVanBan } = await req.json();
  if (!maHoSo || !soVanBan) {
    return NextResponse.json({ success: false, error: 'Thiếu maHoSo hoặc soVanBan' }, { status: 400 });
  }

  const gasUrl = process.env.GAS_WEB_APP_URL;
  if (!gasUrl) {
    return NextResponse.json({ success: false, error: 'GAS_WEB_APP_URL chưa cấu hình' }, { status: 500 });
  }

  try {
    const gasRes = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resource: 'drive',
        action:   'move_to_official',
        data:     { MaHoSo: maHoSo, SoVanBan: soVanBan },
      }),
      redirect: 'follow',
    });

    const result = await gasRes.json();
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error?.message || 'GAS xử lý thất bại' }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: result.data
    });

  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Lỗi không xác định';
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
