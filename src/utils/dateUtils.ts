/**
 * Local Day Boundary and Formatting Utilities for HydroTrack
 */

export interface LocalDayBounds {
  startIso: string;
  endIso: string;
  dateKey: string; // YYYY-MM-DD in local time
}

/**
 * Returns the exact local day boundaries (start 00:00:00.000 and end 23:59:59.999)
 * for a given date in the user's local timezone.
 */
export function getLocalDayBounds(inputDate: Date | string = new Date()): LocalDayBounds {
  const d = typeof inputDate === 'string' ? new Date(inputDate) : new Date(inputDate.getTime());

  // Determine local date parts
  const year = d.getFullYear();
  const month = d.getMonth();
  const date = d.getDate();

  const startLocal = new Date(year, month, date, 0, 0, 0, 0);
  const endLocal = new Date(year, month, date, 23, 59, 59, 999);

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const dateKey = `${year}-${pad(month + 1)}-${pad(date)}`;

  return {
    startIso: startLocal.toISOString(),
    endIso: endLocal.toISOString(),
    dateKey,
  };
}

/**
 * Parses a YYYY-MM-DD local date string into local day boundaries.
 */
export function getBoundsFromDateKey(dateKey: string): LocalDayBounds {
  const [yearStr, monthStr, dayStr] = dateKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);

  const startLocal = new Date(year, month, day, 0, 0, 0, 0);
  const endLocal = new Date(year, month, day, 23, 59, 59, 999);

  return {
    startIso: startLocal.toISOString(),
    endIso: endLocal.toISOString(),
    dateKey,
  };
}

/**
 * Formats a Date or ISO timestamp into a local YYYY-MM-DD string.
 */
export function getLocalDateKey(inputDate: Date | string = new Date()): string {
  const d = typeof inputDate === 'string' ? new Date(inputDate) : dOrClone(inputDate);
  const year = d.getFullYear();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${year}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Checks whether an ISO timestamp falls on today in the local timezone.
 */
export function isLocalToday(isoString: string): boolean {
  const targetKey = getLocalDateKey(isoString);
  const todayKey = getLocalDateKey(new Date());
  return targetKey === todayKey;
}

/**
 * Formats an ISO string to a human-friendly local time, e.g. "09:15 AM".
 */
export function formatLocalTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/**
 * Formats an ISO string to a human-friendly local date, e.g. "Today", "Yesterday", or "Oct 22".
 */
export function formatRelativeDate(isoOrDateKey: string): string {
  const dateKey = isoOrDateKey.includes('T') ? getLocalDateKey(isoOrDateKey) : isoOrDateKey;
  const todayKey = getLocalDateKey(new Date());

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getLocalDateKey(yesterday);

  if (dateKey === todayKey) return 'Today';
  if (dateKey === yesterdayKey) return 'Yesterday';

  const [y, m, d] = dateKey.split('-').map(Number);
  const localDate = new Date(y, m - 1, d);
  return localDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

/**
 * Helper to get the last N days starting from today down to N-1 days ago.
 */
export function getPastLocalDays(daysCount: number = 7): { dateKey: string; label: string; date: Date }[] {
  const days: { dateKey: string; label: string; date: Date }[] = [];
  for (let i = 0; i < daysCount; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = getLocalDateKey(d);
    const label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    days.push({ dateKey, label, date: d });
  }
  return days;
}

function dOrClone(d: Date): Date {
  return new Date(d.getTime());
}
