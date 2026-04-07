'use client';
import { useSession, signOut } from 'next-auth/react';
import type { ExtendedUser } from '@/types';
import { VAI_TRO_CONFIG } from '@/lib/utils';

export function Topbar() {
  const { data: session } = useSession();
  const user = session?.user as ExtendedUser | undefined;

  return (
    <header className="topbar">
      <div className="flex-1" />

      <div className="flex items-center gap-4">
        {/* Thông tin user */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-primary">
                {user.name}
              </div>
              <div className={`text-xs ${VAI_TRO_CONFIG[user.vaiTro || '']?.color ?? 'text-slate-400'}`}>
                {VAI_TRO_CONFIG[user.vaiTro || '']?.label ?? user.vaiTro}
              </div>
            </div>

            {/* Avatar */}
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name ?? ''}
                className="w-9 h-9 rounded-full border-2 border-blue-500/40"
              />
            ) : (
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white brand-gradient">
                {user.name?.[0] ?? 'U'}
              </div>
            )}

            {/* Logout */}
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="btn-secondary !px-3 !py-2"
              title="Đăng xuất"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
