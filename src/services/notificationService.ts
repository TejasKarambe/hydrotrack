import * as Notifications from 'expo-notifications';
import { Platform, Linking } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import { UserSettings } from '../types/database';
import {
  generateReminderOccurrences,
  NotificationDeduplicator,
} from '../utils/reminderCalculations';

export const NOTIFICATION_CHANNEL_ID = 'water-reminders';
export const TEST_NOTIFICATION_CHANNEL_ID = 'water-reminders-test';

export interface NotificationStatus {
  status: Notifications.PermissionStatus;
  granted: boolean;
  canAskAgain: boolean;
  allowsAlert: boolean;
  allowsSound: boolean;
  allowsBadge: boolean;
  exactAlarmStatus?: 'granted' | 'denied' | 'not_applicable';
}

// Global flag to avoid duplicate handler registrations
let isHandlerConfigured = false;
const deduplicator = new NotificationDeduplicator(100);

/**
 * Configure foreground notification presentation handler and Android channels.
 */
export async function initializeNotificationService(): Promise<void> {
  if (!isHandlerConfigured) {
    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
      isHandlerConfigured = true;
    } catch (err) {
      console.warn('[NotificationService] setNotificationHandler unavailable:', err);
    }
  }

  // Create Android Notification Channels
  if (Platform.OS === 'android') {
    await setupAndroidChannels();
  }
}

/**
 * Registers a listener for user interaction with notifications (taps).
 */
export function addNotificationResponseListener(
  onResponse: (data: Record<string, any> | undefined) => void
): { remove: () => void } {
  try {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const notificationId = response.notification.request.identifier;
      if (!markNotificationHandled(notificationId)) {
        return;
      }
      const data = response.notification.request.content.data;
      onResponse(data);
    });
    return subscription;
  } catch (err) {
    console.warn('[NotificationService] Could not register response listener:', err);
    return { remove: () => { } };
  }
}

/**
 * Creates high-priority notification channels for Android.
 * In Expo Go, custom channel creation is not supported by the client app and throws
 * a NullPointerException on NotificationsChannelsProvider; notifications use the default channel.
 * In development builds and production builds (eas build / npx expo run:android), custom channels are configured.
 */
export async function setupAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android' || isRunningInExpoGo()) return;

  try {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: 'Hydration Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0284C7',
      sound: 'default',
      enableVibrate: true,
      enableLights: true,
      description: 'Scheduled reminders to drink water and maintain healthy hydration.',
    });

    await Notifications.setNotificationChannelAsync(TEST_NOTIFICATION_CHANNEL_ID, {
      name: 'Test Notifications',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 200],
      lightColor: '#38BDF8',
      sound: 'default',
      enableVibrate: true,
      enableLights: true,
      description: 'Instant notification channel to test device audio and alerts.',
    });
  } catch (err) {
    console.warn('[NotificationService] Error creating notification channels:', err);
  }
}

/**
 * Retrieves current permission status.
 */
export async function getNotificationPermissions(): Promise<NotificationStatus> {
  try {
    const perm = await Notifications.getPermissionsAsync();

    let exactAlarmStatus: 'granted' | 'denied' | 'not_applicable' = 'not_applicable';
    if (Platform.OS === 'android') {
      // In Android 12+ (API 31+), exact alarms require user permission
      // If notifications are granted, standard alarms can be scheduled; exact alarm status is tracked
      exactAlarmStatus = perm.granted ? 'granted' : 'denied';
    }

    return {
      status: perm.status,
      granted: perm.granted,
      canAskAgain: perm.canAskAgain,
      allowsAlert: perm.ios?.allowsAlert ?? perm.granted,
      allowsSound: perm.ios?.allowsSound ?? perm.granted,
      allowsBadge: perm.ios?.allowsBadge ?? perm.granted,
      exactAlarmStatus,
    };
  } catch (err) {
    console.error('[NotificationService] Error querying permissions:', err);
    return {
      status: Notifications.PermissionStatus.UNDETERMINED,
      granted: false,
      canAskAgain: true,
      allowsAlert: false,
      allowsSound: false,
      allowsBadge: false,
      exactAlarmStatus: 'not_applicable',
    };
  }
}

/**
 * Requests notification permissions from the system.
 */
export async function requestNotificationPermissions(): Promise<NotificationStatus> {
  try {
    // Android requires channel creation before permission request on Android 13+
    if (Platform.OS === 'android') {
      await setupAndroidChannels();
    }

    const perm = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });

    return {
      status: perm.status,
      granted: perm.granted,
      canAskAgain: perm.canAskAgain,
      allowsAlert: perm.ios?.allowsAlert ?? perm.granted,
      allowsSound: perm.ios?.allowsSound ?? perm.granted,
      allowsBadge: perm.ios?.allowsBadge ?? perm.granted,
      exactAlarmStatus: Platform.OS === 'android' ? (perm.granted ? 'granted' : 'denied') : 'not_applicable',
    };
  } catch (err) {
    console.error('[NotificationService] Error requesting permissions:', err);
    return await getNotificationPermissions();
  }
}

/**
 * Directs the user to the system settings page when permissions were permanently denied.
 */
