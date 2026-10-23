import { getDatabase } from './database';
import { UserSettings, DEFAULT_SETTINGS, ThemeMode, DisplayUnit } from '../types/database';

export class SettingsError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'SettingsError';
  }
}

/**
 * Retrieves all user settings from SQLite, falling back to defaults if any key is missing.
 */
export async function getSettings(): Promise<UserSettings> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ key: string; value: string }>(
      `SELECT key, value FROM settings;`
    );

    const map = new Map<string, string>();
    for (const r of rows) {
      map.set(r.key, r.value);
    }

    const dailyGoalParsed = parseInt(map.get('daily_goal_ml') || '', 10);
    const reminderIntervalParsed = parseInt(map.get('reminder_interval_minutes') || '', 10);

    let activeDaysParsed: number[] = DEFAULT_SETTINGS.active_days;
    try {
      const activeDaysRaw = map.get('active_days');
      if (activeDaysRaw) {
        const parsed = JSON.parse(activeDaysRaw);
        if (Array.isArray(parsed)) activeDaysParsed = parsed;
      }
    } catch {
      // fallback to default
    }

    const themeRaw = map.get('theme_mode');
    const themeMode: ThemeMode =
      themeRaw === 'light' || themeRaw === 'dark' || themeRaw === 'system'
        ? themeRaw
        : DEFAULT_SETTINGS.theme_mode;

    const unitRaw = map.get('preferred_display_unit');
    const preferredDisplayUnit: DisplayUnit =
      unitRaw === 'l' || unitRaw === 'ml' ? unitRaw : DEFAULT_SETTINGS.preferred_display_unit;

    return {
      daily_goal_ml: !isNaN(dailyGoalParsed) && dailyGoalParsed > 0 ? dailyGoalParsed : DEFAULT_SETTINGS.daily_goal_ml,
      reminder_interval_minutes: !isNaN(reminderIntervalParsed) && reminderIntervalParsed > 0 ? reminderIntervalParsed : DEFAULT_SETTINGS.reminder_interval_minutes,
      reminder_start_time: map.get('reminder_start_time') || DEFAULT_SETTINGS.reminder_start_time,
      reminder_end_time: map.get('reminder_end_time') || DEFAULT_SETTINGS.reminder_end_time,
      active_days: activeDaysParsed,
      reminders_enabled: map.get('reminders_enabled') === '1' || map.get('reminders_enabled') === 'true',
      theme_mode: themeMode,
      preferred_display_unit: preferredDisplayUnit,
    };
  } catch (err) {
    console.error('[settingsRepository] Failed to fetch settings:', err);
    throw new SettingsError('Failed to retrieve user settings.', err);
  }
}

/**
 * Updates a single setting by key.
 */
export async function updateSetting<K extends keyof UserSettings>(
  key: K,
  value: UserSettings[K]
): Promise<void> {
  const now = new Date().toISOString();
  let stringVal: string;

  if (typeof value === 'boolean') {
    stringVal = value ? '1' : '0';
  } else if (Array.isArray(value)) {
    stringVal = JSON.stringify(value);
  } else {
    stringVal = String(value);
  }

  try {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO settings (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
      [key, stringVal, now]
    );
  } catch (err) {
    console.error(`[settingsRepository] Failed to update setting ${key}:`, err);
    throw new SettingsError(`Failed to update setting ${key}`, err);
  }
}

/**
 * Updates multiple settings in a single transaction.
 */
export async function updateSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
  try {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      for (const [k, v] of Object.entries(updates)) {
        if (v !== undefined) {
          await updateSetting(k as keyof UserSettings, v as any);
        }
      }
    });
    return await getSettings();
  } catch (err) {
    console.error('[settingsRepository] Failed to update settings in transaction:', err);
    throw new SettingsError('Failed to update settings.', err);
  }
}

/**
 * Resets all settings to default values.
 */
export async function resetSettings(): Promise<UserSettings> {
  try {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM settings;`);
    const now = new Date().toISOString();
    for (const [key, val] of Object.entries(DEFAULT_SETTINGS)) {
      const stringVal = typeof val === 'boolean' ? (val ? '1' : '0') : Array.isArray(val) ? JSON.stringify(val) : String(val);
      await db.runAsync(`INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?);`, [key, stringVal, now]);
    }
    return DEFAULT_SETTINGS;
  } catch (err) {
    console.error('[settingsRepository] Failed to reset settings:', err);
    throw new SettingsError('Failed to reset settings.', err);
  }
}
