/**
 * POST /api/drive/save
 *
 * Kích hoạt GAS để lưu file đã ký số vào thư mục dự án trên Google Drive.
 * Chỉ cho phép khi:
 *   - Người dùng đã đăng nhập
 *   - Hồ sơ có TrangThai = 'da_ky'
 *   - Vai trò: admin | ke_toan (người thực hiện đăng ký số công văn)
 *
 * Body: { maHoSo: string }
 * Response: { projectFolderName, projectFolderUrl, savedFileUrl, ... }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import type { ExtendedUser } from '@/types';
import { getHoSoById } from '@/lib/sheets';

export async function POST(req: NextRequest) {
  // Auth check
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const user = session.user as ExtendedUser;
  const allowedRoles = ['admin', 'ke_toan'];
  if (!user.vaiTro || !allowedRoles.includes(user.vaiTro)) {
    return NextResponse.json(
      { success: false, error: 'Không có quyền thực hiện thao tác này' },
      { status: 403 }
    );
  }

  // Parse body
  let body: { maHoSo?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body không hợp lệ' }, { status: 400 });
  }

  const { maHoSo } = body;
  if (!maHoSo) {
    return NextResponse.json({ success: false, error: 'Thiếu maHoSo' }, { status: 400 });
  }

  // Kiểm tra hồ sơ tồn tại và đã ký
  try {
    const hoSo = await getHoSoById(maHoSo);
    if (!hoSo) {
      return NextResponse.json({ success: false, error: `Không tìm thấy hồ sơ: ${maHoSo}` }, { status: 404 });
    }
    if (hoSo.TrangThai !== 'da_ky') {
      return NextResponse.json(
        { success: false, error: `Hồ sơ chưa được ký số. Trạng thái hiện tại: ${hoSo.TrangThai}` },
        { status: 422 }
      );
    }
  } catch (err) {
    console.error('[drive/save] Lỗi kiểm tra hồ sơ:', err);
    // Tiếp tục dù không check được — để GAS xử lý
  }

  // Gọi GAS Web App
  const gasUrl = process.env.GAS_WEB_APP_URL;
  if (!gasUrl) {
    return NextResponse.json(
      { success: false, error: 'GAS_WEB_APP_URL chưa được cấu hình trong .env.local' },
      { status: 500 }
    );
  }

  try {
    const gasRes = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resource: 'drive',
        action:   'save_to_drive',
        data:     { MaHoSo: maHoSo },
      }),
      // GAS Web App cần redirect follow
      redirect: 'follow',
    });

    if (!gasRes.ok) {
      const text = await gasRes.text();
      console.error('[drive/save] GAS error:', text);
      return NextResponse.json(
        { success: false, error: 'GAS trả về lỗi: ' + gasRes.status },
        { status: 502 }
      );
    }

    const result = await gasRes.json();

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error?.message ?? 'GAS xử lý thất bại' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: result.data,
    });

  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Lỗi không xác định';
    console.error('[drive/save] Fetch GAS error:', errMsg);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
