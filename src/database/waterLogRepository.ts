import { getDatabase } from './database';
import { WaterLog, validateWaterAmount } from '../types/database';
import { getLocalDayBounds, getBoundsFromDateKey, getLocalDateKey, getDateRange } from '../utils/dateUtils';

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export class WaterLogError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'WaterLogError';
  }
}

/**
 * Inserts a new water intake record into SQLite.
 */
export async function addWaterLog(
  amountMl: number,
  consumedAt: string | Date = new Date()
): Promise<WaterLog> {
  const validation = validateWaterAmount(amountMl);
  if (!validation.isValid || !validation.value) {
    throw new WaterLogError(validation.error || 'Invalid water amount.');
  }

  const validAmount = validation.value;
  const consumedIso = consumedAt instanceof Date ? consumedAt.toISOString() : new Date(consumedAt).toISOString();
  const nowIso = new Date().toISOString();
  const id = generateId();

  try {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO water_logs (id, amount_ml, consumed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?);`,
      [id, validAmount, consumedIso, nowIso, nowIso]
    );

    return {
      id,
      amount_ml: validAmount,
      consumed_at: consumedIso,
      created_at: nowIso,
      updated_at: nowIso,
    };
  } catch (err) {
    console.error('[waterLogRepository] Failed to insert water log:', err);
    throw new WaterLogError('Failed to record water intake in database.', err);
  }
}

/**
 * Fetches a single water log by ID.
 */
export async function getWaterLogById(id: string): Promise<WaterLog | null> {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<WaterLog>(
      `SELECT id, amount_ml, consumed_at, created_at, updated_at
       FROM water_logs
       WHERE id = ?;`,
      [id]
    );
    return row || null;
  } catch (err) {
    console.error(`[waterLogRepository] Failed to fetch log ${id}:`, err);
    throw new WaterLogError(`Failed to retrieve log with ID ${id}`, err);
  }
}

/**
 * Updates an existing water intake record.
 */
export async function updateWaterLog(
  id: string,
  amountMl: number,
  consumedAt?: string | Date
): Promise<WaterLog> {
  const validation = validateWaterAmount(amountMl);
  if (!validation.isValid || !validation.value) {
    throw new WaterLogError(validation.error || 'Invalid water amount.');
  }

  const existing = await getWaterLogById(id);
  if (!existing) {
    throw new WaterLogError(`Intake record with ID ${id} not found.`);
  }

  const validAmount = validation.value;
  const consumedIso = consumedAt
    ? consumedAt instanceof Date
      ? consumedAt.toISOString()
      : new Date(consumedAt).toISOString()
    : existing.consumed_at;
  const nowIso = new Date().toISOString();

  try {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE water_logs
       SET amount_ml = ?, consumed_at = ?, updated_at = ?
       WHERE id = ?;`,
      [validAmount, consumedIso, nowIso, id]
    );

    return {
      ...existing,
      amount_ml: validAmount,
      consumed_at: consumedIso,
      updated_at: nowIso,
    };
  } catch (err) {
    console.error(`[waterLogRepository] Failed to update log ${id}:`, err);
    throw new WaterLogError(`Failed to update water log ${id}`, err);
  }
}

/**
 * Deletes a water intake record by ID.
 */
export async function deleteWaterLog(id: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const result = await db.runAsync(`DELETE FROM water_logs WHERE id = ?;`, [id]);
    return result.changes > 0;
  } catch (err) {
    console.error(`[waterLogRepository] Failed to delete log ${id}:`, err);
    throw new WaterLogError(`Failed to delete water log ${id}`, err);
  }
}

/**
 * Fetches all water intake records for a given date in local time, ordered newest first.
 */
export async function getWaterLogsForDate(date: Date | string = new Date()): Promise<WaterLog[]> {
  const bounds = typeof date === 'string' && date.length === 10
    ? getBoundsFromDateKey(date)
    : getLocalDayBounds(date);

  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<WaterLog>(
      `SELECT id, amount_ml, consumed_at, created_at, updated_at
       FROM water_logs
       WHERE consumed_at >= ? AND consumed_at <= ?
       ORDER BY consumed_at DESC;`,
      [bounds.startIso, bounds.endIso]
    );
    return rows;
  } catch (err) {
    console.error(`[waterLogRepository] Failed to fetch logs for date ${bounds.dateKey}:`, err);
    throw new WaterLogError(`Failed to fetch logs for date ${bounds.dateKey}`, err);
  }
}

/**
 * Calculates total water consumed for a given local date.
 */
