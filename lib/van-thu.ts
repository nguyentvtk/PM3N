import { getAllHoSo, getSheetData } from './sheets';
import { isSameDay, subDays, getDay, parseISO } from 'date-fns';
import type { HoSo } from '@/types';

/**
 * Lấy danh sách ngày nghỉ từ sheet Ngay_nghi
 * Giả định sheet Ngay_nghi có cột 'Ngay' (định dạng dd/MM/yyyy hoặc ISO)
 */
export async function getHolidays(): Promise<Date[]> {
  try {
    const data = await getSheetData<{ Ngay: string }>('Ngay_nghi');
    return data.map(item => {
      // Thử parse các định dạng phổ biến
      const d = parseISO(item.Ngay);
      if (!isNaN(d.getTime())) return d;
      
      // Fallback cho dd/MM/yyyy
      const parts = item.Ngay.split('/');
      if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
      return new Date(item.Ngay);
    });
  } catch {
    console.warn('[van-thu] Không lấy được sheet Ngay_nghi, sử dụng T7-CN mặc định');
    return [];
  }
}

/**
 * Tìm ngày làm việc liền kề trước đó
 */
export async function getPreviousWorkday(referenceDate: Date = new Date()): Promise<Date> {
  const holidays = await getHolidays();
  let current = subDays(referenceDate, 1);
  
  while (true) {
    const dayOfWeek = getDay(current); // 0 = CN, 6 = T7
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidays.some(h => isSameDay(h, current));
    
    if (!isWeekend && !isHoliday) {
      return current;
    }
    current = subDays(current, 1);
    
    // Safety break để tránh loop vô hạn (max 30 ngày)
    if (subDays(referenceDate, 30) > current) return current;
  }
}

/**
 * Thuật toán 'Vào số tự động'
 * 1. Tìm số lớn nhất của ngày làm việc liền kề (+5)
 * 2. Nếu ngày đó không có văn bản, lấy số lớn nhất lịch sử (+5)
 * 3. Trừ ngày 1/1 (reset hoặc quy tắc riêng - ở đây ưu tiên Max toàn bộ theo yêu cầu)
 */
export async function calculateNextSoVanBan(): Promise<number> {
  const today = new Date();
  
  // Đặc biệt: Nếu là ngày đầu năm (phổ biến trong hành chính VN là reset về 1)
  // Tuy nhiên yêu cầu user nói: "Trừ ngày 1/1 thì... lấy số lớn nhất toàn bộ lịch sử cộng 5"
  // Có thể hiểu: Nếu hôm nay là 1/1 thì bắt đầu từ 1. Nếu không phải thì theo quy tắc cộng dồn.
  if (today.getMonth() === 0 && today.getDate() === 1) {
    return 1;
  }

  const allHoSo = await getAllHoSo();
  const prevWorkday = await getPreviousWorkday(today);
  
  // 1. Tìm bản ghi của ngày làm việc gần nhất
  const docsOnPrevDay = allHoSo.filter((h: HoSo) => {
    if (!h.NgayTrinh) return false;
    return isSameDay(parseISO(h.NgayTrinh), prevWorkday);
  });

  // Tìm Max trong ngày đó
  let maxNum = 0;
  docsOnPrevDay.forEach((doc: HoSo) => {
    const n = parseInt(doc.SoVanBan || '0');
    if (n > maxNum) maxNum = n;
  });

  if (maxNum > 0) {
    return maxNum + 5;
  }

  // 2. Nếu ngày đó trống, lấy Max toàn bộ lịch sử
  let absoluteMax = 0;
  allHoSo.forEach((doc: HoSo) => {
    const n = parseInt(doc.SoVanBan || '0');
    if (n > absoluteMax) absoluteMax = n;
  });

  return absoluteMax + 5;
}
