/**
 * Nodemailer Email Helper - Server-side only
 * Dùng Gmail SMTP + App Password
 */
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT ?? '587'),
  secure: false, // TLS (STARTTLS)
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASSWORD!,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? `"PM3N Công Văn" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

/**
 * Gửi email đặt lại mật khẩu
 */
export async function sendResetPasswordEmail(
  to: string,
  tenNguoiDung: string,
  resetUrl: string
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Đặt lại mật khẩu</title>
<style>
  body { margin: 0; padding: 0; background: #0a0f1e; font-family: 'Segoe UI', Arial, sans-serif; }
  .wrapper { max-width: 560px; margin: 40px auto; }
  .card {
    background: linear-gradient(135deg, #0f172a, #131d35);
    border: 1px solid rgba(148,163,184,0.15);
    border-radius: 20px;
    padding: 40px;
  }
  .logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 52px; height: 52px;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    border-radius: 14px;
    margin-bottom: 24px;
  }
  h1 { color: #f1f5f9; font-size: 22px; font-weight: 700; margin: 0 0 8px; }
  p  { color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 20px; }
  .btn {
    display: inline-block;
    padding: 14px 32px;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: #fff !important;
    text-decoration: none;
    border-radius: 12px;
    font-weight: 600;
    font-size: 15px;
    box-shadow: 0 8px 24px rgba(59,130,246,0.3);
  }
  .divider { border: none; border-top: 1px solid rgba(148,163,184,0.1); margin: 28px 0; }
  .footer { color: #475569; font-size: 12px; text-align: center; }
  .url-box {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    padding: 10px 14px;
    word-break: break-all;
    color: #64748b;
    font-size: 12px;
    font-family: monospace;
    margin-top: 16px;
  }
</style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="logo">
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="1.8">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
      </svg>
    </div>
    <h1>Đặt lại mật khẩu</h1>
    <p>Xin chào <strong style="color:#f1f5f9">${tenNguoiDung}</strong>,</p>
    <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn trên hệ thống <strong style="color:#3b82f6">PM3N Công Văn & Ký Số</strong>.</p>
    <p>Nhấn vào nút bên dưới để đặt lại mật khẩu. Link có hiệu lực trong <strong style="color:#f59e0b">30 phút</strong>.</p>
    <a href="${resetUrl}" class="btn">🔑 Đặt lại mật khẩu</a>
    <p style="margin-top:20px; font-size:13px">Hoặc copy link này vào trình duyệt:</p>
    <div class="url-box">${resetUrl}</div>
    <hr class="divider" />
    <p style="font-size:13px; color:#475569">
      Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này. Mật khẩu của bạn sẽ không thay đổi.
    </p>
    <div class="footer">
      © 2026 PM3N Workspace · Hệ thống Quản lý Công văn Nội bộ
    </div>
  </div>
</div>
</body>
</html>
  `.trim();

  await sendEmail({
    to,
    subject: '🔑 Đặt lại mật khẩu — PM3N Công Văn',
    html,
  });
}
