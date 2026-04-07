/**
 * API Route: /api/sheets/ho-so/[id]
 * GET   — Lấy chi tiết 1 hồ sơ
 * PATCH — Cập nhật trạng thái hồ sơ
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getHoSoByMa, updateHoSoStatus, appendLog } from '@/lib/sheets';
import type { ExtendedUser, TrangThaiHoSo } from '@/types';

function apiResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, timestamp: new Date().toISOString(), data }, { status });
}

function apiError(message: string, status = 400) {
  return NextResponse.json(
    { success: false, timestamp: new Date().toISOString(), error: { code: status, message }, data: null },
    { status }
  );
}

// GET /api/sheets/ho-so/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return apiError('Chưa đăng nhập', 401);

  try {
    const hoSo = await getHoSoByMa(params.id);
    if (!hoSo) return apiError(`Không tìm thấy MaHoSo: ${params.id}`, 404);

    // Nhân viên chỉ xem hồ sơ của mình
    const user = session.user as ExtendedUser;
    if (user.vaiTro === 'nhan_vien' && hoSo.NguoiTrinh !== user.maNV) {
      return apiError('Không có quyền xem hồ sơ này', 403);
    }

    return apiResponse(hoSo);
  } catch (err) {
    console.error(`GET /api/sheets/ho-so/${params.id}:`, err);
    return apiError('Lỗi server', 500);
  }
}

// PATCH /api/sheets/ho-so/[id]
// Body: { trangThai: TrangThaiHoSo, linkKySo?: string }
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return apiError('Chưa đăng nhập', 401);

  const user = session.user as ExtendedUser;

  try {
    const body = await req.json() as { trangThai: TrangThaiHoSo; linkKySo?: string };
    if (!body.trangThai) return apiError('Thiếu trangThai');

    // Phân quyền cập nhật trạng thái
    const vaiTro = user.vaiTro;
    const newStatus = body.trangThai;

    const allowedTransitions: Record<string, TrangThaiHoSo[]> = {
      nhan_vien: ['cho_trinh'],           // Nộp lên
      lanh_dao: ['da_duyet', 'tu_choi'],  // Duyệt hoặc từ chối
      ke_toan: ['dang_ky', 'da_ky'],      // Ký số
      admin: ['cho_trinh', 'dang_duyet', 'da_duyet', 'tu_choi', 'dang_ky', 'da_ky', 'hoan_thanh'],
    };

    const allowed = allowedTransitions[vaiTro || ''] ?? [];
    if (!allowed.includes(newStatus)) {
      return apiError(`Vai trò "${vaiTro}" không được phép đổi trạng thái sang "${newStatus}"`, 403);
    }

    const updated = await updateHoSoStatus(params.id, newStatus, body.linkKySo);
    if (!updated) return apiError(`Không tìm thấy MaHoSo: ${params.id}`, 404);

    // Map hành động log theo trạng thái
    const hanhDongMap: Partial<Record<TrangThaiHoSo, string>> = {
      da_duyet: 'DUYET',
      tu_choi: 'TU_CHOI',
      da_ky: 'KY_SO',
    };

    await appendLog(
      params.id,
      (hanhDongMap[newStatus] ?? 'CAP_NHAT') as any,
      `Trạng thái → ${newStatus} bởi ${user.maNV}`
    );

    return apiResponse({ MaHoSo: params.id, TrangThai: newStatus });
  } catch (err) {
    console.error(`PATCH /api/sheets/ho-so/${params.id}:`, err);
    return apiError('Lỗi server', 500);
  }
}
