/**
 * API Route: /api/sheets/nguoi-dung
 * GET  — Lấy danh sách người dùng (không có MatKhau)
 * POST — Tạo người dùng mới
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getAllNguoiDung, createNguoiDung, getNguoiDungByEmail } from '@/lib/sheets';
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

    const { MatKhau: _, ...safe } = { ...body, MatKhau: matKhau };
    return apiResponse(safe, 201);

  } catch (err) {
    console.error('POST /api/sheets/nguoi-dung:', err);
    return apiError('Lỗi server', 500);
  }
}
