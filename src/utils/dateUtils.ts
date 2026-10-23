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
 * Formats a Date or ISO string to a human-friendly local time, e.g. "09:15 AM".
 */
export function formatLocalTime(input: Date | string): string {
  try {
    const d = typeof input === 'string' ? new Date(input) : input;
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

/**
 * Formats a Date or dateKey to a complete, elegant string, e.g. "Friday, Oct 23, 2026".
 */
export function formatDateFull(input: Date | string): string {
  try {
    const d = typeof input === 'string'
      ? input.length === 10
        ? (() => {
            const [y, m, day] = input.split('-').map(Number);
            return new Date(y, m - 1, day);
          })()
        : new Date(input)
      : input;

    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString([], {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

/**
 * Formats Month and Year, e.g. "October 2026".
 */
export function formatMonthYear(year: number, month: number): string {
  const d = new Date(year, month, 1);
  return d.toLocaleDateString([], { month: 'long', year: 'numeric' });
}

/**
 * Shifts a given Date or dateKey by a given number of days (+/-).
 */
export function shiftDateByDays(input: Date | string, days: number): Date {
  const base = typeof input === 'string'
    ? input.length === 10
      ? (() => {
          const [y, m, day] = input.split('-').map(Number);
          return new Date(y, m - 1, day);
        })()
      : new Date(input)
    : new Date(input.getTime());

  const result = new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
  return result;
}

/**
 * Generates an array of Date objects between start and end dates (inclusive).
 */
export function getDateRange(startDate: Date | string, endDate: Date | string): Date[] {
  const start = typeof startDate === 'string' && startDate.length === 10
    ? (() => {
        const [y, m, d] = startDate.split('-').map(Number);
        return new Date(y, m - 1, d);
      })()
    : new Date(startDate);

  const end = typeof endDate === 'string' && endDate.length === 10
    ? (() => {
        const [y, m, d] = endDate.split('-').map(Number);
        return new Date(y, m - 1, d);
      })()
    : new Date(endDate);

  const dates: Date[] = [];
  const curr = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const final = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  while (curr.getTime() <= final.getTime()) {
    dates.push(new Date(curr.getTime()));
    curr.setDate(curr.getDate() + 1);
  }

  return dates;
}

export interface CalendarDayCell {
  date: Date;
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
}

/**
 * Generates cells for a monthly calendar grid (Monday - Sunday aligned).
 */
export function getCalendarGrid(year: number, month: number): CalendarDayCell[] {
  const todayKey = getLocalDateKey(new Date());
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // In JS, Sunday is 0. Shift so Monday is 0 (0: Mon, 1: Tue, ..., 6: Sun)
  const firstDayWeekday = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInCurrentMonth = lastDayOfMonth.getDate();

  const cells: CalendarDayCell[] = [];

  // Trailing days from previous month
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    const prevDay = prevMonthLastDay - i;
    const d = new Date(year, month - 1, prevDay);
    const dateKey = getLocalDateKey(d);
    cells.push({
      date: d,
      dateKey,
      dayNumber: prevDay,
      isCurrentMonth: false,
      isToday: dateKey === todayKey,
      isFuture: d.getTime() > Date.now(),
    });
  }

  // Days in current month
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const dayDate = new Date(year, month, d);
    const dateKey = getLocalDateKey(dayDate);
    cells.push({
      date: dayDate,
      dateKey,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: dateKey === todayKey,
      isFuture: dayDate.getTime() > Date.now() && dateKey !== todayKey,
    });
  }

  // Leading days from next month to complete the grid (up to multiple of 7)
  const remainingCells = (7 - (cells.length % 7)) % 7;
  for (let nextDay = 1; nextDay <= remainingCells; nextDay++) {
    const d = new Date(year, month + 1, nextDay);
    const dateKey = getLocalDateKey(d);
    cells.push({
      date: d,
      dateKey,
      dayNumber: nextDay,
      isCurrentMonth: false,
      isToday: dateKey === todayKey,
      isFuture: true,
    });
  }

  return cells;
}
