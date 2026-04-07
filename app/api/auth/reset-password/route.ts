/**
 * POST /api/auth/reset-password
 * Xác thực JWT token và đặt lại mật khẩu mới
 */
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { updateNguoiDungPassword, appendLog } from '@/lib/sheets';

const SECRET = process.env.RESET_PASSWORD_SECRET ?? process.env.NEXTAUTH_SECRET!;

interface ResetTokenPayload {
  email: string;
  maNV: string;
  purpose: string;
}

export async function POST(req: NextRequest) {
  let body: { token?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body không hợp lệ' }, { status: 400 });
  }

  const { token, newPassword } = body;

  if (!token) {
    return NextResponse.json({ success: false, error: 'Token không hợp lệ hoặc đã hết hạn' }, { status: 400 });
  }
  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ success: false, error: 'Mật khẩu phải có ít nhất 8 ký tự' }, { status: 400 });
  }

  // Verify JWT
  let payload: ResetTokenPayload;
  try {
    payload = jwt.verify(token, SECRET) as ResetTokenPayload;
  } catch (err) {
    const isExpired = err instanceof jwt.TokenExpiredError;
    return NextResponse.json(
      { success: false, error: isExpired ? 'Link đã hết hạn (30 phút). Vui lòng yêu cầu lại.' : 'Token không hợp lệ' },
      { status: 401 }
    );
  }

  if (payload.purpose !== 'reset_password') {
    return NextResponse.json({ success: false, error: 'Token không hợp lệ' }, { status: 401 });
  }

  // Hash mật khẩu mới
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Cập nhật Sheet
  const updated = await updateNguoiDungPassword(payload.email, hashedPassword);
  if (!updated) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy tài khoản' }, { status: 404 });
  }

  await appendLog('', 'RESET_PASSWORD', `Đặt lại mật khẩu thành công cho ${payload.email}`).catch(console.error);

  return NextResponse.json({
    success: true,
    message: 'Mật khẩu đã được cập nhật thành công. Vui lòng đăng nhập lại.',
  });
}
