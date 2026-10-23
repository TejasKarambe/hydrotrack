import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { WaterLog, UserSettings, DEFAULT_SETTINGS } from '../types/database';
import {
  addWaterLog,
  getWaterLogsForDate,
  updateWaterLog,
  deleteWaterLog,
  getPastDaysTotals,
  clearAllWaterLogs,
} from '../database/waterLogRepository';
import { getSettings, updateSettings as updateSettingsRepo, resetSettings as resetSettingsRepo } from '../database/settingsRepository';
import {
  calculateTotalIntake,
  calculateRemaining,
  calculateProgressPercentage,
  calculateStreak,
} from '../utils/hydrationCalculations';
import { getLocalDateKey } from '../utils/dateUtils';

interface HydrationContextType {
  todayLogs: WaterLog[];
  todayTotalMl: number;
  dailyGoalMl: number;
  remainingMl: number;
  progressPercent: number;
  settings: UserSettings;
  streak: number;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  refreshToday: () => Promise<void>;
  quickAdd: (amount: number) => Promise<WaterLog>;
  logCustomAmount: (amount: number, consumedAt?: Date | string) => Promise<WaterLog>;
  editLog: (id: string, amount: number, consumedAt?: Date | string) => Promise<WaterLog>;
  deleteLog: (id: string) => Promise<boolean>;
  updateUserSettings: (updates: Partial<UserSettings>) => Promise<void>;
  getLogsForDate: (date: Date | string) => Promise<WaterLog[]>;
  getWeeklySummary: () => Promise<{ dateKey: string; dayLabel: string; totalMl: number; isToday: boolean }[]>;
  resetAllData: () => Promise<void>;
}

const HydrationContext = createContext<HydrationContextType | null>(null);

export const HydrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [todayLogs, setTodayLogs] = useState<WaterLog[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [streak, setStreak] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load settings and today's logs on mount
  const refreshToday = useCallback(async () => {
    try {
      setError(null);
      const [currentSettings, logs, past7Days] = await Promise.all([
        getSettings(),
        getWaterLogsForDate(new Date()),
        getPastDaysTotals(7),
      ]);

      setSettings(currentSettings);
      setTodayLogs(logs);

      // Compute streak
      const daysForStreak = past7Days.map((d) => ({
        dateKey: d.dateKey,
        totalMl: d.totalMl,
        goalMl: currentSettings.daily_goal_ml,
        isToday: d.isToday,
      })).reverse(); // newest first
      setStreak(calculateStreak(daysForStreak));
    } catch (err) {
      console.error('[HydrationContext] Error loading hydration data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load hydration data.');
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    refreshToday();
  }, [refreshToday]);

  const quickAdd = useCallback(
    async (amount: number): Promise<WaterLog> => {
      try {
        const newLog = await addWaterLog(amount, new Date());
        await refreshToday();
        return newLog;
      } catch (err) {
        console.error('[HydrationContext] Quick add failed:', err);
        throw err;
      }
    },
    [refreshToday]
  );

  const logCustomAmount = useCallback(
    async (amount: number, consumedAt?: Date | string): Promise<WaterLog> => {
      try {
        const newLog = await addWaterLog(amount, consumedAt || new Date());
        await refreshToday();
        return newLog;
      } catch (err) {
        console.error('[HydrationContext] Log custom amount failed:', err);
        throw err;
      }
    },
    [refreshToday]
  );

  const editLog = useCallback(
    async (id: string, amount: number, consumedAt?: Date | string): Promise<WaterLog> => {
      try {
        const updated = await updateWaterLog(id, amount, consumedAt);
        await refreshToday();
        return updated;
      } catch (err) {
        console.error('[HydrationContext] Edit log failed:', err);
        throw err;
      }
    },
    [refreshToday]
  );

  const deleteLog = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const success = await deleteWaterLog(id);
        if (success) {
          await refreshToday();
        }
        return success;
      } catch (err) {
        console.error('[HydrationContext] Delete log failed:', err);
        throw err;
      }
    },
    [refreshToday]
  );

  const updateUserSettings = useCallback(
    async (updates: Partial<UserSettings>): Promise<void> => {
      try {
        const updated = await updateSettingsRepo(updates);
        setSettings(updated);
        await refreshToday();
      } catch (err) {
        console.error('[HydrationContext] Update settings failed:', err);
        throw err;
      }
    },
    [refreshToday]
  );

  const getLogsForDate = useCallback(async (date: Date | string): Promise<WaterLog[]> => {
    return await getWaterLogsForDate(date);
  }, []);

  const getWeeklySummary = useCallback(async () => {
    return await getPastDaysTotals(7);
  }, []);

  const resetAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      await clearAllWaterLogs();
      const defaultSet = await resetSettingsRepo();
      setSettings(defaultSet);
      setTodayLogs([]);
      setStreak(0);
    } catch (err) {
      console.error('[HydrationContext] Reset all data failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Derived hydration metrics
  const todayTotalMl = useMemo(() => calculateTotalIntake(todayLogs), [todayLogs]);
  const dailyGoalMl = settings.daily_goal_ml;
  const remainingMl = useMemo(() => calculateRemaining(todayTotalMl, dailyGoalMl), [todayTotalMl, dailyGoalMl]);
  const progressPercent = useMemo(
    () => calculateProgressPercentage(todayTotalMl, dailyGoalMl),
    [todayTotalMl, dailyGoalMl]
  );

  const value = useMemo<HydrationContextType>(
    () => ({
      todayLogs,
      todayTotalMl,
      dailyGoalMl,
      remainingMl,
      progressPercent,
      settings,
      streak,
      isLoading,
      isInitialized,
      error,
      refreshToday,
      quickAdd,
      logCustomAmount,
      editLog,
      deleteLog,
      updateUserSettings,
      getLogsForDate,
      getWeeklySummary,
      resetAllData,
    }),
    [
      todayLogs,
      todayTotalMl,
      dailyGoalMl,
      remainingMl,
      progressPercent,
      settings,
      streak,
      isLoading,
      isInitialized,
      error,
      refreshToday,
      quickAdd,
      logCustomAmount,
      editLog,
      deleteLog,
      updateUserSettings,
      getLogsForDate,
      getWeeklySummary,
      resetAllData,
    ]
  );

  return <HydrationContext.Provider value={value}>{children}</HydrationContext.Provider>;
};

export const useHydration = (): HydrationContextType => {
  const context = useContext(HydrationContext);
  if (!context) {
    throw new Error('useHydration must be used within a HydrationProvider');
  }
  return context;
};
