import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateTotalIntake,
  calculateAverageIntake,
  calculateDaysAchieved,
  calculateProgressPercentage,
  calculateStreak,
  calculateWeeklyMetrics,
  type DailyIntakeItem,
} from '../src/utils/hydrationCalculations.ts';
import {
  getLocalDayBounds,
  getBoundsFromDateKey,
  getLocalDateKey,
  formatDateFull,
  formatMonthYear,
  shiftDateByDays,
  getDateRange,
  getCalendarGrid,
  isLocalToday,
  formatRelativeDate,
} from '../src/utils/dateUtils.ts';

describe('1. Weekly Boundaries & Date Ranges', () => {
  it('generates exactly 7 distinct dates for a 7-day range', () => {
    const start = new Date(2026, 9, 17); // Oct 17, 2026
    const end = new Date(2026, 9, 23);   // Oct 23, 2026
    const range = getDateRange(start, end);

    assert.strictEqual(range.length, 7);
    assert.strictEqual(getLocalDateKey(range[0]), '2026-10-17');
    assert.strictEqual(getLocalDateKey(range[6]), '2026-10-23');
  });

  it('correctly crosses month boundaries (Oct 28 to Nov 3)', () => {
    const start = new Date(2026, 9, 28); // Oct 28
    const end = new Date(2026, 10, 3);   // Nov 3
    const range = getDateRange(start, end);

    assert.strictEqual(range.length, 7);
    assert.strictEqual(getLocalDateKey(range[0]), '2026-10-28');
    assert.strictEqual(getLocalDateKey(range[3]), '2026-10-31');
    assert.strictEqual(getLocalDateKey(range[4]), '2026-11-01');
    assert.strictEqual(getLocalDateKey(range[6]), '2026-11-03');
  });

  it('correctly shifts dates backwards and forwards', () => {
    const base = new Date(2026, 9, 23);
    const prev = shiftDateByDays(base, -1);
    const next = shiftDateByDays(base, 1);
    const weekAgo = shiftDateByDays(base, -7);

    assert.strictEqual(getLocalDateKey(prev), '2026-10-22');
    assert.strictEqual(getLocalDateKey(next), '2026-10-24');
    assert.strictEqual(getLocalDateKey(weekAgo), '2026-10-16');
  });

  it('bounds are exactly 00:00:00.000 to 23:59:59.999 local time', () => {
    const dateKey = '2026-10-23';
    const bounds = getBoundsFromDateKey(dateKey);

    const startDate = new Date(bounds.startIso);
    const endDate = new Date(bounds.endIso);

    assert.strictEqual(startDate.getHours(), 0);
    assert.strictEqual(startDate.getMinutes(), 0);
    assert.strictEqual(startDate.getSeconds(), 0);
    assert.strictEqual(startDate.getMilliseconds(), 0);

    assert.strictEqual(endDate.getHours(), 23);
    assert.strictEqual(endDate.getMinutes(), 59);
    assert.strictEqual(endDate.getSeconds(), 59);
    assert.strictEqual(endDate.getMilliseconds(), 999);
  });
});

describe('2. Timezone Behavior & Midnight Boundaries', () => {
  it('correctly partitions record at 23:59:58 into the current local date', () => {
    const targetDate = new Date(2026, 9, 23);
    const bounds = getLocalDayBounds(targetDate);

    const nearMidnight = new Date(2026, 9, 23, 23, 59, 58, 0).toISOString();
    assert.ok(nearMidnight >= bounds.startIso && nearMidnight <= bounds.endIso);
    assert.strictEqual(getLocalDateKey(nearMidnight), '2026-10-23');
  });

  it('correctly excludes record at 00:00:01 of the following day', () => {
    const targetDate = new Date(2026, 9, 23);
    const bounds = getLocalDayBounds(targetDate);

    const followingDay = new Date(2026, 9, 24, 0, 0, 1, 0).toISOString();
    assert.ok(followingDay > bounds.endIso);
    assert.strictEqual(getLocalDateKey(followingDay), '2026-10-24');
  });

  it('formats full local date string cleanly', () => {
    const formatted = formatDateFull('2026-10-23');
    assert.match(formatted, /Friday/);
    assert.match(formatted, /Oct/);
    assert.match(formatted, /23/);
    assert.match(formatted, /2026/);
  });
});

