import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  parseTimeString,
  validateReminderTimeWindow,
  validateReminderInterval,
  generateReminderOccurrences,
  getNextReminder,
  NotificationDeduplicator,
  computeScheduleReplacement,
} from '../src/utils/reminderCalculations.ts';

describe('1. Reminder Time Window Validation', () => {
  it('parses valid HH:MM strings into hours, minutes, and total minutes', () => {
    const res = parseTimeString('09:30');
    assert.deepStrictEqual(res, { hours: 9, minutes: 30, totalMinutes: 570 });

    const midnight = parseTimeString('00:00');
    assert.deepStrictEqual(midnight, { hours: 0, minutes: 0, totalMinutes: 0 });

    const lateNight = parseTimeString('23:59');
    assert.deepStrictEqual(lateNight, { hours: 23, minutes: 59, totalMinutes: 1439 });
  });

  it('rejects invalid or malformed time strings', () => {
    assert.strictEqual(parseTimeString(''), null);
    assert.strictEqual(parseTimeString('25:00'), null);
    assert.strictEqual(parseTimeString('12:60'), null);
    assert.strictEqual(parseTimeString('invalid'), null);
    assert.strictEqual(parseTimeString(':30'), null);
    assert.strictEqual(parseTimeString('12:5'), null);
  });

  it('validates that end time strictly follows start time on the same day', () => {
    const valid = validateReminderTimeWindow('09:00', '21:00');
    assert.strictEqual(valid.isValid, true);
    assert.strictEqual(valid.startMinutes, 540);
    assert.strictEqual(valid.endMinutes, 1260);

    const same = validateReminderTimeWindow('09:00', '09:00');
    assert.strictEqual(same.isValid, false);
    assert.match(same.error || '', /Reminder end time must be later than start time/);

    const reversed = validateReminderTimeWindow('21:00', '09:00');
    assert.strictEqual(reversed.isValid, false);
  });

  it('enforces a minimum 30-minute reminder window span', () => {
    const tooShort = validateReminderTimeWindow('09:00', '09:20');
    assert.strictEqual(tooShort.isValid, false);
    assert.match(tooShort.error || '', /span at least 30 minutes/);

    const minSpan = validateReminderTimeWindow('09:00', '09:30');
    assert.strictEqual(minSpan.isValid, true);
  });
});

describe('2. Reminder Interval Validation', () => {
  it('accepts valid intervals between 15 and 360 minutes', () => {
    assert.strictEqual(validateReminderInterval(15).isValid, true);
    assert.strictEqual(validateReminderInterval(30).isValid, true);
    assert.strictEqual(validateReminderInterval(60).isValid, true);
    assert.strictEqual(validateReminderInterval(90).isValid, true);
    assert.strictEqual(validateReminderInterval(120).isValid, true);
    assert.strictEqual(validateReminderInterval(360).isValid, true);
  });

  it('rejects intervals below 15 minutes', () => {
    const res = validateReminderInterval(10);
    assert.strictEqual(res.isValid, false);
    assert.match(res.error || '', /Minimum reminder interval is 15 minutes/);
  });

  it('rejects intervals above 360 minutes', () => {
    const res = validateReminderInterval(400);
    assert.strictEqual(res.isValid, false);
    assert.match(res.error || '', /Maximum reminder interval is 360 minutes/);
  });

  it('rejects non-integer, NaN, or non-numeric values', () => {
    assert.strictEqual(validateReminderInterval(45.5).isValid, false);
    assert.strictEqual(validateReminderInterval(NaN).isValid, false);
    assert.strictEqual(validateReminderInterval('60' as any).isValid, false);
  });
});

