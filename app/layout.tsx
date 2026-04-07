import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: {
    default: 'Công Văn & Ký Số — PM3N',
    template: '%s | PM3N CongVan',
  },
  description: 'Hệ thống quản lý công văn, hồ sơ và ký số điện tử nội bộ PM3N',
  keywords: ['công văn', 'ký số', 'quản lý hồ sơ', 'PM3N'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
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
