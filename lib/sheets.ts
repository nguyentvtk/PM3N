/**
 * Google Sheets API v4 — Wrapper utility
 * Server-side only: dùng trong API routes Next.js
 */
import { google } from 'googleapis';
import { getGoogleAuth } from './google-auth';
import type { HoSo, NguoiDung, LogHeThong, DuAn } from '@/types';

// ============================================================
// Lấy Sheets client đã xác thực
// ============================================================
async function getSheetsClient() {
  const auth = await getGoogleAuth();
  return google.sheets({ version: 'v4', auth });
}

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!;

// ============================================================
// CORE HELPERS
// ============================================================

/**
 * Đọc toàn bộ dữ liệu từ một sheet, map header → giá trị
 * @param sheetName - Tên sheet trong Spreadsheet
 */
export async function getSheetData<T>(sheetName: string): Promise<T[]> {
  const sheets = await getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetName,
  });

  const rows = response.data.values;
  if (!rows || rows.length <= 1) return [];

  const headers = (rows[0] as string[]).map((h) => h.trim());
  return rows
    .slice(1)
    .filter((row) => row.some((cell) => cell !== '')) // Bỏ qua dòng trống hoàn toàn
    .map((row) => {
      const obj: Record<string, unknown> = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] ? String(row[i]).trim() : '';
      });
      return obj as T;
    });
}

/**
 * Thêm một dòng mới vào cuối sheet
 * @param sheetName - Tên sheet
 * @param data - Object với keys là tên cột (theo thứ tự headers)
 * @param headers - Mảng tên cột theo đúng thứ tự trong sheet
 */
export async function appendSheetRow(
  sheetName: string,
  data: Record<string, unknown>,
  headers: string[]
): Promise<void> {
  const sheets = await getSheetsClient();

  const row = headers.map((h) => data[h] ?? '');

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });
}

/**
 * Cập nhật một dòng cụ thể trong sheet
 * @param sheetName
 * @param rowIndex - 1-indexed (row 1 = header, row 2 = first data row)
 * @param data
 * @param headers
 */
export async function updateSheetRow(
  sheetName: string,
  rowIndex: number,
  data: Record<string, unknown>,
  headers: string[]
): Promise<void> {
  const sheets = await getSheetsClient();

  const row = headers.map((h) => data[h] ?? '');

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A${rowIndex}:${columnToLetter(headers.length)}${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });
}

/**
 * Tìm vị trí dòng theo giá trị của cột đầu tiên (Primary Key)
 * @param sheetName
 * @param pkColumn - Tên cột Primary Key
 * @param pkValue - Giá trị cần tìm
 * @returns rowIndex (1-indexed) hoặc -1 nếu không tìm thấy
 */
export async function findRowIndex(
  sheetName: string,
  pkColumn: string,
  pkValue: string
): Promise<number> {
  const sheets = await getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetName,
  });

  const rows = response.data.values;
  if (!rows || rows.length <= 1) return -1;

  const headers = rows[0] as string[];
  const colIdx = headers.indexOf(pkColumn);
  if (colIdx === -1) return -1;

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][colIdx]) === String(pkValue)) {
      return i + 1; // +1 vì 1-indexed
    }
  }
  return -1;
}

// ============================================================
// NGUOI_DUNG specific functions
// ============================================================

const NGUOI_DUNG_HEADERS: (keyof NguoiDung)[] = [
  'MaNV', 'Ten', 'SDT', 'Email', 'Avatar', 'VaiTro', 'ChucVu', 'MatKhau'
];

export async function getAllNguoiDung(): Promise<Omit<NguoiDung, 'MatKhau'>[]> {
  const data = await getSheetData<NguoiDung>('Nguoi_dung');
  // Luôn ẩn MatKhau khi lấy danh sách
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return data.map(({ MatKhau, ...safe }) => safe);
}

