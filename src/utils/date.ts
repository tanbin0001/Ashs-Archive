import { DiaryEntry } from '../types';

export interface ParsedDateInfo {
  year: string;
  month: string;
  day: number;
  formatted: string;
  shortFormatted: string;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function parseDateSafe(dateStr?: string): ParsedDateInfo {
  if (!dateStr || typeof dateStr !== 'string') {
    return {
      year: 'Timeless',
      month: 'Undated',
      day: 1,
      formatted: 'Undated',
      shortFormatted: 'Undated',
    };
  }

  // Handle YYYY-MM-DD format (most common from inputs and database)
  const ymdMatch = dateStr.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymdMatch) {
    const yearNum = parseInt(ymdMatch[1], 10);
    const monthIndex = parseInt(ymdMatch[2], 10) - 1;
    const dayNum = parseInt(ymdMatch[3], 10);

    const safeMonthIndex = Math.max(0, Math.min(11, monthIndex));
    const monthName = MONTH_NAMES[safeMonthIndex] || 'Unknown';
    const shortMonth = monthName.slice(0, 3);

    return {
      year: yearNum.toString(),
      month: monthName,
      day: dayNum,
      formatted: `${monthName} ${dayNum}, ${yearNum}`,
      shortFormatted: `${shortMonth} ${dayNum}, ${yearNum}`,
    };
  }

  // Fallback for ISO timestamps (e.g., 2026-10-07T21:30:00.000Z)
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear().toString();
      const month = MONTH_NAMES[d.getMonth()] || 'Unknown';
      const day = d.getDate();
      const shortMonth = month.slice(0, 3);
      return {
        year,
        month,
        day,
        formatted: `${month} ${day}, ${year}`,
        shortFormatted: `${shortMonth} ${day}, ${year}`,
      };
    }
  } catch {
    // Ignore error and fall through
  }

  return {
    year: 'Timeless',
    month: 'Undated',
    day: 1,
    formatted: dateStr,
    shortFormatted: dateStr,
  };
}

// Compare two entries for descending date sorting (newest first)
export function compareEntriesDescending(a: DiaryEntry, b: DiaryEntry): number {
  const dateA = a.date || '';
  const dateB = b.date || '';
  if (dateA !== dateB) {
    return dateB.localeCompare(dateA);
  }
  const timeA = a.time || '';
  const timeB = b.time || '';
  if (timeA !== timeB) {
    return timeB.localeCompare(timeA);
  }
  return (b.pageNumber || 0) - (a.pageNumber || 0);
}

// Compare two entries for ascending date sorting (oldest first for book flip order)
export function compareEntriesAscending(a: DiaryEntry, b: DiaryEntry): number {
  const dateA = a.date || '';
  const dateB = b.date || '';
  if (dateA !== dateB) {
    return dateA.localeCompare(dateB);
  }
  const timeA = a.time || '';
  const timeB = b.time || '';
  if (timeA !== timeB) {
    return timeA.localeCompare(timeB);
  }
  return (a.pageNumber || 0) - (b.pageNumber || 0);
}
