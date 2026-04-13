import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================
// CONFIGURATIONS
// ============================================================

export interface StatusConfig {
  label: string;
  bg: string;
  color: string;
}

export const VAI_TRO_CONFIG: Record<string, StatusConfig> = {
  admin:     { label: 'Quản trị viên', bg: 'bg-red-500/10',    color: 'text-red-500' },
  lanh_dao:  { label: 'Lãnh đạo',      bg: 'bg-blue-500/10',   color: 'text-blue-500' },
  van_thu:   { label: 'Văn thư',       bg: 'bg-purple-500/10', color: 'text-purple-500' },
  nhan_vien: { label: 'Nhân viên',     bg: 'bg-green-500/10',  color: 'text-green-500' },
  ke_toan:   { label: 'Kế toán',       bg: 'bg-yellow-500/10', color: 'text-yellow-500' },
};

export const TRANG_THAI_CONFIG: Record<string, StatusConfig> = {
  cho_trinh:  { label: 'Chờ trình',    bg: 'bg-slate-500/10',  color: 'text-slate-500' },
  dang_duyet: { label: 'Đang duyệt',   bg: 'bg-blue-500/10',   color: 'text-blue-500' },
  da_duyet:   { label: 'Đã duyệt',    bg: 'bg-indigo-500/10', color: 'text-indigo-500' },
  tu_choi:    { label: 'Từ chối',      bg: 'bg-red-500/10',    color: 'text-red-500' },
  dang_ky:    { label: 'Đang ký số',   bg: 'bg-purple-500/10', color: 'text-purple-500' },
  da_ky:      { label: 'Đã ký số',    bg: 'bg-green-500/10',  color: 'text-green-500' },
  hoan_thanh: { label: 'Hoàn thành',  bg: 'bg-emerald-600/10', color: 'text-emerald-600' },
};

export function getTrangThaiConfig(trangThai: string): StatusConfig {
  return TRANG_THAI_CONFIG[trangThai] || { label: trangThai, bg: 'bg-slate-500/10', color: 'text-slate-500' };
}


export const MUC_DO_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  'Thường':       { label: 'Thường',       bg: 'bg-slate-500/10',  color: 'text-slate-400' },
  'Khẩn':        { label: 'Khẩn',        bg: 'bg-orange-500/10', color: 'text-orange-500 font-bold' },
  'Thượng khẩn': { label: 'Thượng khẩn', bg: 'bg-red-500/10',    color: 'text-red-500 font-bold animate-pulse' },
  'Mật':         { label: 'Mật',         bg: 'bg-purple-500/10', color: 'text-purple-500 font-bold' },
  'Tối mật':     { label: 'Tối mật',     bg: 'bg-red-600/10',    color: 'text-red-600 font-black underline' },
};

export const LOAI_VB_CONFIG: Record<string, string> = {
  'Quyết định':      'QĐ',
  'Tờ trình':       'TTr',
  'Báo cáo':        'BC',
  'Lệnh khởi công':  'LCK',
  'Hợp đồng':       'HĐ',
  'Kế hoạch':       'KH',
  'Biên bản':       'BB',
  'Công văn':       '',      // Công văn không có ký hiệu
  'Khác':           'K',
};

export const DON_VI_TRINH_LIST: { label: string; value: string }[] = [
  { label: 'Văn phòng', value: 'VP' },
  { label: 'Kỹ thuật thẩm định', value: 'KTTĐ' },
  { label: 'Tài chính Kế toán', value: 'TCKT' },
  { label: 'Ban QLDA xã', value: 'BQLDA' },
];

// ============================================================
// DATE HELPERS
// ============================================================

export function formatDateTime(dateStr: string | Date) {
  if (!dateStr) return 'N/A';
  return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: vi });
}

export function timeAgo(dateStr: string | Date) {
  if (!dateStr) return 'N/A';
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: vi });
}

// ============================================================
// API FETCH WRAPPERS
// ============================================================

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try {
      const errJson = await res.json();
      errMsg = errJson?.error?.message || errJson?.error || errMsg;
    } catch { /* body kông phải JSON */ }
    throw new Error(errMsg);
  }
  const json = await res.json();
  return json.data;
}

export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try {
      const errJson = await res.json();
      errMsg = errJson?.error?.message || errJson?.error || errMsg;
    } catch { /* body kông phải JSON */ }
    throw new Error(errMsg);
  }
  const json = await res.json();
  return json.data;
}
