import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { updateHoSoStatus, appendLog } from '@/lib/sheets';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
  }

  // Phê duyệt chỉ dành cho Lãnh đạo hoặc Admin
  const vaiTro = (session.user as { vaiTro?: string }).vaiTro;
  if (vaiTro !== 'lanh_dao' && vaiTro !== 'admin') {
    return NextResponse.json({ success: false, error: 'Bạn không có quyền phê duyệt hồ sơ' }, { status: 403 });
  }

  try {
    const { maHoSo } = await req.json();
    if (!maHoSo) {
      return NextResponse.json({ success: false, error: 'Thiếu maHoSo' }, { status: 400 });
    }

    // Cập nhật trạng thái trực tiếp qua Google Sheets API (ổn định, không phụ thuộc GAS)
    const updated = await updateHoSoStatus(maHoSo, 'da_duyet');
    if (!updated) {
      return NextResponse.json({ success: false, error: `Không tìm thấy hồ sơ: ${maHoSo}` }, { status: 404 });
    }

    // Ghi log phê duyệt
    await appendLog(maHoSo, 'DUYET', `Phê duyệt bởi ${session.user.name || session.user.email}`);

    // Thử gọi GAS để chuyển đổi PDF (không bắt buộc, nếu lỗi vẫn tiếp tục)
    const gasUrl = process.env.GAS_WEB_APP_URL;
    let pdfUrl = '';
    if (gasUrl) {
      try {
        const gasRes = await fetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resource: 'drive',
            action: 'approve_and_convert',
            data: { MaHoSo: maHoSo },
          }),
        });
        const gasResult = await gasRes.json();
        if (gasResult.success && gasResult.data?.pdfUrl) {
          pdfUrl = gasResult.data.pdfUrl;
          // Cập nhật LinkKySo với URL của file PDF vừa tạo
          await updateHoSoStatus(maHoSo, 'da_duyet', pdfUrl);
        }
      } catch (gasErr) {
        // GAS chuyển PDF thất bại — bỏ qua, không block workflow
        console.warn('[ho-so/approve] GAS PDF convert failed (non-blocking):', gasErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Hồ sơ đã được phê duyệt thành công',
      data: { maHoSo, trangThai: 'da_duyet', pdfUrl }
    });

  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Lỗi không xác định';
    console.error('[ho-so/approve] Error:', err);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
