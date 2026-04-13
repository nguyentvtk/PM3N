import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
  }

  // Phê duyệt chỉ dành cho Lãnh đạo hoặc Admin
  const vaiTro = (session.user as { vaiTro?: string }).vaiTro;
  if (vaiTro !== 'lanh_dao' && vaiTro !== 'admin') {
    return NextResponse.json({ success: false, error: 'Bạn không có quyền phê duyệt hồ sơ' }, { status: 403 });
  }

  try {
    const { maHoSo } = await req.json();
    if (!maHoSo) {
      return NextResponse.json({ success: false, error: 'Thiếu maHoSo' }, { status: 400 });
    }

    const gasUrl = process.env.GAS_WEB_APP_URL;
    if (!gasUrl) {
      return NextResponse.json({ success: false, error: 'GAS_WEB_APP_URL chưa cấu hình' }, { status: 500 });
    }

    // Gọi GAS để phê duyệt và chuyển đổi PDF
    const gasRes = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resource: 'drive',
        action: 'approve_and_convert',
        data: { MaHoSo: maHoSo },
      }),
      redirect: 'follow',
    });

    const result = await gasRes.json();
    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error?.message || 'Lỗi khi phê duyệt qua GAS proxy' 
      }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      message: 'Hồ sơ đã được phê duyệt và chuyển đổi sang PDF thành công',
      data: result.data
    });

  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Lỗi không xác định';
    console.error('[ho-so/approve] Error:', err);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
