import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { createHoSo, getNextHoSoId, appendLog } from '@/lib/sheets';
import type { ExtendedUser, HoSo } from '@/types';
import { sendTelegramNotification } from '@/lib/telegram';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const user = session.user as ExtendedUser;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const maDA = formData.get('maDA') as string;
    const tenDuan = formData.get('tenDuan') as string;
    const loaiVanBan = formData.get('loaiVanBan') as string;
    const tenTaiLieu = formData.get('tenTaiLieu') as string;
    const mucDo = (formData.get('mucDo') as HoSo['MucDo']) || 'Thường';

    if (!file || !maDA || !tenDuan || !loaiVanBan || !tenTaiLieu) {
      return NextResponse.json({ success: false, error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    // 1. Chuyển file sang Base64 để gửi qua GAS
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64File = buffer.toString('base64');

    // 2. Gọi GAS để lưu file vào thư mục /DuAn/[MaDA]/Draft/
    const gasUrl = process.env.GAS_WEB_APP_URL;
    if (!gasUrl) {
      return NextResponse.json({ success: false, error: 'Chưa cấu hình GAS URL' }, { status: 500 });
    }

    const gasRes = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resource: 'drive',
        action: 'upload_draft',
        data: {
          maDA,
          tenDuan,
          fileName: file.name,
          fileContent: base64File
        }
      }),
      redirect: 'follow'
    });

    const gasResult = await gasRes.json();
    if (!gasResult.success) {
      return NextResponse.json({ success: false, error: gasResult.error?.message || 'Lỗi từ GAS' }, { status: 502 });
    }

    const fileUrl = gasResult.data.fileUrl;

    // 3. Tạo bản ghi hồ sơ mới trong Sheets
    const maHoSo = await getNextHoSoId();
    const newHoSo: HoSo = {
      MaHoSo: maHoSo,
      MaDA: maDA,
      TenTaiLieu: tenTaiLieu,
      LoaiVanBan: loaiVanBan,
      NguoiTrinh: user.maNV || '',
      LanhDaoDuyet: '', // Sẽ cập nhật khi trình
      MucDo: mucDo,
      NgayTrinh: new Date().toISOString(),
      TrangThai: 'cho_trinh',
      FilePath: fileUrl,
      LinkKySo: '',
      TenDuan: tenDuan
    };

    await createHoSo(newHoSo);

    // 4. Gửi thông báo Telegram
    await sendTelegramNotification({
      id: maHoSo,
      projectName: tenDuan,
      documentName: tenTaiLieu,
      priority: mucDo === 'Khẩn' ? 'Gấp' : 'Thường',
      status: 'Mới khởi tạo / Đang soạn thảo',
      timestamp: newHoSo.NgayTrinh
    });

    // 5. Ghi log
    await appendLog(maHoSo, 'TAO_MOI', `Soạn thảo hồ sơ mới: ${tenTaiLieu} (${loaiVanBan})`);

    return NextResponse.json({
      success: true,
      data: newHoSo
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API Draft Error]:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
