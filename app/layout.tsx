import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: 'Văn Phòng Số — PM3N',
    template: '%s | PM3N Office',
  },
  description: 'Hệ thống quản lý công văn, hồ sơ và ký số điện tử nội bộ PM3N',
  keywords: ['công văn', 'ký số', 'quản lý hồ sơ', 'PM3N', 'văn phòng số'],
  icons: {
    icon: '/assets/Logo-TanPhu.ico',
    shortcut: '/assets/Logo-TanPhu.ico',
    apple: '/assets/Logo-TanPhu.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning className={cn("font-sans", inter.variable)}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