export async function getNguoiDungByEmail(email: string): Promise<NguoiDung | null> {
  const data = await getSheetData<NguoiDung>('Nguoi_dung');
  return data.find((u) => u.Email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function getNguoiDungByMaNV(maNV: string): Promise<Omit<NguoiDung, 'MatKhau'> | null> {
  const data = await getSheetData<NguoiDung>('Nguoi_dung');
  const found = data.find((u) => u.MaNV === maNV);
  if (!found) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { MatKhau, ...safe } = found;
  return safe;
}

export async function createNguoiDung(data: Omit<NguoiDung, 'MatKhau'> & { MatKhau: string }): Promise<void> {
  await appendSheetRow('Nguoi_dung', data as unknown as Record<string, unknown>, NGUOI_DUNG_HEADERS);
}

export async function updateNguoiDung(maNV: string, data: Partial<NguoiDung>): Promise<boolean> {
  const rowIndex = await findRowIndex('Nguoi_dung', 'MaNV', maNV);
  if (rowIndex === -1) return false;

  const all = await getSheetData<NguoiDung>('Nguoi_dung');
  const current = all.find((u) => u.MaNV === maNV);
  if (!current) return false;

  const updated: NguoiDung = { ...current, ...data };
  await updateSheetRow(
    'Nguoi_dung',
    rowIndex,
    updated as unknown as Record<string, unknown>,
    NGUOI_DUNG_HEADERS
  );
  return true;
}

export async function deleteNguoiDung(maNV: string): Promise<boolean> {
  const rowIndex = await findRowIndex('Nguoi_dung', 'MaNV', maNV);
  if (rowIndex === -1) return false;

  const sheets = await getSheetsClient();
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === 'Nguoi_dung');
  const sheetId = sheet?.properties?.sheetId;

  if (sheetId === undefined) return false;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex - 1,
              endIndex: rowIndex
            }
          }
        }
      ]
    }
  });
  return true;
}

// Thêm hàm cập nhật mật khẩu (dùng cho flow reset password)
export async function updateNguoiDungPassword(email: string, hashedPassword: string): Promise<boolean> {
  const rowIndex = await findRowIndex('Nguoi_dung', 'Email', email);
  if (rowIndex === -1) return false;

  const data = await getSheetData<NguoiDung>('Nguoi_dung');
  const current = data.find((u) => u.Email.toLowerCase() === email.toLowerCase());
  if (!current) return false;

  const updated: NguoiDung = { ...current, MatKhau: hashedPassword };
  await updateSheetRow(
    'Nguoi_dung',
    rowIndex,
    updated as unknown as Record<string, unknown>,
    NGUOI_DUNG_HEADERS
  );
  return true;
}

// ============================================================
// DU_AN specific functions
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DU_AN_HEADERS: (keyof DuAn)[] = ['MaDA', 'TenDA', 'MoTa', 'TrangThai'];

export async function getAllProjects(): Promise<DuAn[]> {
  return getSheetData<DuAn>('Tong_Hop_Du_An');
}

/** Lấy danh sách dự án từ sheet Setting (cột A=MSDA, B=TenDuAn, C=Nam) */
export async function getSettingProjects(): Promise<{ MSDA: string; TenDuAn: string; Nam: string }[]> {
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Setting!A2:C',
  });
  const rows = response.data.values ?? [];
  return rows
    .filter((r) => r[0] && r[1])
    .map((r) => ({ MSDA: r[0] as string, TenDuAn: r[1] as string, Nam: (r[2] as string) ?? '' }));
}

/** Lấy danh sách Lãnh đạo (Giám đốc, Phó Giám đốc) từ sheet Nguoi_dung */
export async function getLanhDaoList(): Promise<{ MaNV: string; Ten: string; ChucVu: string }[]> {
  const data = await getSheetData<NguoiDung>('Nguoi_dung');
  return data
    .filter((u) => u.ChucVu === 'Giám đốc' || u.ChucVu === 'Phó Giám đốc')
    .map((u) => ({ MaNV: u.MaNV, Ten: u.Ten, ChucVu: u.ChucVu }));
}


// ============================================================
// HO_SO specific functions
// ============================================================

