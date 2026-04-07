/**
 * API Route: /api/sheets/nguoi-dung
 * GET  — Lấy danh sách người dùng (không có MatKhau)
 * POST — Tạo người dùng mới
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getAllNguoiDung, createNguoiDung, getNguoiDungByEmail, updateNguoiDung, deleteNguoiDung } from '@/lib/sheets';
import { appendLog } from '@/lib/sheets';
import bcrypt from 'bcryptjs';
import type { NguoiDung, ExtendedUser } from '@/types';

function apiResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, timestamp: new Date().toISOString(), data }, { status });
}

function apiError(message: string, status = 400) {
  return NextResponse.json(
    { success: false, timestamp: new Date().toISOString(), error: { code: status, message }, data: null },
    { status }
  );
}

// GET /api/sheets/nguoi-dung
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return apiError('Chưa đăng nhập', 401);

  try {
    const { searchParams } = new URL(req.url);
    const vaiTro = searchParams.get('vaiTro');

    let data = await getAllNguoiDung();

    if (vaiTro) {
      data = data.filter((u) => u.VaiTro === vaiTro);
    }

    return apiResponse(data, 200);
  } catch (err) {
    console.error('GET /api/sheets/nguoi-dung:', err);
    return apiError('Lỗi server', 500);
  }
}

// POST /api/sheets/nguoi-dung
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return apiError('Chưa đăng nhập', 401);

  // Chỉ admin mới được tạo người dùng
  const user = session.user as ExtendedUser;
  if (user.vaiTro !== 'admin') return apiError('Không có quyền tạo người dùng', 403);

  try {
    const body = await req.json() as Omit<NguoiDung, 'MatKhau'> & { MatKhau: string };

    if (!body.MaNV || !body.Ten || !body.Email) {
      return apiError('Thiếu trường bắt buộc: MaNV, Ten, Email');
    }

    // Kiểm tra email trùng
    const existing = await getNguoiDungByEmail(body.Email);
    if (existing) return apiError(`Email "${body.Email}" đã tồn tại`, 409);

    // Hash mật khẩu nếu có
    const matKhau = body.MatKhau
      ? await bcrypt.hash(body.MatKhau, 10)
      : await bcrypt.hash(body.MaNV + '_default', 10); // mặc định

    await createNguoiDung({ ...body, MatKhau: matKhau });

    await appendLog('', 'TAO_MOI', `Tạo người dùng mới: ${body.MaNV} - ${body.Ten}`);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { MatKhau: _, ...safe } = { ...body, MatKhau: matKhau };
    return apiResponse(safe, 201);

  } catch (err) {
    console.error('POST /api/sheets/nguoi-dung:', err);
    return apiError('Lỗi server', 500);
  }
}

// PUT /api/sheets/nguoi-dung
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return apiError('Chưa đăng nhập', 401);

  const user = session.user as ExtendedUser;
  if (user.vaiTro !== 'admin') return apiError('Không có quyền chỉnh sửa người dùng', 403);

  try {
    const { maNV, ...data } = await req.json();
    if (!maNV) return apiError('Thiếu MaNV');

    // Nếu có đổi mật khẩu
    if (data.MatKhau) {
      data.MatKhau = await bcrypt.hash(data.MatKhau, 10);
    }

    const success = await updateNguoiDung(maNV, data);
    if (!success) return apiError('Không tìm thấy người dùng hoặc cập nhật thất bại', 404);

    await appendLog('', 'CAP_NHAT', `Cập nhật thông tin người dùng: ${maNV}`);
    return apiResponse({ maNV, ...data });

  } catch (err) {
    console.error('PUT /api/sheets/nguoi-dung:', err);
    return apiError('Lỗi server', 500);
  }
}

// DELETE /api/sheets/nguoi-dung
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return apiError('Chưa đăng nhập', 401);

  const user = session.user as ExtendedUser;
  if (user.vaiTro !== 'admin') return apiError('Không có quyền xóa người dùng', 403);

  try {
    const { searchParams } = new URL(req.url);
    const maNV = searchParams.get('maNV');
    if (!maNV) return apiError('Thiếu MaNV');

    // Chặn xóa chính mình
    if (user.maNV === maNV) return apiError('Không thể tự xóa tài khoản của chính mình');

    const success = await deleteNguoiDung(maNV);
    if (!success) return apiError('Xóa thất bại hoặc không tìm thấy người dùng', 404);

    await appendLog('', 'XOA', `Xóa người dùng: ${maNV}`);
    return apiResponse({ maNV, deleted: true });

  } catch (err) {
    console.error('DELETE /api/sheets/nguoi-dung:', err);
    return apiError('Lỗi server', 500);
  }
}
