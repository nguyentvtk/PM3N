/**
 * NextAuth.js Configuration
 * Route: /api/auth/[...nextauth]
 * 
 * Flow:
 *  1. User click "Đăng nhập với Google"
 *  2. Google trả về email đã xác thực
 *  3. Lookup email trong sheet Nguoi_dung
 *  4. Nếu tìm thấy → tạo session với MaNV + VaiTro
 *  5. Nếu không tìm thấy → báo lỗi "Tài khoản chưa được cấp quyền"
 */
import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getNguoiDungByEmail, appendLog } from '@/lib/sheets';
import type { ExtendedUser } from '@/types';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  pages: {
    signIn: '/login',
    error: '/login',
  },

  callbacks: {
    /**
     * signIn callback: Kiểm tra email có trong Nguoi_dung không
     */
    async signIn({ user }) {
      if (!user.email) return false;

      try {
        const nguoiDung = await getNguoiDungByEmail(user.email);
        if (!nguoiDung) {
          console.warn(`🚫 Email không được cấp quyền: ${user.email}`);
          return '/login?error=AccessDenied';
        }

        // Ghi log đăng nhập
        await appendLog(
          '',
          'DANG_NHAP',
          `${nguoiDung.Ten} (${nguoiDung.MaNV}) đăng nhập`
        ).catch(console.error);

        return true;
      } catch (err) {
        console.error('signIn callback error:', err);
        return false;
      }
    },

    /**
     * jwt callback: Gắn thêm MaNV và VaiTro vào JWT token
     */
    async jwt({ token, user, trigger }) {
      // Lần đầu đăng nhập
      if (user?.email || trigger === 'update') {
        const email = token.email as string;
        if (email) {
          const nguoiDung = await getNguoiDungByEmail(email).catch(() => null);
          if (nguoiDung) {
            token.maNV = nguoiDung.MaNV;
            token.vaiTro = nguoiDung.VaiTro;
            token.chucVu = nguoiDung.ChucVu;
            token.ten = nguoiDung.Ten;
          }
        }
      }
      return token;
    },

    /**
     * session callback: Map JWT claims sang session object
     */
    async session({ session, token }) {
      const extendedUser = session.user as ExtendedUser;
      extendedUser.maNV = token.maNV as string;
      extendedUser.vaiTro = token.vaiTro as ExtendedUser['vaiTro'];
      extendedUser.chucVu = token.chucVu as string;
      if (token.ten) extendedUser.name = token.ten as string;
      return session;
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 giờ (1 ngày làm việc)
  },

  jwt: {
    maxAge: 8 * 60 * 60,
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
