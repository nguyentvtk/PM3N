// ============================================================
// TypeScript Interfaces — Congvan_Kyso
// ============================================================

// ---- Người Dùng ----
export interface NguoiDung {
  MaNV: string;           // NV001, NV002...
  Ten: string;            // Họ và tên đầy đủ
  SDT: string;            // Số điện thoại
  Email: string;          // Email Google (dùng để đăng nhập NextAuth)
  Avatar?: string;        // URL ảnh đại diện
  VaiTro: VaiTro;         // Phân quyền
  ChucVu: string;         // Chức vụ mô tả
  MatKhau?: string;       // Chỉ dùng server-side, không expose ra client
}

export type VaiTro = 'admin' | 'lanh_dao' | 'nhan_vien' | 'ke_toan';

// Dữ liệu an toàn trả về client (không có MatKhau)
export type NguoiDungPublic = Omit<NguoiDung, 'MatKhau'>;

// ---- Hồ Sơ ----
export interface HoSo {
  MaHoSo: string;         // HS-001, HS-002...
  MaDA: string;           // Mã dự án liên quan
  TenTaiLieu: string;     // Tên đầy đủ tài liệu
  NguoiTrinh: string;     // MaNV người trình
  LanhDaoDuyet: string;   // MaNV lãnh đạo duyệt
  MucDo: MucDo;           // Mức độ bảo mật
  NgayTrinh: string;      // ISO 8601 datetime
  TrangThai: TrangThaiHoSo;
  FilePath: string;       // Google Drive URL file gốc / file đã lưu vào Drive
  LinkKySo: string;       // Google Drive URL file đã ký số
  TenDuan: string;        // Tên dự án — dùng đặt tên thư mục Drive: {MaDA}-{TenDuan}
}

export type MucDo = 'Thường' | 'Khẩn' | 'Thượng khẩn' | 'Mật' | 'Tối mật';

export type TrangThaiHoSo =
  | 'cho_trinh'    // Chờ trình lên
  | 'dang_duyet'   // Đang trong quá trình duyệt
  | 'da_duyet'     // Đã được duyệt
  | 'tu_choi'      // Bị từ chối
  | 'dang_ky'      // Đang ký số
  | 'da_ky'        // Đã ký số xong
  | 'hoan_thanh';  // Hoàn tất toàn bộ quy trình

// ---- Log Hệ Thống ----
export interface LogHeThong {
  ID: number;
  Timestamp: string;      // ISO 8601
  MaHoSo: string;        // '' nếu không liên quan hồ sơ
  HanhDong: HanhDong;
  ChiTiet: string;        // JSON string hoặc mô tả tự do
}

export type HanhDong =
  | 'TAO_MOI'
  | 'CAP_NHAT'
  | 'XOA'
  | 'DUYET'
  | 'TU_CHOI'
  | 'KY_SO'
  | 'DANG_NHAP'
  | 'DANG_XUAT';

// ---- API Response wrapper ----
export interface ApiResponse<T> {
  success: boolean;
  timestamp: string;
  data: T | null;
  count?: number;
  error?: {
    code: number;
    message: string;
  };
}

// ---- Dashboard Stats ----
export interface DashboardStats {
  total: number;
  cho_trinh: number;
  dang_duyet: number;
  da_duyet: number;
  tu_choi: number;
  da_ky: number;
  hoan_thanh: number;
}

// ---- NextAuth Session extension ----
export interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  maNV?: string;
  vaiTro?: VaiTro;
  chucVu?: string;
}
