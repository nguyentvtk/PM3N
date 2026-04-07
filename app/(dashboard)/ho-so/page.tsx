import type { Metadata } from 'next';
import { HoSoPage } from '@/components/pages/HoSoPage';

export const metadata: Metadata = { title: 'Hồ Sơ' };

export default function HoSoRoute() {
  return <HoSoPage />;
}