const HO_SO_HEADERS: (keyof HoSo)[] = [
  'MaHoSo', 'MaDA', 'TenTaiLieu', 'NguoiTrinh', 'LanhDaoDuyet', 
  'MucDo', 'NgayTrinh', 'TrangThai', 'FilePath', 'LinkKySo', 
  'TenDuan', 'So_VB', 'LoaiVB', 'Ma_Loaitailieu', 'Kyhieu_DVtrinh', 'DinhKem',
  'SignerSerial', 'SignerCA', 'SignTime'
];

export async function getAllHoSo(): Promise<HoSo[]> {
  return getSheetData<HoSo>('Ho_So');
}

export async function getHoSoByMa(maHoSo: string): Promise<HoSo | null> {
  const data = await getAllHoSo();
  return data.find((h) => h.MaHoSo === maHoSo) ?? null;
}

export async function getHoSoById(id: string): Promise<HoSo | null> {
  return getHoSoByMa(id);
}

export async function createHoSo(data: HoSo): Promise<void> {
  await appendSheetRow('Ho_So', data as unknown as Record<string, unknown>, HO_SO_HEADERS);
}

export async function updateHoSoStatus(
  maHoSo: string,
  trangThai: HoSo['TrangThai'],
  linkKySo?: string
): Promise<boolean> {
  const rowIndex = await findRowIndex('Ho_So', 'MaHoSo', maHoSo);
  if (rowIndex === -1) return false;

  // Lấy dòng hiện tại rồi cập nhật chỉ TrangThai và LinkKySo
  const data = await getSheetData<HoSo>('Ho_So');
  const current = data.find((h) => h.MaHoSo === maHoSo);
  if (!current) return false;

  const updated: HoSo = {
    ...current,
    TrangThai: trangThai,
    LinkKySo: linkKySo ?? current.LinkKySo,
  };

  await updateSheetRow('Ho_So', rowIndex, updated as unknown as Record<string, unknown>, HO_SO_HEADERS);
  return true;
}

/** Cập nhật thông tin ký số sau khi đóng gói PDF thành công */
export async function updateHoSoSignature(
  maHoSo: string,
  serial: string,
  ca: string,
  signTime: string
): Promise<boolean> {
  const rowIndex = await findRowIndex('Ho_So', 'MaHoSo', maHoSo);
  if (rowIndex === -1) return false;

  const data = await getSheetData<HoSo>('Ho_So');
  const current = data.find((h) => h.MaHoSo === maHoSo);
  if (!current) return false;

  const updated: HoSo = {
    ...current,
    TrangThai: 'da_ky',
    SignerSerial: serial,
    SignerCA: ca,
    SignTime: signTime,
  };

  await updateSheetRow('Ho_So', rowIndex, updated as unknown as Record<string, unknown>, HO_SO_HEADERS);
  return true;
}

export async function getNextHoSoId(): Promise<string> {
  const data = await getAllHoSo();
  const num = (data.length + 1).toString().padStart(3, '0');
  return `HS-${num}`;
}

// ============================================================
// LOG specific functions
// ============================================================

const LOG_HEADERS: (keyof LogHeThong)[] = [
  'ID', 'Timestamp', 'MaHoSo', 'HanhDong', 'ChiTiet'
];

export async function getAllLogs(limit = 100): Promise<LogHeThong[]> {
  const data = await getSheetData<LogHeThong>('Log_HeThong');
  return data.slice(-limit).reverse(); // Gần nhất trước
}

export async function appendLog(
  maHoSo: string,
  hanhDong: LogHeThong['HanhDong'],
  chiTiet: string
): Promise<void> {
  const allLogs = await getSheetData<LogHeThong>('Log_HeThong');
  const nextId = allLogs.length + 1;

  await appendSheetRow(
    'Log_HeThong',
    {
      ID: nextId,
      Timestamp: new Date().toISOString(),
      MaHoSo: maHoSo,
      HanhDong: hanhDong,
      ChiTiet: chiTiet,
    },
    LOG_HEADERS
  );
}

// ============================================================
// UTILITY
// ============================================================

/** Chuyển số cột thành chữ cái Excel (1→A, 26→Z, 27→AA...) */
function columnToLetter(col: number): string {
  let letter = '';
  while (col > 0) {
    const mod = (col - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}
