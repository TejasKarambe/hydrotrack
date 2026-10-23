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
