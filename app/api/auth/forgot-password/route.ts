/**
 * POST /api/auth/forgot-password
 * Gửi email chứa link đặt lại mật khẩu (JWT token, exp 30 phút)
 */
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getNguoiDungByEmail, appendLog } from '@/lib/sheets';
import { sendResetPasswordEmail } from '@/lib/email';

const SECRET = process.env.RESET_PASSWORD_SECRET ?? process.env.NEXTAUTH_SECRET!;

export async function POST(req: NextRequest) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body không hợp lệ' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ success: false, error: 'Vui lòng nhập email' }, { status: 400 });
  }

  // Luôn trả về 200 để tránh enumerate email (bảo mật)
  const generic = NextResponse.json({
    success: true,
    message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.',
  });

  try {
    const nguoiDung = await getNguoiDungByEmail(email);
    if (!nguoiDung) return generic; // email không tồn tại → vẫn trả 200

    // Tạo JWT token cho link reset (exp: 30 phút)
    const token = jwt.sign(
      { email, maNV: nguoiDung.MaNV, purpose: 'reset_password' },
      SECRET,
      { expiresIn: '30m' }
    );

    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3001';
    const resetUrl = `${baseUrl}/dat-lai-mat-khau?token=${token}`;

    await sendResetPasswordEmail(nguoiDung.Email, nguoiDung.Ten, resetUrl);
    await appendLog('', 'QUEN_MAT_KHAU', `Gửi link reset MK cho ${nguoiDung.Ten} (${email})`).catch(console.error);

    console.log(`✉️  Reset password email sent to ${email}`);
  } catch (err) {
    // Log server-side nhưng vẫn trả 200 để không tiết lộ thông tin
    console.error('[forgot-password] Error:', err);
  }

  return generic;
}
