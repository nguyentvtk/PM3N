import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

import { getNguoiDungByEmail, appendLog } from '@/lib/sheets';
import type { ExtendedUser } from '@/types';

export const authOptions: NextAuthOptions = {
  providers: [
    // ── Google OAuth2 ────────────────────────────────────────
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // ── Email / Password ─────────────────────────────────────
    CredentialsProvider({
      id: 'credentials',
      name: 'Email & Mật khẩu',
      credentials: {
        email:    { label: 'Email',     type: 'email'    },
        password: { label: 'Mật khẩu', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          console.log(`[auth] Đăng nhập: email="${credentials.email}"`);
          const nguoiDung = await getNguoiDungByEmail(credentials.email);

          if (!nguoiDung) {
            console.log(`[auth] ❌ Không tìm thấy email: ${credentials.email}`);
            throw new Error('EMAIL_NOT_FOUND');
          }
          console.log(`[auth] ✅ Tìm thấy user: ${nguoiDung.Ten} (${nguoiDung.MaNV})`);

          if (!nguoiDung.MatKhau) {
            console.log(`[auth] ❌ User không có MatKhau → yêu cầu Google login`);
            throw new Error('USE_GOOGLE_LOGIN');
          }

          // So sánh plain text, trim() để loại bỏ khoảng trắng thừa từ Sheet
          const inputPw = credentials.password.trim();
          const sheetPw = nguoiDung.MatKhau.trim();
          console.log(`[auth] So sánh mật khẩu: input(${inputPw.length} ký tự) vs sheet(${sheetPw.length} ký tự)`);

          if (inputPw !== sheetPw) {
            console.log(`[auth] ❌ Mật khẩu không khớp`);
            throw new Error('WRONG_PASSWORD');
          }

          console.log(`[auth] ✅ Đăng nhập thành công: ${nguoiDung.Ten}`);
          // Ghi log
          await appendLog('', 'DANG_NHAP', `${nguoiDung.Ten} (${nguoiDung.MaNV}) đăng nhập qua credentials`).catch(console.error);

          return {
            id:     nguoiDung.MaNV,
            email:  nguoiDung.Email,
            name:   nguoiDung.Ten,
            image:  nguoiDung.Avatar ?? null,
          };
        } catch (err: unknown) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const error = err as any;
          console.error('[auth] ❌ Lỗi khi authorize Credentials:', error.message);
          if (error.response) {
            console.error('[auth] Google API Error:', JSON.stringify(error.response.data));
          }
          if (err instanceof Error) throw err;
          throw new Error('UNKNOWN_ERROR');
        }
      },
    }),
  ],

  pages: {
    signIn: '/login',
    error:  '/login',
  },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        if (!user.email) return false;
        try {
          const nguoiDung = await getNguoiDungByEmail(user.email);
          if (!nguoiDung) {
            console.warn(`🚫 Google email không được cấp quyền: ${user.email}`);
            return '/login?error=AccessDenied';
          }
          await appendLog('', 'DANG_NHAP', `${nguoiDung.Ten} (${nguoiDung.MaNV}) đăng nhập qua Google`).catch(console.error);
        } catch (err) {
          console.error('signIn callback error:', err);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user, trigger }) {
      if (user?.email || trigger === 'update') {
        const email = (user?.email ?? token.email) as string;
        if (email) {
          const nguoiDung = await getNguoiDungByEmail(email).catch(() => null);
          if (nguoiDung) {
            token.maNV   = nguoiDung.MaNV;
            token.vaiTro = nguoiDung.VaiTro;
            token.chucVu = nguoiDung.ChucVu;
            token.ten    = nguoiDung.Ten;
          }
        }
      }
      return token;
    },

    async session({ session, token }) {
      const u = session.user as ExtendedUser;
      u.maNV   = token.maNV   as string;
      u.vaiTro = token.vaiTro as ExtendedUser['vaiTro'];
      u.chucVu = token.chucVu as string;
      if (token.ten) u.name = token.ten as string;
      return session;
    },
  },

  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  jwt:     { maxAge: 8 * 60 * 60 },
};
