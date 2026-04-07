/**
 * API Route: /api/sheets/ho-so
 * GET  ?trangThai=&nguoiTrinh=&maDA=  — Lấy danh sách hồ sơ (có filter)
 * POST                                 — Tạo hồ sơ mới
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  getAllHoSo,
  createHoSo,
  getNextHoSoId,
  appendLog,
} from '@/lib/sheets';
import type { HoSo, ExtendedUser } from '@/types';

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

// GET /api/sheets/ho-so
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return apiError('Chưa đăng nhập', 401);

  try {
    const { searchParams } = new URL(req.url);
    const trangThai = searchParams.get('trangThai');
    const nguoiTrinh = searchParams.get('nguoiTrinh');
    const maDA = searchParams.get('maDA');

    let data = await getAllHoSo();

    // Nhân viên thường chỉ thấy hồ sơ của mình
    const user = session.user as ExtendedUser;
    if (user.vaiTro === 'nhan_vien' && user.maNV) {
      data = data.filter((h) => h.NguoiTrinh === user.maNV);
    }

    if (trangThai) data = data.filter((h) => h.TrangThai === trangThai);
    if (nguoiTrinh) data = data.filter((h) => h.NguoiTrinh === nguoiTrinh);
    if (maDA) data = data.filter((h) => h.MaDA === maDA);

    return apiResponse(data);
  } catch (err) {
    console.error('GET /api/sheets/ho-so:', err);
    return apiError('Lỗi server', 500);
  }
}

// POST /api/sheets/ho-so
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return apiError('Chưa đăng nhập', 401);

  try {
    const body = await req.json() as Partial<HoSo>;
    const user = session.user as ExtendedUser;

    if (!body.TenTaiLieu) return apiError('Thiếu TenTaiLieu');

    const newHoSo: HoSo = {
      MaHoSo: body.MaHoSo || (await getNextHoSoId()),
      MaDA: body.MaDA || '',
      TenTaiLieu: body.TenTaiLieu,
      NguoiTrinh: body.NguoiTrinh || user.maNV || '',
      LanhDaoDuyet: body.LanhDaoDuyet || '',
      MucDo: body.MucDo || 'Thường',
      NgayTrinh: body.NgayTrinh || new Date().toISOString(),
      TrangThai: 'cho_trinh',
      FilePath: body.FilePath || '',
      LinkKySo: '',
    };

    await createHoSo(newHoSo);

    await appendLog(
      newHoSo.MaHoSo,
      'TAO_MOI',
      `Hồ sơ "${newHoSo.TenTaiLieu}" được tạo bởi ${newHoSo.NguoiTrinh}`
    );

    return apiResponse(newHoSo, 201);
  } catch (err) {
    console.error('POST /api/sheets/ho-so:', err);
    return apiError('Lỗi server', 500);
  }
}
