/**
 * Indonesian Date & Time Formatting Utilities
 */

const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const MONTH_SHORT_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

/**
 * Format ISO date string to Indonesian readable date (e.g. "14 Mei 2008")
 */
export function formatDateIndo(dateStr?: string | null): string {
  if (!dateStr || dateStr.trim() === '') return '-';

  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);

    const day = d.getDate();
    const month = MONTH_NAMES_ID[d.getMonth()];
    const year = d.getFullYear();

    return `${day} ${month} ${year}`;
  } catch {
    return String(dateStr);
  }
}

/**
 * Alias for formatDateIndo
 */
export const formatDateIndonesian = formatDateIndo;

/**
 * Format ISO date string to short date (e.g. "14 Mei '26")
 */
export function formatShortDateIndo(dateStr?: string | null): string {
  if (!dateStr || dateStr.trim() === '') return '-';

  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);

    const day = d.getDate();
    const month = MONTH_SHORT_ID[d.getMonth()];
    const year = String(d.getFullYear()).slice(-2);

    return `${day} ${month} '${year}`;
  } catch {
    return String(dateStr);
  }
}

/**
 * Get current date in standard YYYY-MM-DD for form date pickers
 */
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
