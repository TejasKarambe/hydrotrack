/**
 * Pure calculation and validation logic for reminder schedules
 */

export interface TimeComponents {
  hours: number;
  minutes: number;
  totalMinutes: number;
}

/**
 * Parses "HH:MM" (24h) string into hours, minutes, and total minutes from midnight.
 */
export function parseTimeString(timeStr: string): TimeComponents | null {
  if (!timeStr || typeof timeStr !== 'string') return null;

  const match = timeStr.trim().match(/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/);
  if (!match) return null;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  return {
    hours,
    minutes,
    totalMinutes: hours * 60 + minutes,
  };
}

/**
 * Validates that start and end times are valid and that end time strictly follows start time.
 */
export function validateReminderTimeWindow(
  startTime: string,
  endTime: string
): { isValid: boolean; error?: string; startMinutes?: number; endMinutes?: number } {
  const start = parseTimeString(startTime);
  if (!start) {
    return { isValid: false, error: 'Start time must be in HH:MM format (e.g. "09:00").' };
  }

  const end = parseTimeString(endTime);
  if (!end) {
    return { isValid: false, error: 'End time must be in HH:MM format (e.g. "21:00").' };
  }

  if (end.totalMinutes <= start.totalMinutes) {
    return {
      isValid: false,
      error: 'Reminder end time must be later than start time on the same day.',
    };
  }

  // Ensure window is at least 30 minutes
  if (end.totalMinutes - start.totalMinutes < 30) {
    return {
      isValid: false,
      error: 'Reminder window must span at least 30 minutes.',
    };
  }

  return {
    isValid: true,
    startMinutes: start.totalMinutes,
    endMinutes: end.totalMinutes,
  };
}

/**
 * Validates reminder interval (between 15 and 360 minutes).
 */
export function validateReminderInterval(intervalMinutes: number): { isValid: boolean; error?: string } {
  if (typeof intervalMinutes !== 'number' || isNaN(intervalMinutes)) {
    return { isValid: false, error: 'Interval must be a valid number.' };
  }
  if (!Number.isInteger(intervalMinutes)) {
    return { isValid: false, error: 'Interval must be a whole number of minutes.' };
  }
  if (intervalMinutes < 15) {
    return { isValid: false, error: 'Minimum reminder interval is 15 minutes.' };
  }
  if (intervalMinutes > 360) {
    return { isValid: false, error: 'Maximum reminder interval is 360 minutes (6 hours).' };
  }
  return { isValid: true };
}

export interface ReminderOccurrenceConfig {
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  intervalMinutes: number;
  activeDays: number[]; // 1 = Monday, 7 = Sunday
  maxOccurrences?: number;
  fromDate?: Date;
}

/**
 * Generates future reminder occurrence Dates within the specified active window and active weekdays.
 * Automatically skips dates/times in the past and caps at maxOccurrences (default 50).
 */
export function generateReminderOccurrences(config: ReminderOccurrenceConfig): Date[] {
  const {
    startTime,
    endTime,
    intervalMinutes,
    activeDays,
    maxOccurrences = 50,
    fromDate = new Date(),
  } = config;

  const windowValidation = validateReminderTimeWindow(startTime, endTime);
  if (!windowValidation.isValid) {
    return [];
  }

  const intervalValidation = validateReminderInterval(intervalMinutes);
  if (!intervalValidation.isValid) {
    return [];
  }

  if (!Array.isArray(activeDays) || activeDays.length === 0) {
    return [];
  }

  const startParsed = parseTimeString(startTime)!;
  const endParsed = parseTimeString(endTime)!;

  const occurrences: Date[] = [];
  const now = fromDate.getTime();

  // Search forward up to 14 days or until maxOccurrences is reached
  const checkDate = new Date(fromDate);
  checkDate.setHours(0, 0, 0, 0);

  for (let dayOffset = 0; dayOffset < 14 && occurrences.length < maxOccurrences; dayOffset++) {
    const currentDay = new Date(checkDate);
    currentDay.setDate(currentDay.getDate() + dayOffset);

    // JavaScript getDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday.
    // Convert to ISO 1 = Monday ... 7 = Sunday
    const jsDay = currentDay.getDay();
    const isoWeekday = jsDay === 0 ? 7 : jsDay;

    if (activeDays.includes(isoWeekday)) {
      // Loop from startMinutes to endMinutes with intervalMinutes
      let currentMinute = startParsed.totalMinutes;
      while (currentMinute <= endParsed.totalMinutes && occurrences.length < maxOccurrences) {
        const slotHours = Math.floor(currentMinute / 60);
        const slotMinutes = currentMinute % 60;

        const slotDate = new Date(
          currentDay.getFullYear(),
          currentDay.getMonth(),
          currentDay.getDate(),
          slotHours,
          slotMinutes,
          0,
          0
        );

        // Only include occurrences strictly in the future (at least 15s ahead)
        if (slotDate.getTime() > now + 15000) {
          occurrences.push(slotDate);
        }

        currentMinute += intervalMinutes;
      }
    }
  }

  return occurrences;
}

/**
 * Returns the next upcoming reminder Date from an occurrence list or null if none.
 */
export function getNextReminder(occurrences: Date[]): Date | null {
  if (!Array.isArray(occurrences) || occurrences.length === 0) return null;
  const now = Date.now();
  const future = occurrences.filter((d) => d.getTime() > now);
  if (future.length === 0) return null;
  return new Date(Math.min(...future.map((d) => d.getTime())));
}

/**
 * In-memory deduplicator ensuring notification taps are only processed once.
 */
export class NotificationDeduplicator {
  private handledIds = new Set<string>();
  private readonly maxEntries: number;

  constructor(maxEntries: number = 100) {
    this.maxEntries = maxEntries;
  }

  isHandled(id: string): boolean {
    return this.handledIds.has(id);
  }

  markHandled(id: string): boolean {
    if (this.handledIds.has(id)) {
      return false; // Already handled (duplicate prevented)
    }
    this.handledIds.add(id);
    if (this.handledIds.size > this.maxEntries) {
      const first = this.handledIds.values().next().value;
      if (first) this.handledIds.delete(first);
    }
    return true; // First time handled
  }

  clear(): void {
    this.handledIds.clear();
  }

  get size(): number {
    return this.handledIds.size;
  }
}

export interface ScheduleDiff {
  obsoleteIds: string[];
  newOccurrences: Date[];
  replacementOccurred: boolean;
}

/**
 * Computes schedule replacement to ensure obsolete notifications are cancelled
 * before replacing with new occurrences, preventing duplicate reminders.
 */
export function computeScheduleReplacement(
  existingIds: string[],
  nextOccurrences: Date[],
  isEnabled: boolean
): ScheduleDiff {
  if (!isEnabled) {
    return {
      obsoleteIds: [...existingIds],
      newOccurrences: [],
      replacementOccurred: existingIds.length > 0,
    };
  }

  return {
    obsoleteIds: [...existingIds],
    newOccurrences: [...nextOccurrences],
    replacementOccurred: true,
  };
}