export async function getDailyTotal(date: Date | string = new Date()): Promise<number> {
  const bounds = typeof date === 'string' && date.length === 10
    ? getBoundsFromDateKey(date)
    : getLocalDayBounds(date);

  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ total: number | null }>(
      `SELECT SUM(amount_ml) as total
       FROM water_logs
       WHERE consumed_at >= ? AND consumed_at <= ?;`,
      [bounds.startIso, bounds.endIso]
    );
    return row?.total ?? 0;
  } catch (err) {
    console.error(`[waterLogRepository] Failed to get total for date ${bounds.dateKey}:`, err);
    throw new WaterLogError(`Failed to calculate daily total for ${bounds.dateKey}`, err);
  }
}

export interface DailyAggregate {
  dateKey: string;
  dayLabel: string;
  date: Date;
  totalMl: number;
  isToday: boolean;
  logCount: number;
}

/**
 * Fetches daily aggregates for any custom date range in a single indexed SQLite query.
 * Fills zero-intake days automatically.
 */
export async function getDailyAggregatesForRange(
  startDate: Date | string,
  endDate: Date | string
): Promise<DailyAggregate[]> {
  const dates = getDateRange(startDate, endDate);
  if (dates.length === 0) return [];

  const firstBounds = getLocalDayBounds(dates[0]);
  const lastBounds = getLocalDayBounds(dates[dates.length - 1]);
  const todayKey = getLocalDateKey(new Date());

  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ id: string; amount_ml: number; consumed_at: string }>(
      `SELECT id, amount_ml, consumed_at
       FROM water_logs
       WHERE consumed_at >= ? AND consumed_at <= ?
       ORDER BY consumed_at ASC;`,
      [firstBounds.startIso, lastBounds.endIso]
    );

    // Group rows by local date key
    const logsByDate = new Map<string, number>();
    const countByDate = new Map<string, number>();

    for (const row of rows) {
      const key = getLocalDateKey(row.consumed_at);
      const currentSum = logsByDate.get(key) || 0;
      logsByDate.set(key, currentSum + row.amount_ml);
      countByDate.set(key, (countByDate.get(key) || 0) + 1);
    }

    const aggregates: DailyAggregate[] = dates.map((d) => {
      const bounds = getLocalDayBounds(d);
      const isToday = bounds.dateKey === todayKey;
      const dayLabel = isToday
        ? 'Today'
        : d.toLocaleDateString([], { weekday: 'short' });

      return {
        dateKey: bounds.dateKey,
        dayLabel,
        date: d,
        totalMl: logsByDate.get(bounds.dateKey) || 0,
        isToday,
        logCount: countByDate.get(bounds.dateKey) || 0,
      };
    });

    return aggregates;
  } catch (err) {
    console.error('[waterLogRepository] Failed to get range aggregates:', err);
    throw new WaterLogError('Failed to calculate water aggregates for date range', err);
  }
}

/**
 * Fetches totals for past N days up to today in a single query.
 */
export async function getPastDaysTotals(
  daysCount: number = 7
): Promise<{ dateKey: string; dayLabel: string; totalMl: number; isToday: boolean }[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (daysCount - 1));

  const aggregates = await getDailyAggregatesForRange(startDate, endDate);
  return aggregates.map((a) => ({
    dateKey: a.dateKey,
    dayLabel: a.dayLabel,
    totalMl: a.totalMl,
    isToday: a.isToday,
  }));
}

/**
 * Returns distinct local date keys (YYYY-MM-DD) that have recorded water intake in a given month.
 */
export async function getDatesWithLogsForMonth(
  year: number,
  month: number
): Promise<string[]> {
  const startLocal = new Date(year, month, 1, 0, 0, 0, 0);
  const endLocal = new Date(year, month + 1, 0, 23, 59, 59, 999);

  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ consumed_at: string }>(
      `SELECT consumed_at
       FROM water_logs
       WHERE consumed_at >= ? AND consumed_at <= ?;`,
      [startLocal.toISOString(), endLocal.toISOString()]
    );

    const dateSet = new Set<string>();
    for (const r of rows) {
      dateSet.add(getLocalDateKey(r.consumed_at));
    }

    return Array.from(dateSet);
  } catch (err) {
    console.error('[waterLogRepository] Failed to get dates with logs for month:', err);
    return [];
  }
}

/**
 * Resets all water intake records (for testing or user data reset).
 */
export async function clearAllWaterLogs(): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM water_logs;`);
  } catch (err) {
    console.error('[waterLogRepository] Failed to clear water logs:', err);
    throw new WaterLogError('Failed to clear water logs', err);
  }
}