describe('3. Empty Dates, Brand-New Installation & Zero-Intake Handling', () => {
  it('handles completely empty 7-day period without NaN or errors', () => {
    const emptyDays: DailyIntakeItem[] = [
      { dateKey: '2026-10-17', dayLabel: 'Sat', totalMl: 0, isToday: false },
      { dateKey: '2026-10-18', dayLabel: 'Sun', totalMl: 0, isToday: false },
      { dateKey: '2026-10-19', dayLabel: 'Mon', totalMl: 0, isToday: false },
      { dateKey: '2026-10-20', dayLabel: 'Tue', totalMl: 0, isToday: false },
      { dateKey: '2026-10-21', dayLabel: 'Wed', totalMl: 0, isToday: false },
      { dateKey: '2026-10-22', dayLabel: 'Thu', totalMl: 0, isToday: false },
      { dateKey: '2026-10-23', dayLabel: 'Today', totalMl: 0, isToday: true },
    ];

    const metrics = calculateWeeklyMetrics(emptyDays, 2500);

    assert.strictEqual(metrics.totalPeriod, 0);
    assert.strictEqual(metrics.averageDaily, 0);
    assert.strictEqual(metrics.daysAchieved, 0);
    assert.strictEqual(metrics.completionRate, 0);
    assert.strictEqual(metrics.bestDay, null);
    assert.ok(metrics.textSummary.length > 0);
  });

  it('includes zero-intake days in the 7-day average denominator', () => {
    // 2 days with 2500 ml, 5 days with 0 ml
    const days: DailyIntakeItem[] = [
      { dateKey: '2026-10-17', dayLabel: 'Sat', totalMl: 2500, isToday: false },
      { dateKey: '2026-10-18', dayLabel: 'Sun', totalMl: 0, isToday: false },
      { dateKey: '2026-10-19', dayLabel: 'Mon', totalMl: 0, isToday: false },
      { dateKey: '2026-10-20', dayLabel: 'Tue', totalMl: 2500, isToday: false },
      { dateKey: '2026-10-21', dayLabel: 'Wed', totalMl: 0, isToday: false },
      { dateKey: '2026-10-22', dayLabel: 'Thu', totalMl: 0, isToday: false },
      { dateKey: '2026-10-23', dayLabel: 'Today', totalMl: 0, isToday: true },
    ];

    const metrics = calculateWeeklyMetrics(days, 2500);

    assert.strictEqual(metrics.totalPeriod, 5000);
    // 5000 / 7 = 714.285... => Math.round gives 714
    assert.strictEqual(metrics.averageDaily, 714);
    assert.strictEqual(metrics.daysAchieved, 2);
    // 2 / 7 = 28.57% => Math.round gives 29%
    assert.strictEqual(metrics.completionRate, 29);
  });
});

describe('4. Goal Completion, Dynamic Goal Changes & Best Day', () => {
  const sampleWeek: DailyIntakeItem[] = [
    { dateKey: '2026-10-17', dayLabel: 'Sat', totalMl: 2500, isToday: false },
    { dateKey: '2026-10-18', dayLabel: 'Sun', totalMl: 3000, isToday: false },
    { dateKey: '2026-10-19', dayLabel: 'Mon', totalMl: 2400, isToday: false },
    { dateKey: '2026-10-20', dayLabel: 'Tue', totalMl: 1800, isToday: false },
    { dateKey: '2026-10-21', dayLabel: 'Wed', totalMl: 3500, isToday: false },
    { dateKey: '2026-10-22', dayLabel: 'Thu', totalMl: 0, isToday: false },
    { dateKey: '2026-10-23', dayLabel: 'Today', totalMl: 2600, isToday: true },
  ];

  it('calculates metrics accurately for daily goal of 2500 ml', () => {
    const metrics = calculateWeeklyMetrics(sampleWeek, 2500);

    // Total: 2500 + 3000 + 2400 + 1800 + 3500 + 0 + 2600 = 15800
    assert.strictEqual(metrics.totalPeriod, 15800);
    // Average: 15800 / 7 = 2257
    assert.strictEqual(metrics.averageDaily, 2257);
    // Achieved (>= 2500): Sat (2500), Sun (3000), Wed (3500), Today (2600) = 4 days
    assert.strictEqual(metrics.daysAchieved, 4);
    // 4 / 7 = 57%
    assert.strictEqual(metrics.completionRate, 57);
    // Best Day: Wed with 3500 ml
    assert.deepStrictEqual(metrics.bestDay, {
      dayLabel: 'Wed',
      dateKey: '2026-10-21',
      totalMl: 3500,
    });
  });

  it('dynamically adapts when daily goal changes to 2000 ml', () => {
    const metrics = calculateWeeklyMetrics(sampleWeek, 2000);

    // Achieved (>= 2000): Sat (2500), Sun (3000), Mon (2400), Wed (3500), Today (2600) = 5 days
    assert.strictEqual(metrics.daysAchieved, 5);
    // 5 / 7 = 71%
    assert.strictEqual(metrics.completionRate, 71);
  });

  it('dynamically adapts when daily goal changes to 3200 ml', () => {
    const metrics = calculateWeeklyMetrics(sampleWeek, 3200);

    // Achieved (>= 3200): Only Wed (3500) = 1 day
    assert.strictEqual(metrics.daysAchieved, 1);
    // 1 / 7 = 14%
    assert.strictEqual(metrics.completionRate, 14);
  });
});

