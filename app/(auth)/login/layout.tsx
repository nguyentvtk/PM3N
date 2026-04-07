import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đăng nhập — PM3N Công Văn',
  description: 'Đăng nhập vào hệ thống quản lý công văn và ký số PM3N',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-4">
      {children}
    </div>
  );
}