export async function openSystemSettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch (err) {
    console.warn('[NotificationService] Could not open system settings:', err);
  }
}

/**
 * Triggers a test notification in 3 seconds to verify system alert, banner, and sound.
 */
export async function scheduleTestNotification(): Promise<string> {
  const perms = await getNotificationPermissions();
  if (!perms.granted) {
    const requested = await requestNotificationPermissions();
    if (!requested.granted) {
      throw new Error('Notification permissions not granted. Please enable notifications in device settings.');
    }
  }

  if (Platform.OS === 'android') {
    await setupAndroidChannels();
  }

  const triggerDate = new Date(Date.now() + 3000); // 3 seconds from now

  const isAndroidBuild = Platform.OS === 'android' && !isRunningInExpoGo();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '💧 HydroTrack Test Alert',
      body: 'Notifications and sound alerts are working properly on your device!',
      data: {
        type: 'test_notification',
        timestamp: triggerDate.toISOString(),
      },
      sound: 'default',
      categoryIdentifier: 'WATER_LOG',
      ...(isAndroidBuild ? { channelId: TEST_NOTIFICATION_CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });

  return id;
}

/**
 * Schedules a snooze reminder for a specified number of minutes from now (default 15).
 */
export async function scheduleSnoozeReminder(minutes: number = 15): Promise<string> {
  const perms = await getNotificationPermissions();
  if (!perms.granted) {
    throw new Error('Notification permissions not granted.');
  }

  if (Platform.OS === 'android') {
    await setupAndroidChannels();
  }

  const triggerDate = new Date(Date.now() + minutes * 60 * 1000);
  const isAndroidBuild = Platform.OS === 'android' && !isRunningInExpoGo();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '💧 Snoozed Hydration Reminder',
      body: `Here is your reminder from ${minutes} minutes ago. Time to grab a glass of water!`,
      data: {
        type: 'water_reminder',
        isSnoozed: true,
        scheduledTime: triggerDate.toISOString(),
      },
      sound: 'default',
      categoryIdentifier: 'WATER_LOG',
      ...(isAndroidBuild ? { channelId: NOTIFICATION_CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });

  return id;
}

/**
 * Cancels all pending HydroTrack water reminders.
 */
export async function cancelAllWaterReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (err) {
    console.warn('[NotificationService] Error cancelling notifications:', err);
  }
}

/**
 * Reconciles and schedules future reminder occurrences into the rolling notification window.
 * Avoids duplicate scheduling, deletes obsolete reminders, and schedules up to 48 upcoming slots.
 */
export async function reconcileScheduledReminders(settings: UserSettings): Promise<{
  scheduledCount: number;
  nextTrigger: Date | null;
}> {
  // If reminders are disabled, ensure all existing scheduled notifications are cancelled
  if (!settings.reminders_enabled) {
    await cancelAllWaterReminders();
    return { scheduledCount: 0, nextTrigger: null };
  }

  const perms = await getNotificationPermissions();
  if (!perms.granted) {
    console.log('[NotificationService] Cannot schedule reminders: permission not granted.');
    return { scheduledCount: 0, nextTrigger: null };
  }

  // Cancel any obsolete reminders first to guarantee a clean slate
  await cancelAllWaterReminders();

  // Generate future occurrences within the rolling window (max 48 slots to comfortably stay below iOS 64 limit)
  const occurrences = generateReminderOccurrences({
    startTime: settings.reminder_start_time,
    endTime: settings.reminder_end_time,
    intervalMinutes: settings.reminder_interval_minutes,
    activeDays: settings.active_days,
    maxOccurrences: 48,
    fromDate: new Date(),
  });

  if (occurrences.length === 0) {
    return { scheduledCount: 0, nextTrigger: null };
  }

  const reminderMessages = [
    'Time for a glass of water! Stay refreshed and focused.',
    'Hydration check: A couple of sips will keep your energy steady.',
    'Keep your flow going! Drink water to meet your daily target.',
    'Your body needs water! Take a mindful hydration break.',
  ];

  let scheduledCount = 0;
  const isAndroidBuild = Platform.OS === 'android' && !isRunningInExpoGo();

  for (let i = 0; i < occurrences.length; i++) {
    const occurrenceDate = occurrences[i];
    const message = reminderMessages[i % reminderMessages.length];

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💧 Hydration Reminder',
          body: message,
          data: {
            type: 'water_reminder',
            scheduledTime: occurrenceDate.toISOString(),
            intervalMinutes: settings.reminder_interval_minutes,
            goalMl: settings.daily_goal_ml,
          },
          sound: 'default',
          categoryIdentifier: 'WATER_LOG',
          ...(isAndroidBuild ? { channelId: NOTIFICATION_CHANNEL_ID } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: occurrenceDate,
        },
      });
      scheduledCount++;
    } catch (err) {
      console.warn(`[NotificationService] Failed to schedule slot for ${occurrenceDate.toISOString()}:`, err);
    }
  }

  return {
    scheduledCount,
    nextTrigger: occurrences[0] || null,
  };
}

/**
 * Helper to prevent double handling of notification taps.
 */
export function markNotificationHandled(notificationId: string): boolean {
  return deduplicator.markHandled(notificationId);
}
