/**
 * API Route: /api/sheets/log
 * GET ?limit=100&maHoSo=&hanhDong= — Lấy log hệ thống
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getAllLogs } from '@/lib/sheets';
import type { ExtendedUser } from '@/types';

function apiResponse<T>(data: T, status = 200) {
  return NextResponse.json(
    { success: true, timestamp: new Date().toISOString(), data, count: Array.isArray(data) ? data.length : undefined },
    { status }
  );
}

function apiError(message: string, status = 400) {
  return NextResponse.json(
    { success: false, timestamp: new Date().toISOString(), error: { code: status, message }, data: null },
    { status }
  );
}

// GET /api/sheets/log
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return apiError('Chưa đăng nhập', 401);

  // Chỉ admin xem được toàn bộ log
  const user = session.user as ExtendedUser;
  if (user.vaiTro !== 'admin' && user.vaiTro !== 'lanh_dao') {
    return apiError('Không có quyền xem log hệ thống', 403);
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') ?? '100', 10);
    const maHoSo = searchParams.get('maHoSo');
    const hanhDong = searchParams.get('hanhDong');

    let data = await getAllLogs(limit);

    if (maHoSo) data = data.filter((l) => l.MaHoSo === maHoSo);
    if (hanhDong) data = data.filter((l) => l.HanhDong === hanhDong);

    return apiResponse(data.slice(0, limit));
  } catch (err) {
    console.error('GET /api/sheets/log:', err);
    return apiError('Lỗi server', 500);
  }
}
