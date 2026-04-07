import type { Metadata } from 'next';
import { NguoiDungPage } from '@/components/pages/NguoiDungPage';

export const metadata: Metadata = { title: 'Người Dùng' };

export default function NguoiDungRoute() {
  return <NguoiDungPage />;
}
