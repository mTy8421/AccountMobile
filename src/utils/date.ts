/**
 * ยูทิลิตี้จัดการและจัดรูปแบบวันที่ภาษาไทย
 */

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

/**
 * รูปแบบย่อ เช่น 6 ต.ค. 2026
 */
export function formatThaiDate(dateInput: Date | string): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';
  const day = d.getDate();
  const month = THAI_MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * รูปแบบตัวเลข เช่น 06/10/2026
 */
export function formatThaiNumericDate(dateInput: Date | string): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * รูปแบบพร้อมเวลา เช่น 06/10/2026 15:30
 */
export function formatThaiDateTime(dateInput: Date | string): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';
  const dateStr = formatThaiNumericDate(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${dateStr} ${hours}:${minutes}`;
}

/**
 * ชื่อเดือนภาษาไทยเต็ม เช่น ตุลาคม 2026
 */
export function formatThaiMonthYear(month: number, year: number): string {
  const monthName = THAI_MONTHS_FULL[month - 1] || '';
  return `${monthName} ${year}`;
}

/**
 * หาวันเริ่มต้นและสิ้นสุดของเดือน (Local Time)
 */
export function getMonthDateRange(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * แปลง Date เป็น string YYYY-MM-DD สำหรับ input
 */
export function toInputDateFormat(dateInput: Date | string = new Date()): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
