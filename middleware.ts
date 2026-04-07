/**
 * Next.js Edge Middleware — RBAC (Role-Based Access Control)
 *
 * Bảng phân quyền Route:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ Route                        │ Public │ NV │ VT │ LD │ KT │ AD │
 * ├─────────────────────────────────────────────────────────────────┤
 * │ /login, /quen-mat-khau,      │   ✓    │    │    │    │    │    │
 * │ /dat-lai-mat-khau            │        │    │    │    │    │    │
 * ├─────────────────────────────────────────────────────────────────┤
 * │ / (Dashboard)                │        │ ✓  │ ✓  │ ✓  │ ✓  │ ✓  │
 * │ /ho-so (Danh sách)           │        │ ✓  │ ✓  │ ✓  │ ✓  │ ✓  │
 * │ /log                         │        │    │ ✓  │ ✓  │ ✓  │ ✓  │
 * ├─────────────────────────────────────────────────────────────────┤
 * │ /ho-so/create                │        │ ✓  │ ✓  │    │    │ ✓  │
 * │ /ho-so/[id]/edit             │        │ ✓  │ ✓  │    │    │ ✓  │
 * │ /ho-so/[id]/approve          │        │    │    │ ✓  │    │ ✓  │
 * │ /ho-so/[id]/sign             │        │    │ ✓  │    │    │ ✓  │
 * │ /ho-so/[id]/finalize         │        │    │    │    │ ✓  │ ✓  │
 * ├─────────────────────────────────────────────────────────────────┤
 * │ /nguoi-dung (Quản lý NV)     │        │    │    │    │    │ ✓  │
 * └─────────────────────────────────────────────────────────────────┘
 * NV=nhan_vien, VT=van_thu, LD=lanh_dao, KT=ke_toan, AD=admin
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const SECRET = process.env.NEXTAUTH_SECRET!;

// Route công khai — không cần xác thực
const PUBLIC_PATHS = [
  '/login',
  '/quen-mat-khau',
  '/dat-lai-mat-khau',
  '/ky-so-test',
  '/api/auth',          // NextAuth endpoints
  '/api/ho-so/sign',    // Để test signing API
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/_next',
  '/favicon.ico',
];

// Định nghĩa quy tắc phân quyền (ưu tiên từ trên xuống)
interface RouteRule {
  pattern: RegExp;
  allowedRoles: string[];           // rỗng = tất cả authenticated
  methods?: string[];               // undefined = tất cả methods
}

const ROUTE_RULES: RouteRule[] = [
  // Quản lý người dùng — chỉ admin
  {
    pattern: /^\/nguoi-dung/,
    allowedRoles: ['admin'],
  },
  // Log hệ thống — admin, van_thu, lanh_dao, ke_toan
  {
    pattern: /^\/log/,
    allowedRoles: ['admin', 'van_thu', 'lanh_dao', 'ke_toan'],
  },
  // Phê duyệt hồ sơ — admin, lanh_dao
  {
    pattern: /^\/ho-so\/[^/]+\/approve/,
    allowedRoles: ['admin', 'lanh_dao'],
  },
  // Ký số / lưu file — admin, van_thu
  {
    pattern: /^\/ho-so\/[^/]+\/sign/,
    allowedRoles: ['admin', 'van_thu'],
  },
  // Hoàn thiện / lưu Drive — admin, ke_toan
  {
    pattern: /^\/ho-so\/[^/]+\/finalize/,
    allowedRoles: ['admin', 'ke_toan'],
  },
  // Tạo/sửa hồ sơ — admin, van_thu, nhan_vien
  {
    pattern: /^\/ho-so\/(create|[^/]+\/edit)/,
    allowedRoles: ['admin', 'van_thu', 'nhan_vien'],
  },
  // API Admin-only
  {
    pattern: /^\/api\/sheets\/nguoi-dung/,
    allowedRoles: ['admin'],
    methods: ['POST', 'PUT', 'DELETE'],
  },
  // API Drive upload draft — tất cả authenticated users
  {
    pattern: /^\/api\/drive\/upload/,
    allowedRoles: [],  // rỗng = tất cả authenticated
  },
  // API Drive save (chính thức) — admin, ke_toan, van_thu
  {
    pattern: /^\/api\/drive/,
    allowedRoles: ['admin', 'ke_toan', 'van_thu'],
  },
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Bỏ qua các route công khai
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 2. Lấy JWT token
  const token = await getToken({ req, secret: SECRET });

  // 3. Chưa đăng nhập → redirect về login
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const vaiTro = (token.vaiTro as string) ?? '';

  // 4. Kiểm tra route rules
  for (const rule of ROUTE_RULES) {
    if (!rule.pattern.test(pathname)) continue;
    // Kiểm tra method nếu có
    if (rule.methods && !rule.methods.includes(req.method)) continue;
    // Role check
    if (rule.allowedRoles.length > 0 && !rule.allowedRoles.includes(vaiTro)) {
      // API route → 403
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: 'Không có quyền thực hiện thao tác này', vaiTro },
          { status: 403 }
        );
      }
      // Page route → redirect về dashboard với thông báo
      const dashboardUrl = new URL('/', req.url);
      dashboardUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(dashboardUrl);
    }
    break; // Rule đầu tiên khớp → dừng
  }

  // 5. Response header: truyền vaiTro để layouts biết
  const res = NextResponse.next();
  res.headers.set('x-vai-tro', vaiTro);
  res.headers.set('x-ma-nv', (token.maNV as string) ?? '');
  return res;
}

export const config = {
  matcher: [
    /*
     * Áp dụng cho tất cả routes NGOẠI TRỪ:
     * - _next/static, _next/image (Next.js assets)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
