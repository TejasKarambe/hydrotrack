/**
 * Pure hydration calculation utilities for HydroTrack
 */

export function calculateTotalIntake(logs: { amount_ml: number }[]): number {
  if (!Array.isArray(logs) || logs.length === 0) return 0;
  return logs.reduce((sum, log) => {
    const val = typeof log?.amount_ml === 'number' && !isNaN(log.amount_ml) ? log.amount_ml : 0;
    return sum + Math.max(0, val);
  }, 0);
}

export function calculateRemaining(totalMl: number, goalMl: number): number {
  const safeTotal = Math.max(0, totalMl || 0);
  const safeGoal = Math.max(0, goalMl || 0);
  return Math.max(0, safeGoal - safeTotal);
}

export function calculateProgressPercentage(totalMl: number, goalMl: number): number {
  if (!goalMl || goalMl <= 0) return 0;
  const safeTotal = Math.max(0, totalMl || 0);
  const percent = Math.round((safeTotal / goalMl) * 100);
  return Math.min(100, Math.max(0, percent));
}

/**
 * Formats a volume in millilitres into preferred display unit (ml or L)
 * without altering the underlying stored millilitre integer.
 */
export function formatVolume(
  amountMl: number,
  unit: 'ml' | 'l' = 'ml',
  includeUnit: boolean = true
): string {
  const safeMl = Math.max(0, typeof amountMl === 'number' && !isNaN(amountMl) ? amountMl : 0);
  if (unit === 'l') {
    const litres = safeMl / 1000;
    // Format up to 2 decimal places, removing unnecessary trailing zeros (e.g. 2 instead of 2.00, 2.5 instead of 2.50)
    const formatted = litres % 1 === 0 ? litres.toString() : parseFloat(litres.toFixed(2)).toString();
    return includeUnit ? `${formatted} L` : formatted;
  }
  return includeUnit ? `${safeMl.toLocaleString()} ml` : safeMl.toLocaleString();
}

export function calculateAverageIntake(dailyTotals: number[]): number {
  if (!Array.isArray(dailyTotals) || dailyTotals.length === 0) return 0;
  const sum = dailyTotals.reduce((acc, curr) => acc + (typeof curr === 'number' && !isNaN(curr) ? curr : 0), 0);
  return Math.round(sum / dailyTotals.length);
}

export function calculateDaysAchieved(days: { totalMl: number; goalMl: number }[]): number {
  if (!Array.isArray(days) || days.length === 0) return 0;
  return days.filter((d) => d.totalMl >= d.goalMl && d.goalMl > 0).length;
}

/**
 * Calculates current active consecutive streak of days meeting goal.
 * Expects an array ordered descending by date (starting with yesterday or today if achieved).
 */
export function calculateStreak(
  daysDesc: { dateKey: string; totalMl: number; goalMl: number; isToday?: boolean }[]
): number {
  if (!daysDesc || daysDesc.length === 0) return 0;

  let streak = 0;
  const [today, ...pastDays] = daysDesc;

  // If today is completed, streak includes today
  if (today && today.totalMl >= today.goalMl && today.goalMl > 0) {
    streak += 1;
  }

  // Count backwards through past days
  for (const day of pastDays) {
    if (day.totalMl >= day.goalMl && day.goalMl > 0) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

export interface DailyIntakeItem {
  dateKey: string;
  dayLabel: string;
  totalMl: number;
  isToday: boolean;
}

export interface WeeklyMetrics {
  totalPeriod: number;
  averageDaily: number;
  daysAchieved: number;
  completionRate: number;
  bestDay: { dayLabel: string; dateKey: string; totalMl: number } | null;
  textSummary: string;
}

/**
 * Calculates complete weekly analytics metrics derived from daily totals and current daily goal.
 */
export function calculateWeeklyMetrics(
  days: DailyIntakeItem[],
  dailyGoalMl: number
): WeeklyMetrics {
  const safeGoal = Math.max(0, dailyGoalMl || 0);
  const totalDays = Array.isArray(days) ? days.length : 0;

  if (totalDays === 0) {
    return {
      totalPeriod: 0,
      averageDaily: 0,
      daysAchieved: 0,
      completionRate: 0,
      bestDay: null,
      textSummary: 'No hydration data available for this period.',
    };
  }

  const amounts = days.map((d) => (typeof d.totalMl === 'number' && !isNaN(d.totalMl) ? Math.max(0, d.totalMl) : 0));
  const totalPeriod = amounts.reduce((acc, curr) => acc + curr, 0);
  const averageDaily = calculateAverageIntake(amounts);

  const daysComparison = days.map((d) => ({
    totalMl: Math.max(0, d.totalMl || 0),
    goalMl: safeGoal,
  }));
  const daysAchieved = calculateDaysAchieved(daysComparison);
  const completionRate = Math.round((daysAchieved / totalDays) * 100);

  // Determine highest intake day
  let bestDay: { dayLabel: string; dateKey: string; totalMl: number } | null = null;
  let maxVal = 0;
  for (const d of days) {
    if (d.totalMl > maxVal) {
      maxVal = d.totalMl;
      bestDay = {
        dayLabel: d.dayLabel,
        dateKey: d.dateKey,
        totalMl: d.totalMl,
      };
    }
  }

  const todayItem = days.find((d) => d.isToday);
  const todayFragment = todayItem
    ? ` Today is in progress at ${todayItem.totalMl.toLocaleString()} ml.`
    : '';

  const textSummary = `Weekly water intake summary: 7-day average intake is ${averageDaily.toLocaleString()} ml per day across ${totalDays} days. Target of ${safeGoal.toLocaleString()} ml achieved on ${daysAchieved} of ${totalDays} days (${completionRate}%). Total consumed: ${totalPeriod.toLocaleString()} ml.${bestDay ? ` Highest intake occurred on ${bestDay.dayLabel} (${bestDay.totalMl.toLocaleString()} ml).` : ''}${todayFragment}`;

  return {
    totalPeriod,
    averageDaily,
    daysAchieved,
    completionRate,
    bestDay,
    textSummary,
  };
}
