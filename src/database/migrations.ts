import type { SQLiteDatabase } from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SETTINGS } from '../types/database';

export interface Migration {
  version: number;
  name: string;
  up: (db: SQLiteDatabase) => Promise<void>;
}

export const migrations: Migration[] = [
  {
    version: 1,
    name: 'create_water_logs_and_settings_tables',
    up: async (db: SQLiteDatabase) => {
      // 1. Create water_logs table with indexes
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS water_logs (
          id TEXT PRIMARY KEY NOT NULL,
          amount_ml INTEGER NOT NULL,
          consumed_at TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_water_logs_consumed_at ON water_logs(consumed_at);
      `);

      // 2. Create settings key-value table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);

      // 3. Check for existing theme preference from Phase 1 AsyncStorage
      let migratedTheme = DEFAULT_SETTINGS.theme_mode;
      try {
        const savedTheme = await AsyncStorage.getItem('@hydrotrack_theme_preference');
        if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
          migratedTheme = savedTheme;
        }
      } catch (e) {
        console.warn('Could not read legacy theme from AsyncStorage:', e);
      }

      // 4. Seed default settings if not already present
      const now = new Date().toISOString();
      const initialSettings = [
        { key: 'daily_goal_ml', value: String(DEFAULT_SETTINGS.daily_goal_ml) },
        { key: 'reminder_interval_minutes', value: String(DEFAULT_SETTINGS.reminder_interval_minutes) },
        { key: 'reminder_start_time', value: DEFAULT_SETTINGS.reminder_start_time },
        { key: 'reminder_end_time', value: DEFAULT_SETTINGS.reminder_end_time },
        { key: 'active_days', value: JSON.stringify(DEFAULT_SETTINGS.active_days) },
        { key: 'reminders_enabled', value: DEFAULT_SETTINGS.reminders_enabled ? '1' : '0' },
        { key: 'theme_mode', value: migratedTheme },
        { key: 'preferred_display_unit', value: DEFAULT_SETTINGS.preferred_display_unit },
      ];

      for (const setting of initialSettings) {
        await db.runAsync(
          `INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES (?, ?, ?);`,
          [setting.key, setting.value, now]
        );
      }
    },
  },
];

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  // Ensure schema_migrations table exists
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  // Fetch already applied versions
  const appliedRows = await db.getAllAsync<{ version: number }>(
    `SELECT version FROM schema_migrations ORDER BY version ASC;`
  );
  const appliedSet = new Set(appliedRows.map((r) => r.version));

  // Run pending migrations in transaction
  for (const migration of migrations) {
    if (!appliedSet.has(migration.version)) {
      console.log(`[Database] Applying migration v${migration.version}: ${migration.name}...`);
      await db.withTransactionAsync(async () => {
        await migration.up(db);
        await db.runAsync(
          `INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?);`,
          [migration.version, migration.name, new Date().toISOString()]
        );
      });
      console.log(`[Database] Migration v${migration.version} applied successfully.`);
    }
  }
}
