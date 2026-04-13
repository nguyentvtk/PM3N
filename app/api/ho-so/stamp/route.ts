import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { updateHoSoStatus, appendLog } from '@/lib/sheets';

/**
 * POST /api/ho-so/stamp
 * Xác nhận đóng dấu — cập nhật trạng thái hồ sơ sang 'da_ky'
 * 
 * Trong hệ thống nội bộ, thao tác đóng dấu vật lý sẽ do văn thư thực hiện ngoài hệ thống.
 * API này chỉ ghi nhận rằng bước đóng dấu đã được xác nhận.
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

    // Cập nhật trạng thái sang 'da_ky' 
    const updated = await updateHoSoStatus(maHoSo, 'da_ky');
    if (!updated) {
      return NextResponse.json({ success: false, error: `Không tìm thấy hồ sơ: ${maHoSo}` }, { status: 404 });
    }

    // Ghi log bao gồm tọa độ đã chọn
    const coordInfo = (x !== undefined && y !== undefined) 
      ? ` | Vị trí: (${x}%, ${y}%) trang ${(pageIndex ?? 0) + 1}` 
      : '';
    await appendLog(
      maHoSo, 
      'KY_SO', 
      `Xác nhận đóng dấu bởi ${session.user.name || session.user.email}${coordInfo}`
    );

    return NextResponse.json({
      success: true,
      message: 'Đã xác nhận đóng dấu thành công',
      data: {
        maHoSo,
        trangThai: 'da_ky',
        coords: { x, y, pageIndex }
      }
    });

  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Lỗi không xác định';
    console.error('[ho-so/stamp] Error:', err);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
