/**
 * Google OAuth2 Authentication — Server-side
 *
 * Sử dụng Service Account để WebApp server đọc/ghi Sheets
 * mà không cần user Google login vào API layer.
 *
 * Người dùng vẫn đăng nhập qua NextAuth (Google OAuth2) —
 * nhưng đó là để xác thực danh tính, còn đọc Sheets dùng Service Account.
 */
import { JWT } from 'googleapis-common';

let _authClient: JWT | null = null;

/**
 * Trả về Google Auth client đã xác thực (cached).
 *
 * Yêu cầu env vars:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
 *   GOOGLE_SPREADSHEET_ID
 */
export async function getGoogleAuth(): Promise<JWT> {
  if (_authClient) return _authClient;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!email || !key) {
    throw new Error(
      '❌ Thiếu GOOGLE_SERVICE_ACCOUNT_EMAIL hoặc GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY trong .env.local'
    );
  }

  const client = new JWT({
    email,
    key,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.readonly',
    ],
  });

  await client.authorize();
  _authClient = client;
  return client;
}

/**
 * Xóa cache auth client (dùng khi cần refresh)
 */
export function clearAuthCache(): void {
  _authClient = null;
}
