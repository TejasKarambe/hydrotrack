import { addWaterLog } from '../database/waterLogRepository';

export interface SeedResult {
  recordsCreated: number;
  totalVolume: number;
  daysCount: number;
}

/**
 * Seeds realistic multi-log water intake records across the past 7 days into SQLite.
 * Designed for manual verification of Phase 4 history and analytics.
 *
 * Sample Distribution:
 * - 6 days ago: 2,500 ml (Goal met - 3 logs: 500, 1000, 1000)
 * - 5 days ago: 3,000 ml (Goal met - 4 logs: 750, 750, 750, 750)
 * - 4 days ago: 1,750 ml (Incomplete - 3 logs: 500, 750, 500)
 * - 3 days ago: 2,800 ml (Goal met - 4 logs: 500, 1000, 800, 500)
 * - 2 days ago: 0 ml (Zero-intake day for testing zero-day averages)
 * - Yesterday: 2,500 ml (Goal met - 3 logs: 750, 1000, 750)
 * - Today: 1,250 ml (Partial day in-progress - 2 logs: 500, 750)
 */
export async function seedSampleWeeklyData(): Promise<SeedResult> {
  const plan: { daysAgo: number; entries: { hour: number; minute: number; amount: number }[] }[] = [
    {
      daysAgo: 6,
      entries: [
        { hour: 9, minute: 15, amount: 500 },
        { hour: 13, minute: 30, amount: 1000 },
        { hour: 18, minute: 45, amount: 1000 },
      ],
    },
    {
      daysAgo: 5,
      entries: [
        { hour: 8, minute: 30, amount: 750 },
        { hour: 12, minute: 15, amount: 750 },
        { hour: 16, minute: 0, amount: 750 },
        { hour: 20, minute: 30, amount: 750 },
      ],
    },
    {
      daysAgo: 4,
      entries: [
        { hour: 10, minute: 0, amount: 500 },
        { hour: 14, minute: 30, amount: 750 },
        { hour: 19, minute: 15, amount: 500 },
      ],
    },
    {
      daysAgo: 3,
      entries: [
        { hour: 9, minute: 0, amount: 500 },
        { hour: 12, minute: 30, amount: 1000 },
        { hour: 16, minute: 15, amount: 800 },
        { hour: 20, minute: 0, amount: 500 },
      ],
    },
    {
      daysAgo: 2,
      // Zero intake day - intentionally empty to verify zero-day handling!
      entries: [],
    },
    {
      daysAgo: 1,
      entries: [
        { hour: 8, minute: 45, amount: 750 },
        { hour: 13, minute: 0, amount: 1000 },
        { hour: 18, minute: 30, amount: 750 },
      ],
    },
    {
      daysAgo: 0,
      // Today (Partial in-progress)
      entries: [
        { hour: 9, minute: 30, amount: 500 },
        { hour: 13, minute: 15, amount: 750 },
      ],
    },
  ];

  let recordsCreated = 0;
  let totalVolume = 0;

  for (const dayPlan of plan) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - dayPlan.daysAgo);

    for (const item of dayPlan.entries) {
      const logTime = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        item.hour,
        item.minute,
        0,
        0
      );

      await addWaterLog(item.amount, logTime);
      recordsCreated += 1;
      totalVolume += item.amount;
    }
  }

  return {
    recordsCreated,
    totalVolume,
    daysCount: plan.length,
  };
}
