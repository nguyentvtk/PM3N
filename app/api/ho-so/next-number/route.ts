import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { calculateNextSoVanBan } from '@/lib/van-thu';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
  }

  try {
    const nextNumber = await calculateNextSoVanBan();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        nextNumber: nextNumber,
        suggested: nextNumber.toString()
      }
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Lỗi không xác định';
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
