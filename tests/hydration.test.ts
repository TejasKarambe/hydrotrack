import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateTotalIntake,
  calculateRemaining,
  calculateProgressPercentage,
  calculateAverageIntake,
  calculateDaysAchieved,
  calculateStreak,
} from '../src/utils/hydrationCalculations.ts';
import {
  validateWaterAmount,
  validateDailyGoal,
} from '../src/types/database.ts';
import {
  getLocalDayBounds,
  getBoundsFromDateKey,
  getLocalDateKey,
  isLocalToday,
  formatRelativeDate,
} from '../src/utils/dateUtils.ts';

describe('1. Hydration Total Calculation', () => {
  it('returns 0 for empty array', () => {
    assert.strictEqual(calculateTotalIntake([]), 0);
  });

  it('correctly sums multiple intake records', () => {
    const logs = [
      { amount_ml: 150 },
      { amount_ml: 250 },
      { amount_ml: 500 },
      { amount_ml: 350 },
    ];
    assert.strictEqual(calculateTotalIntake(logs), 1250);
  });

  it('handles negative or invalid values gracefully without NaN', () => {
    const logs = [
      { amount_ml: 250 },
      { amount_ml: -50 as any },
      { amount_ml: NaN as any },
      { amount_ml: 500 },
    ];
    assert.strictEqual(calculateTotalIntake(logs), 750);
  });
});

describe('2. Progress & Remaining Calculation', () => {
  it('calculates 0% when total intake is 0', () => {
    assert.strictEqual(calculateProgressPercentage(0, 2500), 0);
  });

  it('calculates exact 50% for 1250 / 2500', () => {
    assert.strictEqual(calculateProgressPercentage(1250, 2500), 50);
  });

  it('calculates 100% when goal is met exactly', () => {
    assert.strictEqual(calculateProgressPercentage(2500, 2500), 100);
  });

  it('caps progress at 100% when goal is exceeded', () => {
    assert.strictEqual(calculateProgressPercentage(3200, 2500), 100);
  });

  it('calculates correct remaining amount', () => {
    assert.strictEqual(calculateRemaining(1250, 2500), 1250);
    assert.strictEqual(calculateRemaining(2500, 2500), 0);
    assert.strictEqual(calculateRemaining(3000, 2500), 0);
  });

  it('handles 0 or negative daily goals safely', () => {
    assert.strictEqual(calculateProgressPercentage(500, 0), 0);
    assert.strictEqual(calculateRemaining(500, -100), 0);
  });
});

describe('3. Amount Validation Schemas', () => {
  it('accepts valid positive whole numbers', () => {
    assert.strictEqual(validateWaterAmount(150).isValid, true);
    assert.strictEqual(validateWaterAmount(250).isValid, true);
    assert.strictEqual(validateWaterAmount(500).isValid, true);
    assert.strictEqual(validateWaterAmount('750').isValid, true);
    assert.strictEqual(validateWaterAmount('750').value, 750);
  });

  it('rejects zero and negative amounts', () => {
    const resZero = validateWaterAmount(0);
    assert.strictEqual(resZero.isValid, false);
    assert.match(resZero.error || '', /greater than 0/);

    const resNeg = validateWaterAmount(-100);
    assert.strictEqual(resNeg.isValid, false);
  });

  it('rejects decimal amounts', () => {
    const res = validateWaterAmount(250.5);
    assert.strictEqual(res.isValid, false);
    assert.match(res.error || '', /whole number/);
  });

  it('rejects non-numeric inputs', () => {
    assert.strictEqual(validateWaterAmount('abc').isValid, false);
    assert.strictEqual(validateWaterAmount(null).isValid, false);
    assert.strictEqual(validateWaterAmount(undefined).isValid, false);
    assert.strictEqual(validateWaterAmount('').isValid, false);
  });

  it('rejects amounts exceeding 5000 ml limit', () => {
    const res = validateWaterAmount(5001);
    assert.strictEqual(res.isValid, false);
    assert.match(res.error || '', /5,000/);
  });

  it('validates daily goal range between 500 and 10000 ml', () => {
    assert.strictEqual(validateDailyGoal(2500).isValid, true);
    assert.strictEqual(validateDailyGoal(499).isValid, false);
    assert.strictEqual(validateDailyGoal(10001).isValid, false);
  });
});

