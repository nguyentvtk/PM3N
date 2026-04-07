/**
 * Google Sheets API v4 — Wrapper utility
 * Server-side only: dùng trong API routes Next.js
 */
import { google } from 'googleapis';
import { getGoogleAuth } from './google-auth';
import type { HoSo, NguoiDung, LogHeThong } from '@/types';

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

  const headers = rows[0] as string[];
  return rows.slice(1).map((row) => {
    const obj: Record<string, unknown> = {};
    headers.forEach((header, i) => {
      obj[header] = row[i] ?? '';
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
  const { MatKhau, ...safe } = found;
  return safe;
}

export async function createNguoiDung(data: Omit<NguoiDung, 'MatKhau'> & { MatKhau: string }): Promise<void> {
  await appendSheetRow('Nguoi_dung', data as unknown as Record<string, unknown>, NGUOI_DUNG_HEADERS);
}

// ============================================================
// HO_SO specific functions
// ============================================================

const HO_SO_HEADERS: (keyof HoSo)[] = [
  'MaHoSo', 'MaDA', 'TenTaiLieu', 'NguoiTrinh', 'LanhDaoDuyet',
  'MucDo', 'NgayTrinh', 'TrangThai', 'FilePath', 'LinkKySo'
];

export async function getAllHoSo(): Promise<HoSo[]> {
  return getSheetData<HoSo>('Ho_So');
}

export async function getHoSoByMa(maHoSo: string): Promise<HoSo | null> {
  const data = await getAllHoSo();
  return data.find((h) => h.MaHoSo === maHoSo) ?? null;
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
