import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { getSettingProjects, getLanhDaoList } from '@/lib/sheets';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
  }

  try {
    const [projects, lanhDaoList] = await Promise.all([
      getSettingProjects(),
      getLanhDaoList(),
    ]);

    return NextResponse.json({
      success: true,
      data: { projects, lanhDaoList },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('[API Settings Error]:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