describe('4. Local Day Boundaries & Midnight Safety', () => {
  it('generates start at 00:00:00.000 and end at 23:59:59.999 in local time', () => {
    const testDate = new Date(2026, 9, 23, 15, 30, 0); // 2026-10-23 15:30:00 local
    const bounds = getLocalDayBounds(testDate);

    assert.strictEqual(bounds.dateKey, '2026-10-23');

    const startDate = new Date(bounds.startIso);
    const endDate = new Date(bounds.endIso);

    // Verify local hours
    assert.strictEqual(startDate.getFullYear(), 2026);
    assert.strictEqual(startDate.getMonth(), 9);
    assert.strictEqual(startDate.getDate(), 23);
    assert.strictEqual(startDate.getHours(), 0);
    assert.strictEqual(startDate.getMinutes(), 0);
    assert.strictEqual(startDate.getSeconds(), 0);
    assert.strictEqual(startDate.getMilliseconds(), 0);

    assert.strictEqual(endDate.getFullYear(), 2026);
    assert.strictEqual(endDate.getMonth(), 9);
    assert.strictEqual(endDate.getDate(), 23);
    assert.strictEqual(endDate.getHours(), 23);
    assert.strictEqual(endDate.getMinutes(), 59);
    assert.strictEqual(endDate.getSeconds(), 59);
    assert.strictEqual(endDate.getMilliseconds(), 999);
  });

  it('correctly includes time recorded 1 minute before midnight in that day', () => {
    const targetDate = new Date(2026, 9, 23);
    const bounds = getLocalDayBounds(targetDate);

    const justBeforeMidnight = new Date(2026, 9, 23, 23, 59, 0, 0).toISOString();
    assert.ok(justBeforeMidnight >= bounds.startIso && justBeforeMidnight <= bounds.endIso);
  });

  it('correctly excludes time recorded at 00:01 on the following day', () => {
    const targetDate = new Date(2026, 9, 23);
    const bounds = getLocalDayBounds(targetDate);

    const followingDay = new Date(2026, 9, 24, 0, 1, 0, 0).toISOString();
    assert.ok(followingDay > bounds.endIso);
  });

  it('correctly excludes time recorded at 23:59 on the preceding day', () => {
    const targetDate = new Date(2026, 9, 23);
    const bounds = getLocalDayBounds(targetDate);

    const precedingDay = new Date(2026, 9, 22, 23, 59, 0, 0).toISOString();
    assert.ok(precedingDay < bounds.startIso);
  });

  it('identifies today accurately and formats relative dates', () => {
    const today = new Date();
    assert.strictEqual(isLocalToday(today.toISOString()), true);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    assert.strictEqual(isLocalToday(yesterday.toISOString()), false);
    assert.strictEqual(formatRelativeDate(yesterday.toISOString()), 'Yesterday');
  });
});

describe('5. Streak and Analytics Aggregations', () => {
  it('calculates average daily intake correctly', () => {
    assert.strictEqual(calculateAverageIntake([2000, 2500, 3000]), 2500);
    assert.strictEqual(calculateAverageIntake([0, 0, 0]), 0);
  });

  it('calculates number of days achieved', () => {
    const days = [
      { totalMl: 2500, goalMl: 2500 },
      { totalMl: 1800, goalMl: 2500 },
      { totalMl: 2600, goalMl: 2500 },
      { totalMl: 0, goalMl: 2500 },
    ];
    assert.strictEqual(calculateDaysAchieved(days), 2);
  });

  it('calculates consecutive active streak', () => {
    // 3 days meeting goal starting from yesterday
    const days = [
      { dateKey: '2026-10-23', totalMl: 1200, goalMl: 2500, isToday: true }, // today not met yet
      { dateKey: '2026-10-22', totalMl: 2600, goalMl: 2500 },
      { dateKey: '2026-10-21', totalMl: 2500, goalMl: 2500 },
      { dateKey: '2026-10-20', totalMl: 1000, goalMl: 2500 }, // broke here
      { dateKey: '2026-10-19', totalMl: 2500, goalMl: 2500 },
    ];
    assert.strictEqual(calculateStreak(days), 2);

    // If today is met, streak adds today
    days[0].totalMl = 2500;
    assert.strictEqual(calculateStreak(days), 3);
  });
});
