import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';

const DB_NAME = 'hydrotrack.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const db = await SQLite.openDatabaseAsync(DB_NAME);

      // Configure performance and safety PRAGMAs
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
      `);

      // Run versioned migrations
      await runMigrations(db);

      dbInstance = db;
      return db;
    } catch (error) {
      console.error('[Database] Failed to initialize SQLite database:', error);
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    try {
      await dbInstance.closeAsync();
    } catch (e) {
      console.warn('[Database] Error closing database:', e);
    } finally {
      dbInstance = null;
      initPromise = null;
    }
  }
}