describe('3. Occurrence Generation Engine', () => {
  it('generates future occurrences adhering to active hours and active weekdays', () => {
    // Reference date: Monday, Oct 26, 2026, 08:00 AM local time
    const fromDate = new Date(2026, 9, 26, 8, 0, 0); // Monday

    const occurrences = generateReminderOccurrences({
      startTime: '09:00',
      endTime: '12:00',
      intervalMinutes: 60,
      activeDays: [1], // Only Monday
      maxOccurrences: 10,
      fromDate,
    });

    // Expect slots on Monday at 09:00, 10:00, 11:00, 12:00
    assert.strictEqual(occurrences.length >= 4, true);

    const first = occurrences[0];
    assert.strictEqual(first.getHours(), 9);
    assert.strictEqual(first.getMinutes(), 0);

    const second = occurrences[1];
    assert.strictEqual(second.getHours(), 10);
    assert.strictEqual(second.getMinutes(), 0);

    const third = occurrences[2];
    assert.strictEqual(third.getHours(), 11);
    assert.strictEqual(third.getMinutes(), 0);

    const fourth = occurrences[3];
    assert.strictEqual(fourth.getHours(), 12);
    assert.strictEqual(fourth.getMinutes(), 0);
  });

  it('filters out occurrences in the past relative to fromDate', () => {
    // Reference date: Monday 10:15 AM
    const fromDate = new Date(2026, 9, 26, 10, 15, 0);

    const occurrences = generateReminderOccurrences({
      startTime: '09:00',
      endTime: '12:00',
      intervalMinutes: 60,
      activeDays: [1],
      maxOccurrences: 10,
      fromDate,
    });

    // 09:00 and 10:00 have passed; next should be 11:00 and 12:00 on this Monday
    assert.strictEqual(occurrences.length >= 2, true);
    assert.strictEqual(occurrences[0].getHours(), 11);
    assert.strictEqual(occurrences[0].getMinutes(), 0);
    assert.strictEqual(occurrences[1].getHours(), 12);
    assert.strictEqual(occurrences[1].getMinutes(), 0);
  });

  it('respects inactive weekdays strictly', () => {
    // Monday fromDate
    const fromDate = new Date(2026, 9, 26, 8, 0, 0); // Monday (ISO day 1)

    // Schedule active only on Wednesday (ISO day 3) and Friday (ISO day 5)
    const occurrences = generateReminderOccurrences({
      startTime: '10:00',
      endTime: '12:00',
      intervalMinutes: 60,
      activeDays: [3, 5],
      maxOccurrences: 6,
      fromDate,
    });

    assert.strictEqual(occurrences.length > 0, true);
    for (const occ of occurrences) {
      const jsDay = occ.getDay();
      const isoDay = jsDay === 0 ? 7 : jsDay;
      assert.strictEqual(isoDay === 3 || isoDay === 5, true);
    }
  });

  it('caps occurrences at maxOccurrences to adhere to platform limits (iOS 64 limit)', () => {
    const fromDate = new Date(2026, 9, 26, 8, 0, 0);

    const occurrences = generateReminderOccurrences({
      startTime: '08:00',
      endTime: '22:00',
      intervalMinutes: 30, // 29 slots per day
      activeDays: [1, 2, 3, 4, 5, 6, 7],
      maxOccurrences: 48, // rolling window cap
      fromDate,
    });

    assert.strictEqual(occurrences.length, 48);
  });

  it('returns empty array when activeDays is empty or validation fails', () => {
    const fromDate = new Date(2026, 9, 26, 8, 0, 0);

    const emptyDays = generateReminderOccurrences({
      startTime: '09:00',
      endTime: '21:00',
      intervalMinutes: 60,
      activeDays: [],
      fromDate,
    });
    assert.deepStrictEqual(emptyDays, []);

    const invalidWindow = generateReminderOccurrences({
      startTime: '21:00',
      endTime: '09:00',
      intervalMinutes: 60,
      activeDays: [1, 2],
      fromDate,
    });
    assert.deepStrictEqual(invalidWindow, []);
  });

  it('finds the next upcoming reminder with getNextReminder', () => {
    const now = Date.now();
    const d1 = new Date(now - 10000);
    const d2 = new Date(now + 60000);
    const d3 = new Date(now + 120000);

    const next = getNextReminder([d1, d2, d3]);
    assert.notStrictEqual(next, null);
    assert.strictEqual(next?.getTime(), d2.getTime());

    assert.strictEqual(getNextReminder([d1]), null);
    assert.strictEqual(getNextReminder([]), null);
  });
});

describe('4. Schedule Replacement & Cancellation', () => {
  it('correctly identifies obsolete notifications to cancel before replacing', () => {
    const existingIds = ['notif-1', 'notif-2', 'notif-3'];
    const newDates = [new Date(Date.now() + 60000), new Date(Date.now() + 120000)];

    const diff = computeScheduleReplacement(existingIds, newDates, true);
    assert.deepStrictEqual(diff.obsoleteIds, ['notif-1', 'notif-2', 'notif-3']);
    assert.strictEqual(diff.newOccurrences.length, 2);
    assert.strictEqual(diff.replacementOccurred, true);
  });

  it('purges all existing reminders when reminders are disabled', () => {
    const existingIds = ['notif-1', 'notif-2'];
    const newDates = [new Date(Date.now() + 60000)];

    const diff = computeScheduleReplacement(existingIds, newDates, false);
    assert.deepStrictEqual(diff.obsoleteIds, ['notif-1', 'notif-2']);
    assert.strictEqual(diff.newOccurrences.length, 0);
  });
});

describe('5. Duplicate Prevention & Deduplication', () => {
  it('prevents double-handling of the same notification ID on rapid taps', () => {
    const deduplicator = new NotificationDeduplicator(10);

    // First tap: should allow handling
    assert.strictEqual(deduplicator.markHandled('tap-uuid-123'), true);
    assert.strictEqual(deduplicator.isHandled('tap-uuid-123'), true);

    // Second tap (duplicate response from same notification): should reject
    assert.strictEqual(deduplicator.markHandled('tap-uuid-123'), false);

    // Another distinct notification ID: should allow
    assert.strictEqual(deduplicator.markHandled('tap-uuid-456'), true);
  });

  it('keeps memory bounded by evicting oldest IDs past capacity', () => {
    const deduplicator = new NotificationDeduplicator(3);

    deduplicator.markHandled('id-1');
    deduplicator.markHandled('id-2');
    deduplicator.markHandled('id-3');
    assert.strictEqual(deduplicator.size, 3);

    // Adding 4th should evict 'id-1'
    deduplicator.markHandled('id-4');
    assert.strictEqual(deduplicator.size, 3);
    assert.strictEqual(deduplicator.isHandled('id-1'), false);
    assert.strictEqual(deduplicator.isHandled('id-4'), true);
  });

  it('clears all tracked IDs on reset', () => {
    const deduplicator = new NotificationDeduplicator(10);
    deduplicator.markHandled('id-1');
    deduplicator.markHandled('id-2');
    deduplicator.clear();
    assert.strictEqual(deduplicator.size, 0);
    assert.strictEqual(deduplicator.isHandled('id-1'), false);
  });
});
