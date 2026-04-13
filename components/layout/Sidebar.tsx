'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { ExtendedUser } from '@/types';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  requiredRoles?: string[]; // undefined = mọi role đều thấy
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/ho-so',
    label: 'Hồ Sơ',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: '/soan-thao',
    label: 'Soạn thảo',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    href: '/nguoi-dung',
    label: 'Người Dùng',
    requiredRoles: ['admin'],
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    href: '/van-thu',
    label: 'Văn thư',
    requiredRoles: ['admin', 'van_thu'],
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    href: '/log',
    label: 'Nhật Ký',
    requiredRoles: ['admin', 'van_thu', 'lanh_dao', 'ke_toan'],
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
];


export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const vaiTro = (session?.user as ExtendedUser | undefined)?.vaiTro ?? '';

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.requiredRoles) return true;
    return item.requiredRoles.includes(vaiTro);
  });

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="px-6 pb-6 mb-2 border-b border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm brand-gradient">
            CK
          </div>
          <div>
            <div className="font-semibold text-sm text-primary">
              Công Văn
            </div>
            <div className="text-xs text-muted">
              PM3N — Ký Số
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-2">
        <div className="px-6 mb-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted">
            Chức năng
          </span>
        </div>
        {visibleItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Version */}
      <div className="absolute bottom-4 left-0 right-0 px-6">
        <div className="text-xs text-center text-muted">
          v1.0.0 · PM3N Workspace
        </div>
      </div>
    </aside>
  );
}
