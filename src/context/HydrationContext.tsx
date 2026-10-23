import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useRouter } from 'expo-router';
import { WaterLog, UserSettings, DEFAULT_SETTINGS } from '../types/database';
import {
  addWaterLog,
  getWaterLogsForDate,
  updateWaterLog,
  deleteWaterLog,
  getPastDaysTotals,
  getDailyAggregatesForRange,
  getDatesWithLogsForMonth,
  DailyAggregate,
} from '../database/waterLogRepository';
import {
  getSettings,
  updateSettings as updateSettingsRepo,
  resetAllDataTransactionally,
} from '../database/settingsRepository';
import {
  calculateTotalIntake,
  calculateRemaining,
  calculateProgressPercentage,
  calculateStreak,
} from '../utils/hydrationCalculations';
import {
  initializeNotificationService,
  getNotificationPermissions,
  requestNotificationPermissions,
  scheduleTestNotification,
  scheduleSnoozeReminder,
  reconcileScheduledReminders,
  openSystemSettings,
  addNotificationResponseListener,
  NotificationStatus,
} from '../services/notificationService';
import { seedSampleWeeklyData, SeedResult } from '../utils/sampleDataSeeder';

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
  notificationStatus: NotificationStatus | null;
  nextReminderTime: Date | null;
  scheduledNotificationCount: number;
  refreshToday: () => Promise<void>;
  quickAdd: (amount: number) => Promise<WaterLog>;
  logCustomAmount: (amount: number, consumedAt?: Date | string) => Promise<WaterLog>;
  editLog: (id: string, amount: number, consumedAt?: Date | string) => Promise<WaterLog>;
  deleteLog: (id: string) => Promise<boolean>;
  updateUserSettings: (updates: Partial<UserSettings>) => Promise<void>;
  getLogsForDate: (date: Date | string) => Promise<WaterLog[]>;
  getWeeklySummary: () => Promise<{ dateKey: string; dayLabel: string; totalMl: number; isToday: boolean }[]>;
  getDailyAggregates: (startDate: Date | string, endDate: Date | string) => Promise<DailyAggregate[]>;
  getDatesWithLogs: (year: number, month: number) => Promise<string[]>;
  resetAllData: () => Promise<void>;
  requestPermissions: () => Promise<NotificationStatus>;
  sendTestNotification: () => Promise<string>;
  openAppSettings: () => Promise<void>;
  reconcileReminders: () => Promise<void>;
  snoozeReminder: (minutes?: number) => Promise<string>;
  seedTestData: () => Promise<SeedResult>;
}

const HydrationContext = createContext<HydrationContextType | null>(null);