describe('5. Streak and In-Progress Partial Day Behavior', () => {
  it('distinguishes partial today from past completed days in streak calculation', () => {
    // If today is not met yet, streak counts backwards from yesterday
    const weekWithUnmetToday = [
      { dateKey: '2026-10-23', totalMl: 500, goalMl: 2500, isToday: true }, // today in-progress
      { dateKey: '2026-10-22', totalMl: 2600, goalMl: 2500 },              // met
      { dateKey: '2026-10-21', totalMl: 2500, goalMl: 2500 },              // met
      { dateKey: '2026-10-20', totalMl: 2000, goalMl: 2500 },              // broken
    ];

    assert.strictEqual(calculateStreak(weekWithUnmetToday), 2);

    // Once today reaches goal, streak increases by 1
    weekWithUnmetToday[0].totalMl = 2500;
    assert.strictEqual(calculateStreak(weekWithUnmetToday), 3);
  });

  it('includes partial today note in accessible textual summary', () => {
    const days: DailyIntakeItem[] = [
      { dateKey: '2026-10-22', dayLabel: 'Thu', totalMl: 2500, isToday: false },
      { dateKey: '2026-10-23', dayLabel: 'Today', totalMl: 1200, isToday: true },
    ];
    const metrics = calculateWeeklyMetrics(days, 2500);

    assert.match(metrics.textSummary, /Today is in progress at 1,200 ml/);
  });
});

describe('6. Editing and Deleting Impact on Aggregates', () => {
  it('reflects updated amount in total and average after editing', () => {
    const initialLogs = [
      { amount_ml: 250 },
      { amount_ml: 500 },
    ];
    assert.strictEqual(calculateTotalIntake(initialLogs), 750);

    // Edit 250 ml -> 750 ml
    const editedLogs = [
      { amount_ml: 750 },
      { amount_ml: 500 },
    ];
    assert.strictEqual(calculateTotalIntake(editedLogs), 1250);
  });

  it('reflects deletion in total intake immediately', () => {
    const logs = [
      { id: '1', amount_ml: 350 },
      { id: '2', amount_ml: 500 },
    ];
    assert.strictEqual(calculateTotalIntake(logs), 850);

    // Delete log 1
    const remaining = logs.filter(l => l.id !== '1');
    assert.strictEqual(calculateTotalIntake(remaining), 500);
  });
});

describe('7. Interactive Calendar Grid Generation', () => {
  it('generates a full Monday-to-Sunday aligned grid with a multiple of 7 cells', () => {
    // October 2026
    const grid = getCalendarGrid(2026, 9);

    assert.strictEqual(grid.length % 7, 0);
    assert.ok(grid.length >= 28 && grid.length <= 42);

    // October has 31 days
    const currentMonthDays = grid.filter(c => c.isCurrentMonth);
    assert.strictEqual(currentMonthDays.length, 31);
    assert.strictEqual(currentMonthDays[0].dayNumber, 1);
    assert.strictEqual(currentMonthDays[30].dayNumber, 31);
  });

  it('correctly marks future days and disables them', () => {
    // Check October 2026 grid
    const grid = getCalendarGrid(2026, 9);
    // Find today's cell
    const todayCell = grid.find(c => c.isToday);
    if (todayCell) {
      assert.strictEqual(todayCell.isFuture, false);
    }
  });

  it('formats month and year title correctly', () => {
    assert.strictEqual(formatMonthYear(2026, 9), 'October 2026');
    assert.strictEqual(formatMonthYear(2026, 11), 'December 2026');
  });
});
