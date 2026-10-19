/**
 * Timezone-aware date helpers for the frontend.
 *
 * The application operates in PKT (UTC+5).  We never want "today"
 * to flip to yesterday at 19:00 because the user's browser is UTC.
 */

const TZ = 'Asia/Karachi';

/** Returns today's date as a "YYYY-MM-DD" string in PKT */
export function todayLocal(): string {
  const now = new Date();
  // Get the date parts in PKT
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  // en-CA locale returns YYYY-MM-DD natively
  return parts;
}

/** Parses a "YYYY-MM-DD" string and returns a Date at noon PKT */
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  // Interpret the date as a calendar day in PKT by appending noon PKT offset
  return new Date(`${dateStr}T12:00:00+05:00`);
}

/**
 * Adds `days` to a "YYYY-MM-DD" string and returns the result as
 * another "YYYY-MM-DD" string (still in PKT).
 */
export function shiftDateStr(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Formats any date string / Date object as a short readable date
 * in PKT (e.g. "01 Oct 2026").
 */
export function formatLocalDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseLocalDate(date) : date;
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Returns the number of whole days between a date string and today (PKT).
 * Positive means the date is in the future.
 */
export function daysFromToday(dateStr: string): number {
  const today = parseLocalDate(todayLocal());
  const target = parseLocalDate(dateStr);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