export const HydrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();

  const [todayLogs, setTodayLogs] = useState<WaterLog[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [streak, setStreak] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Notification engine state
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus | null>(null);
  const [nextReminderTime, setNextReminderTime] = useState<Date | null>(null);
  const [scheduledNotificationCount, setScheduledNotificationCount] = useState<number>(0);

  // Reconcile notifications with saved settings
  const reconcileRemindersWithSettings = useCallback(async (currentSettings: UserSettings) => {
    try {
      const perms = await getNotificationPermissions();
      setNotificationStatus(perms);

      if (currentSettings.reminders_enabled && perms.granted) {
        const result = await reconcileScheduledReminders(currentSettings);
        setScheduledNotificationCount(result.scheduledCount);
        setNextReminderTime(result.nextTrigger);
      } else {
        await reconcileScheduledReminders({ ...currentSettings, reminders_enabled: false });
        setScheduledNotificationCount(0);
        setNextReminderTime(null);
      }
    } catch (err) {
      console.warn('[HydrationContext] Error reconciling reminders:', err);
    }
  }, []);

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
      const daysForStreak = past7Days
        .map((d) => ({
          dateKey: d.dateKey,
          totalMl: d.totalMl,
          goalMl: currentSettings.daily_goal_ml,
          isToday: d.isToday,
        }))
        .reverse();
      setStreak(calculateStreak(daysForStreak));

      // Reconcile reminders
      await reconcileRemindersWithSettings(currentSettings);
    } catch (err) {
      console.error('[HydrationContext] Error loading hydration data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load hydration data.');
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [reconcileRemindersWithSettings]);

  // Initial startup and notification listener setup
  useEffect(() => {
    let responseSubscription: { remove: () => void } | null = null;

    (async () => {
      await initializeNotificationService();
      await refreshToday();

      // Listen for notification responses (user tapping on notification)
      responseSubscription = addNotificationResponseListener((data) => {
        if (data && (data.type === 'water_reminder' || data.type === 'test_notification')) {
          router.push({
            pathname: '/log-water',
            params: {
              source: 'reminder',
              scheduledTime: data.scheduledTime ? String(data.scheduledTime) : undefined,
            },
          });
        }
      });
    })();

    // Listen to app lifecycle events: reconcile when returning from background
    const appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        refreshToday();
      }
    });

    return () => {
      if (responseSubscription) {
        responseSubscription.remove();
      }
      appStateSubscription.remove();
    };
  }, [refreshToday, router]);

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
        await reconcileRemindersWithSettings(updated);
        await refreshToday();
      } catch (err) {
        console.error('[HydrationContext] Update settings failed:', err);
        throw err;
      }
    },
    [reconcileRemindersWithSettings, refreshToday]
  );

  const requestPermissions = useCallback(async (): Promise<NotificationStatus> => {
    const status = await requestNotificationPermissions();
    setNotificationStatus(status);
    if (status.granted) {
      await reconcileRemindersWithSettings(settings);
    }
    return status;
  }, [reconcileRemindersWithSettings, settings]);

  const sendTestNotification = useCallback(async (): Promise<string> => {
    return await scheduleTestNotification();
  }, []);

  const openAppSettings = useCallback(async (): Promise<void> => {
    await openSystemSettings();
  }, []);

  const reconcileReminders = useCallback(async (): Promise<void> => {
    await reconcileRemindersWithSettings(settings);
  }, [reconcileRemindersWithSettings, settings]);

  const snoozeReminder = useCallback(async (minutes: number = 15): Promise<string> => {
    return await scheduleSnoozeReminder(minutes);
  }, []);

  const getLogsForDate = useCallback(async (date: Date | string): Promise<WaterLog[]> => {
    return await getWaterLogsForDate(date);
  }, []);

  const getWeeklySummary = useCallback(async () => {
    return await getPastDaysTotals(7);
  }, []);

  const getDailyAggregates = useCallback(async (startDate: Date | string, endDate: Date | string) => {
    return await getDailyAggregatesForRange(startDate, endDate);
  }, []);

  const getDatesWithLogs = useCallback(async (year: number, month: number) => {
    return await getDatesWithLogsForMonth(year, month);
  }, []);

  const resetAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      const defaultSet = await resetAllDataTransactionally();
      setSettings(defaultSet);
      setTodayLogs([]);
      setStreak(0);
      await reconcileRemindersWithSettings(defaultSet);
    } catch (err) {
      console.error('[HydrationContext] Reset all data failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [reconcileRemindersWithSettings]);

  const seedTestData = useCallback(async (): Promise<SeedResult> => {
    try {
      setIsLoading(true);
      const result = await seedSampleWeeklyData();
      await refreshToday();
      return result;
    } catch (err) {
      console.error('[HydrationContext] Seed sample data failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshToday]);

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
      notificationStatus,
      nextReminderTime,
      scheduledNotificationCount,
      refreshToday,
      quickAdd,
      logCustomAmount,
      editLog,
      deleteLog,
      updateUserSettings,
      getLogsForDate,
      getWeeklySummary,
      getDailyAggregates,
      getDatesWithLogs,
      resetAllData,
      requestPermissions,
      sendTestNotification,
      openAppSettings,
      reconcileReminders,
      snoozeReminder,
      seedTestData,
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
      notificationStatus,
      nextReminderTime,
      scheduledNotificationCount,
      refreshToday,
      quickAdd,
      logCustomAmount,
      editLog,
      deleteLog,
      updateUserSettings,
      getLogsForDate,
      getWeeklySummary,
      getDailyAggregates,
      getDatesWithLogs,
      resetAllData,
      requestPermissions,
      sendTestNotification,
      openAppSettings,
      reconcileReminders,
      snoozeReminder,
      seedTestData,
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
