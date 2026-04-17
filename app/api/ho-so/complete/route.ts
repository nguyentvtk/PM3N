import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { appendLog, findRowIndex, getSheetData, updateSheetRow, HO_SO_HEADERS } from '@/lib/sheets';
import type { HoSo } from '@/types';

// HO_SO_HEADERS được import từ sheets.ts

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
  }

  try {
    const { maHoSo, soVanBan } = await req.json();
    if (!maHoSo) {
      return NextResponse.json({ success: false, error: 'Thiếu maHoSo' }, { status: 400 });
    }

    // 1. Cập nhật trạng thái sang 'hoan_thanh' và ghi số văn bản qua Google Sheets API
    const rowIndex = await findRowIndex('Ho_So', 'MaHoSo', maHoSo);
    if (rowIndex === -1) {
      return NextResponse.json({ success: false, error: `Không tìm thấy hồ sơ: ${maHoSo}` }, { status: 404 });
    }

    const allData = await getSheetData<HoSo>('Ho_So');
    const current = allData.find(h => h.MaHoSo === maHoSo);
    if (!current) {
      return NextResponse.json({ success: false, error: `Không tìm thấy hồ sơ: ${maHoSo}` }, { status: 404 });
    }

    const updated: HoSo = {
      ...current,
      TrangThai: 'hoan_thanh',
      So_VB: soVanBan || current.So_VB,
    };

    await updateSheetRow('Ho_So', rowIndex, updated as unknown as Record<string, unknown>, HO_SO_HEADERS);

    // 2. Ghi log
    await appendLog(maHoSo, 'HOAN_THANH', `Hoàn thành bởi ${session.user.name || session.user.email}. Số VB: ${soVanBan}`);

    // 3. Thử gọi GAS để di chuyển file sang Official (non-blocking)
    const gasUrl = process.env.GAS_WEB_APP_URL;
    if (gasUrl) {
      try {
        await fetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resource: 'drive',
            action: 'move_to_official',
            data: { MaHoSo: maHoSo, So_VB: soVanBan },
          }),
        });
      } catch (gasErr) {
        console.warn('[ho-so/complete] GAS move_to_official failed (non-blocking):', gasErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Hồ sơ đã hoàn thành và lưu trữ',
      data: { maHoSo, soVanBan, trangThai: 'hoan_thanh' }
    });

  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Lỗi không xác định';
    console.error('[ho-so/complete] Error:', err);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
