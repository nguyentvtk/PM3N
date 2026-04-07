import type { Metadata } from 'next';
import { LogPage } from '@/components/pages/LogPage';

export const metadata: Metadata = { title: 'Nhật Ký Hệ Thống' };

export default function LogRoute() {
  return <LogPage />;
}
