import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  Modal,
  TextInput,
  Keyboard,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  Sun,
  Moon,
  Smartphone,
  Target,
  Bell,
  Scale,
  ShieldCheck,
  Check,
  Sparkles,
  Trash2,
  ChevronRight,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Send,
  Info,
  Sliders,
  Database,
  X,
  Plus,
  Minus,
} from 'lucide-react-native';
import { Screen, AppText, Card, Divider, Button } from '../../src/components/ui';
import { useAppTheme } from '../../src/theme/ThemeProvider';
import { useHydration } from '../../src/context/HydrationContext';
import { ThemePreference } from '../../src/theme/tokens';
import { validateDailyGoal } from '../../src/types/database';
import { formatLocalTime } from '../../src/utils/dateUtils';
import { WatchTimePickerModal } from '../../src/components/common/WatchTimePickerModal';

const INTERVAL_PRESETS = [
  { label: '30m', value: 30 },
  { label: '45m', value: 45 },
  { label: '60m', value: 60 },
  { label: '90m', value: 90 },
  { label: '120m', value: 120 },
];

const WEEKDAYS = [
  { day: 1, letter: 'M', name: 'Mon' },
  { day: 2, letter: 'T', name: 'Tue' },
  { day: 3, letter: 'W', name: 'Wed' },
  { day: 4, letter: 'T', name: 'Thu' },
  { day: 5, letter: 'F', name: 'Fri' },
  { day: 6, letter: 'S', name: 'Sat' },
  { day: 7, letter: 'S', name: 'Sun' },
];

const GOAL_PRESETS = [1500, 2000, 2500, 3000, 3500];

export default function SettingsScreen() {
  const { themePreference, setThemePreference, colors, isDark, radii } = useAppTheme();
  const {
    settings,
    updateUserSettings,
    resetAllData,
    notificationStatus,
    nextReminderTime,
    scheduledNotificationCount,
    sendTestNotification,
    requestPermissions,
    openAppSettings,
    seedTestData,
  } = useHydration();

  // Daily Goal modal state
  const [isGoalModalVisible, setIsGoalModalVisible] = useState(false);
  const [goalInput, setGoalInput] = useState(String(settings.daily_goal_ml));
  const [goalError, setGoalError] = useState<string | null>(null);
  const [isSavingGoal, setIsSavingGoal] = useState(false);

  // Watch-style time picker modal state
  const [isWatchPickerVisible, setIsWatchPickerVisible] = useState(false);

  // About modal state
  const [isAboutModalVisible, setIsAboutModalVisible] = useState(false);

  // Test notification feedback
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testFeedback, setTestFeedback] = useState<string | null>(null);

  // Seed sample data state
  const [isSeeding, setIsSeeding] = useState(false);

  const themeOptions: { label: string; value: ThemePreference; icon: React.ReactNode }[] = [
    {
      label: 'System Default',
      value: 'system',
      icon: <Smartphone size={18} color={themePreference === 'system' ? colors.accent : colors.textSecondary} />,
    },
    {
      label: 'Light Aqua',
      value: 'light',
      icon: <Sun size={18} color={themePreference === 'light' ? colors.accent : colors.textSecondary} />,
    },
    {
      label: 'Obsidian Dark',
      value: 'dark',
      icon: <Moon size={18} color={themePreference === 'dark' ? colors.accent : colors.textSecondary} />,
    },
  ];

  // Daily Goal Handlers
  const handleOpenGoalModal = () => {
    setGoalInput(String(settings.daily_goal_ml));
    setGoalError(null);
    setIsGoalModalVisible(true);
  };

  const handleAdjustGoalBy = (delta: number) => {
    const current = parseInt(goalInput, 10) || settings.daily_goal_ml || 2500;
    const next = Math.max(500, Math.min(10000, current + delta));
    setGoalInput(String(next));
    if (goalError) setGoalError(null);
  };

  const handleSelectGoalPreset = (val: number) => {
    setGoalInput(String(val));
    if (goalError) setGoalError(null);
  };

  const handleSaveGoal = async () => {
    const validation = validateDailyGoal(goalInput);
    if (!validation.isValid || !validation.value) {
      setGoalError(validation.error || 'Please enter a valid goal (500 – 10,000 ml).');
      return;
    }

    try {
      setIsSavingGoal(true);
      await updateUserSettings({ daily_goal_ml: validation.value });
      setIsGoalModalVisible(false);
      Keyboard.dismiss();
    } catch {
      Alert.alert('Error', 'Failed to update daily goal. Please try again.');
    } finally {
      setIsSavingGoal(false);
    }
  };

  // Watch Time Picker Handler
  const handleSaveTimeWindow = async (start: string, end: string) => {
    await updateUserSettings({
      reminder_start_time: start,
      reminder_end_time: end,
    });
  };

  // Settings Toggles & Updates
  const handleToggleRemindersEnabled = async () => {
    const nextState = !settings.reminders_enabled;
    try {
      await updateUserSettings({ reminders_enabled: nextState });
    } catch {
      Alert.alert('Error', 'Failed to update reminder status.');
    }
  };

  const handleSelectInterval = async (interval: number) => {
    if (interval === settings.reminder_interval_minutes) return;
    try {
      await updateUserSettings({ reminder_interval_minutes: interval });
    } catch {
      Alert.alert('Error', 'Failed to update reminder interval.');
    }
  };

  const handleToggleWeekday = async (day: number) => {
    const currentDays = settings.active_days || [1, 2, 3, 4, 5, 6, 7];
    let nextDays: number[];

    if (currentDays.includes(day)) {
      if (currentDays.length === 1) {
        Alert.alert('Active Schedule', 'At least one active weekday must remain enabled.');
        return;
      }
      nextDays = currentDays.filter((d) => d !== day).sort((a, b) => a - b);
    } else {
      nextDays = [...currentDays, day].sort((a, b) => a - b);
    }

    try {
      await updateUserSettings({ active_days: nextDays });
    } catch {
      Alert.alert('Error', 'Failed to update active days.');
    }
  };

  const handleToggleUnit = async () => {
    const nextUnit = settings.preferred_display_unit === 'ml' ? 'l' : 'ml';
    try {
      await updateUserSettings({ preferred_display_unit: nextUnit });
    } catch {
      Alert.alert('Error', 'Failed to update preferred display unit.');
    }
  };

  // Notification testing and permissions
  const handleSendTestNotification = async () => {
    if (isSendingTest) return;
    try {
      setIsSendingTest(true);
      setTestFeedback(null);
      await sendTestNotification();
      setTestFeedback('Alert scheduled! You will receive it in 3 seconds.');
      setTimeout(() => {
        setTestFeedback(null);
      }, 5000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to schedule test notification.';
      Alert.alert('Notification Notice', msg, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Manage Permissions', onPress: handleRequestPermissions },
      ]);
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleRequestPermissions = async () => {
    try {
      const status = await requestPermissions();
      if (!status.granted && !status.canAskAgain) {
        Alert.alert(
          'Permission Blocked',
          'Notifications are disabled for HydroTrack in your device settings. Would you like to open system settings?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openAppSettings },
          ]
        );
      }
    } catch {
      Alert.alert('Error', 'Could not request permissions.');
    }
  };

  const handleSeedData = () => {
    Alert.alert(
      'Load Sample 7-Day History',
      'This will populate realistic multi-log water intake entries across the past 7 days into SQLite to verify history, charts, and weekly analytics.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Load Sample Data',
          onPress: async () => {
            try {
              setIsSeeding(true);
              const result = await seedTestData();
              Alert.alert(
                'Sample Data Loaded',
                `Successfully recorded ${result.recordsCreated} entries (${result.totalVolume.toLocaleString()} ml total) across ${result.daysCount} days into SQLite. Open History and Analytics tabs to inspect your updated charts!`
              );
            } catch {
              Alert.alert('Error', 'Failed to seed sample data.');
            } finally {
              setIsSeeding(false);
            }
          },
        },
      ]
    );
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'Are you sure you want to erase all hydration logs and restore default settings? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset All',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetAllData();
              Alert.alert('Reset Complete', 'All local data has been reset to defaults.');
            } catch {
              Alert.alert('Error', 'Failed to reset data.');
            }
          },
        },
      ]
    );
  };

  const activeDaysCount = (settings.active_days || []).length;

  return (
    <Screen scrollable safeAreaEdges={['top']}>
      <LinearGradient colors={colors.backgroundGradient} style={StyleSheet.absoluteFill} />

      <View style={styles.container}>
        {/* ── Header ── */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <AppText variant="h1" color="primary">Settings</AppText>
          <AppText variant="subtext" color="secondary">
            Personalize your hydration experience
          </AppText>
        </Animated.View>

        {/* ── Appearance ── */}
        <Animated.View entering={FadeInUp.delay(80).duration(440)} style={styles.section}>
          <AppText variant="caption" color="secondary" style={styles.sectionLabel}>
            APPEARANCE
          </AppText>
          <Card variant="default" padding={0} style={styles.roundedCard}>
            {themeOptions.map((opt, index) => {
              const isSelected = themePreference === opt.value;
              return (
                <React.Fragment key={opt.value}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Set theme to ${opt.label}`}
                    onPress={() => setThemePreference(opt.value)}
                    style={({ pressed }) => [
                      styles.pressableRow,
                      { opacity: pressed ? 0.78 : 1 },
                    ]}
                  >
                    <View style={styles.settingRow}>
                      <View style={styles.settingRowLeft}>
                        <View style={[
                          styles.iconBox,
                          {
                            backgroundColor: isSelected ? colors.accentSubtle : colors.surfaceSubtle,
                            borderColor: isSelected ? colors.accent : colors.border,
                          },
                        ]}>
                          {opt.icon}
                        </View>
                        <View style={styles.textColumn}>
                          <AppText variant="bodyBold" color="primary">{opt.label}</AppText>
                          <AppText variant="caption" color="secondary">
                            {opt.value === 'system'
                              ? `Follows device · now ${isDark ? 'Dark' : 'Light'}`
                              : `Always ${opt.label.toLowerCase()}`}
                          </AppText>
                        </View>
                      </View>
                      <View style={styles.settingRowRight}>
                        <View
                          style={[
                            styles.radioCircle,
                            {
                              borderColor: isSelected ? colors.accent : colors.border,
                              backgroundColor: isSelected ? colors.accent : 'transparent',
                            },
                          ]}
                        >
                          {isSelected && <Check size={13} color="#fff" strokeWidth={3} />}
                        </View>
                      </View>
                    </View>
                  </Pressable>
                  {index < themeOptions.length - 1 && <Divider subtle spacing={0} />}
                </React.Fragment>
              );
            })}
          </Card>
        </Animated.View>

        {/* ── Hydration Targets ── */}
        <Animated.View entering={FadeInUp.delay(140).duration(440)} style={styles.section}>
          <AppText variant="caption" color="secondary" style={styles.sectionLabel}>
            HYDRATION TARGETS
          </AppText>
          <Card variant="default" padding={0} style={styles.roundedCard}>
            {/* Daily Goal */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit daily water goal"
              onPress={handleOpenGoalModal}
              style={({ pressed }) => [styles.pressableRow, { opacity: pressed ? 0.78 : 1 }]}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingRowLeft}>
                  <View style={[styles.iconBox, { backgroundColor: colors.accentSubtle, borderColor: colors.accent }]}>
                    <Target size={18} color={colors.accent} strokeWidth={2.3} />
                  </View>
                  <View style={styles.textColumn}>
                    <AppText variant="bodyBold" color="primary">Daily Water Goal</AppText>
                    <AppText variant="caption" color="secondary">Tap to set your target</AppText>
                  </View>
                </View>
                <View style={styles.settingRowRight}>
                  <View style={[styles.valuePill, { backgroundColor: colors.accentSubtle, borderColor: colors.accent }]}>
                    <AppText variant="captionBold" color="accent">
                      {settings.daily_goal_ml.toLocaleString()} ml
                    </AppText>
                  </View>
                  <ChevronRight size={16} color={colors.textMuted} />
                </View>
              </View>
            </Pressable>

            <Divider subtle spacing={0} />

            {/* Volume Unit */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Toggle preferred unit"
              onPress={handleToggleUnit}
              style={({ pressed }) => [styles.pressableRow, { opacity: pressed ? 0.78 : 1 }]}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingRowLeft}>
                  <View style={[styles.iconBox, { backgroundColor: colors.accentSubtle, borderColor: colors.accent }]}>
                    <Scale size={18} color={colors.accent} strokeWidth={2.3} />
                  </View>
                  <View style={styles.textColumn}>
                    <AppText variant="bodyBold" color="primary">Volume Unit</AppText>
                    <AppText variant="caption" color="secondary">Tap to switch unit</AppText>
                  </View>
                </View>
                <View style={styles.settingRowRight}>
                  <View style={[styles.valuePill, { backgroundColor: colors.accentSubtle, borderColor: colors.accent }]}>
                    <AppText variant="captionBold" color="accent">
                      {settings.preferred_display_unit === 'ml' ? 'ml (Millilitres)' : 'L (Litres)'}
                    </AppText>
                  </View>
                  <ChevronRight size={16} color={colors.textMuted} />
                </View>
              </View>
            </Pressable>
          </Card>
        </Animated.View>

        {/* ── Reminders ── */}
        <Animated.View entering={FadeInUp.delay(200).duration(440)} style={styles.section}>
          <AppText variant="caption" color="secondary" style={styles.sectionLabel}>
            REMINDERS
          </AppText>

          <Card variant="default" padding={0} style={styles.roundedCard}>
            {/* Master toggle */}
            <Pressable
              accessibilityRole="switch"
              accessibilityLabel="Toggle hydration reminders"
              accessibilityState={{ checked: settings.reminders_enabled }}
              onPress={handleToggleRemindersEnabled}
              style={({ pressed }) => [styles.pressableRow, { opacity: pressed ? 0.78 : 1 }]}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingRowLeft}>
                  <View style={[
                    styles.iconBox,
                    {
                      backgroundColor: settings.reminders_enabled ? colors.accentSubtle : colors.surfaceSubtle,
                      borderColor: settings.reminders_enabled ? colors.accent : colors.border,
                    },
                  ]}>
                    <Bell
                      size={18}
                      color={settings.reminders_enabled ? colors.accent : colors.textMuted}
                      strokeWidth={2.3}
                    />
                  </View>
                  <View style={styles.textColumn}>
                    <AppText variant="bodyBold" color="primary">Hydration Reminders</AppText>
                    <AppText variant="caption" color="secondary">
                      {settings.reminders_enabled ? 'Rolling schedule active' : 'Notifications paused'}
                    </AppText>
                  </View>
                </View>
                <View style={styles.settingRowRight}>
                  <View style={[
                    styles.switchTrack,
                    { backgroundColor: settings.reminders_enabled ? colors.accent : colors.border },
                  ]}>
                    <View style={[
                      styles.switchThumb,
                      { transform: [{ translateX: settings.reminders_enabled ? 20 : 2 }] },
                    ]} />
                  </View>
                </View>
              </View>
            </Pressable>

            {settings.reminders_enabled && (
              <>
                <Divider subtle spacing={0} />

                {/* Active Time Window (Watch Picker) */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Edit active reminder window with watch picker"
                  onPress={() => setIsWatchPickerVisible(true)}
                  style={({ pressed }) => [styles.pressableRow, { opacity: pressed ? 0.78 : 1 }]}
                >
                  <View style={styles.settingRow}>
                    <View style={styles.settingRowLeft}>
                      <View style={[styles.iconBox, { backgroundColor: colors.accentSubtle, borderColor: colors.accent }]}>
                        <Clock size={18} color={colors.accent} strokeWidth={2.3} />
                      </View>
                      <View style={styles.textColumn}>
                        <AppText variant="bodyBold" color="primary">Active Hours</AppText>
                        <AppText variant="caption" color="secondary">
                          {settings.reminder_start_time} – {settings.reminder_end_time}
                        </AppText>
                      </View>
                    </View>
                    <View style={styles.settingRowRight}>
                      <View style={[styles.valuePill, { backgroundColor: colors.accentSubtle, borderColor: colors.accent }]}>
                        <AppText variant="captionBold" color="accent">Watch Picker</AppText>
                      </View>
                      <ChevronRight size={16} color={colors.textMuted} />
                    </View>
                  </View>
                </Pressable>

                <Divider subtle spacing={0} />

                {/* Interval header + chips */}
                <View style={styles.segmentedCardSection}>
                  <View style={styles.settingRow}>
                    <View style={styles.settingRowLeft}>
                      <View style={[styles.iconBox, { backgroundColor: colors.accentSubtle, borderColor: colors.accent }]}>
                        <Sliders size={18} color={colors.accent} strokeWidth={2.3} />
                      </View>
                      <View style={styles.textColumn}>
                        <AppText variant="bodyBold" color="primary">Reminder Interval</AppText>
                        <AppText variant="caption" color="secondary">How often to remind you</AppText>
                      </View>
                    </View>
                    <View style={styles.settingRowRight}>
                      <View style={[styles.valuePill, { backgroundColor: colors.accentSubtle, borderColor: colors.accent }]}>
                        <AppText variant="captionBold" color="accent">
                          Every {settings.reminder_interval_minutes}m
                        </AppText>
                      </View>
                    </View>
                  </View>

                  <View style={styles.chipsRow}>
                    {INTERVAL_PRESETS.map((item) => {
                      const isSelected = settings.reminder_interval_minutes === item.value;
                      return (
                        <Pressable
                          key={item.value}
                          accessibilityRole="button"
                          accessibilityLabel={`Set interval to ${item.label}`}
                          onPress={() => handleSelectInterval(item.value)}
                          style={({ pressed }) => [
                            styles.chip,
                            {
                              backgroundColor: isSelected ? colors.accent : colors.surfaceSubtle,
                              borderColor: isSelected ? colors.accent : colors.border,
                              opacity: pressed ? 0.78 : 1,
                            },
                          ]}
                        >
                          <AppText variant="captionBold" color={isSelected ? 'accentText' : 'secondary'}>
                            {item.label}
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <Divider subtle spacing={0} />

                {/* Active Days header + pills */}
                <View style={styles.segmentedCardSection}>
                  <View style={styles.settingRow}>
                    <View style={styles.settingRowLeft}>
                      <View style={[styles.iconBox, { backgroundColor: colors.accentSubtle, borderColor: colors.accent }]}>
                        <Calendar size={18} color={colors.accent} strokeWidth={2.3} />
                      </View>
                      <View style={styles.textColumn}>
                        <AppText variant="bodyBold" color="primary">Active Days</AppText>
                        <AppText variant="caption" color="secondary">Days to receive reminders</AppText>
                      </View>
                    </View>
                    <View style={styles.settingRowRight}>
                      <View style={[styles.valuePill, { backgroundColor: colors.accentSubtle, borderColor: colors.accent }]}>
                        <AppText variant="captionBold" color="accent">
                          {activeDaysCount === 7 ? 'Daily (7/7)' : `${activeDaysCount} Days`}
                        </AppText>
                      </View>
                    </View>
                  </View>

                  <View style={styles.weekdayRow}>
                    {WEEKDAYS.map((w) => {
                      const isActive = (settings.active_days || []).includes(w.day);
                      return (
                        <Pressable
                          key={w.day}
                          accessibilityRole="button"
                          accessibilityLabel={`Toggle ${w.name}`}
                          onPress={() => handleToggleWeekday(w.day)}
                          style={({ pressed }) => [
                            styles.dayChip,
                            {
                              backgroundColor: isActive ? colors.accent : colors.surfaceSubtle,
                              borderColor: isActive ? colors.accent : colors.border,
                              opacity: pressed ? 0.78 : 1,
                            },
                          ]}
                        >
                          <AppText
                            variant="captionBold"
                            color={isActive ? 'accentText' : 'secondary'}
                            style={{ fontSize: 13 }}
                          >
                            {w.letter}
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <Divider subtle spacing={0} />

                {/* Status footer */}
                <View style={[styles.statusRow, { backgroundColor: colors.surfaceSubtle }]}>
                  <View style={styles.statusLeft}>
                    <View style={[
                      styles.dot,
                      {
                        backgroundColor: nextReminderTime && notificationStatus?.granted
                          ? colors.success
                          : colors.textMuted,
                      },
                    ]} />
                    <AppText variant="caption" color="secondary">
                      {nextReminderTime
                        ? `Next alert: ${formatLocalTime(nextReminderTime)}`
                        : 'Schedule completed for today'}
                    </AppText>
                  </View>
                  <AppText variant="caption" color="muted">
                    {scheduledNotificationCount} queued
                  </AppText>
                </View>
              </>
            )}
          </Card>

          {/* Permissions card */}
          <Card variant="subtle" padding={16} style={[styles.permCard, { borderWidth: 1, borderColor: colors.border }]}>
            <View style={styles.permHeader}>
              <View style={[
                styles.permIcon,
                {
                  backgroundColor: notificationStatus?.granted ? colors.successBg : colors.warningBg,
                  borderColor: notificationStatus?.granted ? colors.success : colors.warning,
                },
              ]}>
                {notificationStatus?.granted
                  ? <CheckCircle2 size={18} color={colors.success} strokeWidth={2.4} />
                  : <AlertCircle size={18} color={colors.warning} strokeWidth={2.4} />}
              </View>
              <View style={styles.textColumn}>
                <AppText variant="bodyBold" color="primary">
                  {notificationStatus?.granted ? 'Notifications Allowed' : 'Permission Required'}
                </AppText>
                <AppText variant="caption" color="secondary">
                  {notificationStatus?.granted
                    ? Platform.OS === 'android' ? 'High-priority channel active' : 'iOS alerts authorized'
                    : 'Grant access to receive timely hydration alerts'}
                </AppText>
              </View>
              {!notificationStatus?.granted && (
                <Button label="Allow" size="sm" variant="primary" onPress={handleRequestPermissions} />
              )}
            </View>

            <Divider subtle spacing={10} />

            <View style={styles.testRow}>
              <View style={styles.textColumn}>
                <AppText variant="bodyBold" color="primary">Send Test Alert</AppText>
                <AppText variant="caption" color="secondary">Fires in 3 seconds to verify notification sound & icon</AppText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Send test reminder"
                onPress={handleSendTestNotification}
                disabled={isSendingTest}
                style={({ pressed }) => [
                  styles.testBtn,
                  {
                    backgroundColor: colors.accentSubtle,
                    borderColor: colors.accent,
                    opacity: pressed || isSendingTest ? 0.6 : 1,
                  },
                ]}
              >
                {isSendingTest
                  ? <ActivityIndicator size="small" color={colors.accent} />
                  : <>
                    <Send size={14} color={colors.accent} />
                    <AppText variant="captionBold" color="accent">Test Alert</AppText>
                  </>}
              </Pressable>
            </View>

            {testFeedback && (
              <View style={[styles.feedbackBanner, { backgroundColor: colors.successBg }]}>
                <Sparkles size={13} color={colors.success} />
                <AppText variant="caption" color="success">{testFeedback}</AppText>
              </View>
            )}

            <View style={styles.noteRow}>
              <Info size={13} color={colors.textMuted} />
              <AppText variant="caption" color="muted" style={{ flex: 1, fontSize: 11, lineHeight: 15 }}>
                {Platform.OS === 'android'
                  ? 'Android uses high-priority channels. Ensure battery optimization is disabled for HydroTrack.'
                  : 'iOS schedules rolling alerts within system limits with automatic tap deduplication.'}
              </AppText>
            </View>
          </Card>
        </Animated.View>

        {/* ── Data & Privacy ── */}
        <Animated.View entering={FadeInUp.delay(260).duration(440)} style={styles.section}>
          <AppText variant="caption" color="secondary" style={styles.sectionLabel}>
            DATA & PRIVACY
          </AppText>

          <Card variant="default" padding={0} style={styles.roundedCard}>
            {/* Privacy row */}
            <View style={styles.settingRow}>
              <View style={styles.settingRowLeft}>
                <View style={[styles.iconBox, { backgroundColor: colors.accentSubtle, borderColor: colors.accent }]}>
                  <ShieldCheck size={18} color={colors.accent} strokeWidth={2.3} />
                </View>
                <View style={styles.textColumn}>
                  <AppText variant="bodyBold" color="primary">100% Offline Storage</AppText>
                  <AppText variant="caption" color="secondary">
                    All data stays strictly on your local device
                  </AppText>
                </View>
              </View>
              <View style={styles.settingRowRight}>
                <View style={[styles.valuePill, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
                  <AppText variant="captionBold" color="muted">Local SQLite</AppText>
                </View>
              </View>
            </View>

            <Divider subtle spacing={0} />

            {/* Seed data */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Load sample 7-day water intake history"
              onPress={handleSeedData}
              disabled={isSeeding}
              style={({ pressed }) => [styles.pressableRow, { opacity: pressed || isSeeding ? 0.75 : 1 }]}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingRowLeft}>
                  <View style={[styles.iconBox, { backgroundColor: colors.accentSubtle, borderColor: colors.accent }]}>
                    <Database size={18} color={colors.accent} strokeWidth={2.3} />
                  </View>
                  <View style={styles.textColumn}>
                    <AppText variant="bodyBold" color="primary">Load Sample History</AppText>
                    <AppText variant="caption" color="secondary">
                      {isSeeding ? 'Generating records...' : 'Populate 7 days to test analytics charts'}
                    </AppText>
                  </View>
                </View>
                <View style={styles.settingRowRight}>
                  <ChevronRight size={16} color={colors.accent} />
                </View>
              </View>
            </Pressable>

            <Divider subtle spacing={0} />

            {/* Reset */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reset all local data"
              onPress={handleResetData}
              style={({ pressed }) => [styles.pressableRow, { opacity: pressed ? 0.75 : 1 }]}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingRowLeft}>
                  <View style={[styles.iconBox, { backgroundColor: colors.dangerBg, borderColor: colors.danger }]}>
                    <Trash2 size={18} color={colors.danger} strokeWidth={2.3} />
                  </View>
                  <View style={styles.textColumn}>
                    <AppText variant="bodyBold" color="danger">Reset All Data</AppText>
                    <AppText variant="caption" color="secondary">Erase logs and restore factory defaults</AppText>
                  </View>
                </View>
                <View style={styles.settingRowRight}>
                  <ChevronRight size={16} color={colors.danger} />
                </View>
              </View>
            </Pressable>
          </Card>
        </Animated.View>

        {/* ── About Section ── */}
        <Animated.View entering={FadeInUp.delay(300).duration(440)} style={styles.section}>
          <AppText variant="caption" color="secondary" style={styles.sectionLabel}>
            ABOUT
          </AppText>
          <Card variant="default" padding={0} style={styles.roundedCard}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="About HydroTrack details and architecture"
              onPress={() => setIsAboutModalVisible(true)}
              style={({ pressed }) => [styles.pressableRow, { opacity: pressed ? 0.75 : 1 }]}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingRowLeft}>
                  <View style={[styles.iconBox, { backgroundColor: colors.accentSubtle, borderColor: colors.accent }]}>
                    <Info size={18} color={colors.accent} strokeWidth={2.3} />
                  </View>
                  <View style={styles.textColumn}>
                    <AppText variant="bodyBold" color="primary">About HydroTrack</AppText>
                    <AppText variant="caption" color="secondary">v1.0.0 · Local SQLite · Clean Architecture</AppText>
                  </View>
                </View>
                <View style={styles.settingRowRight}>
                  <ChevronRight size={16} color={colors.accent} />
                </View>
              </View>
            </Pressable>
          </Card>
        </Animated.View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Sparkles size={13} color={colors.accent} />
          <AppText variant="caption" color="muted">HydroTrack · Offline SQLite Engine</AppText>
        </View>
      </View>

      {/* ── Daily Goal Modal ── */}
      <Modal
        visible={isGoalModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsGoalModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.borderGlow, borderRadius: radii.xl }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.iconBox, { backgroundColor: colors.accentSubtle, borderColor: colors.accent }]}>
                <Target size={20} color={colors.accent} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="h2" color="primary">Daily Water Target</AppText>
                <AppText variant="caption" color="secondary">Set your daily hydration goal</AppText>
              </View>
              <Pressable
                onPress={() => setIsGoalModalVisible(false)}
                hitSlop={12}
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              >
                <X size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Quick target presets */}
            <View style={{ gap: 6 }}>
              <AppText variant="caption" color="secondary" style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.8 }}>
                POPULAR TARGETS
              </AppText>
              <View style={styles.goalPresetsRow}>
                {GOAL_PRESETS.map((val) => {
                  const isSelected = goalInput.trim() === String(val);
                  return (
                    <Pressable
                      key={val}
                      onPress={() => handleSelectGoalPreset(val)}
                      style={[
                        styles.goalPresetChip,
                        {
                          backgroundColor: isSelected ? colors.accent : colors.surfaceSubtle,
                          borderColor: isSelected ? colors.accent : colors.border,
                        },
                      ]}
                    >
                      <AppText
                        variant="captionBold"
                        color={isSelected ? 'accentText' : 'secondary'}
                        style={{ fontSize: 12 }}
                      >
                        {val.toLocaleString()} ml
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Step adjustments + Input */}
            <View style={styles.goalInputRow}>
              <Pressable
                onPress={() => handleAdjustGoalBy(-250)}
                style={[styles.stepBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
              >
                <Minus size={16} color={colors.textPrimary} />
              </Pressable>

              <View style={[styles.inputWrap, { borderColor: goalError ? colors.danger : colors.border, backgroundColor: colors.surfaceSubtle, borderRadius: radii.md }]}>
                <TextInput
                  value={goalInput}
                  onChangeText={(txt) => {
                    setGoalInput(txt);
                    if (goalError) setGoalError(null);
                  }}
                  keyboardType="numeric"
                  maxLength={5}
                  style={[styles.modalInput, { color: colors.textPrimary }]}
                  selectTextOnFocus
                />
                <AppText variant="bodyBold" color="secondary">ml</AppText>
              </View>

              <Pressable
                onPress={() => handleAdjustGoalBy(250)}
                style={[styles.stepBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
              >
                <Plus size={16} color={colors.textPrimary} />
              </Pressable>
            </View>

            {goalError && (
              <View style={[styles.errorBanner, { backgroundColor: colors.dangerBg }]}>
                <AlertCircle size={14} color={colors.danger} />
                <AppText variant="caption" color="danger">{goalError}</AppText>
              </View>
            )}

            <View style={styles.modalBtnRow}>
              <Button
                label="Cancel"
                onPress={() => setIsGoalModalVisible(false)}
                variant="ghost"
                size="md"
                style={{ flex: 1 }}
              />
              <Button
                label={isSavingGoal ? 'Saving...' : 'Save Target'}
                onPress={handleSaveGoal}
                disabled={isSavingGoal}
                variant="primary"
                size="md"
                style={{ flex: 1.4 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Watch-Style Time Picker Modal ── */}
      <WatchTimePickerModal
        visible={isWatchPickerVisible}
        initialStartTime={settings.reminder_start_time}
        initialEndTime={settings.reminder_end_time}
        onClose={() => setIsWatchPickerVisible(false)}
        onSave={handleSaveTimeWindow}
      />

      {/* ── About Modal ── */}
      <Modal
        visible={isAboutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAboutModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.borderGlow, borderRadius: radii.xl }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.iconBox, { backgroundColor: colors.accentSubtle, borderColor: colors.accent }]}>
                <Sparkles size={20} color={colors.accent} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="h2" color="primary">HydroTrack</AppText>
                <AppText variant="caption" color="secondary">Version 1.0.0 · Local SQLite</AppText>
              </View>
              <Pressable
                onPress={() => setIsAboutModalVisible(false)}
                hitSlop={12}
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              >
                <X size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={{ gap: 14, marginVertical: 8 }}>
              <View style={{ gap: 3 }}>
                <AppText variant="bodyBold" color="primary">Technology Stack</AppText>
                <AppText variant="caption" color="secondary" style={{ lineHeight: 18 }}>
                  React Native 0.86, React 19, and Expo SDK 57. High-performance file routing with Expo Router and Lucide iconography.
                </AppText>
              </View>

              <View style={{ gap: 3 }}>
                <AppText variant="bodyBold" color="primary">100% Offline SQLite Architecture</AppText>
                <AppText variant="caption" color="secondary" style={{ lineHeight: 18 }}>
                  Zero tracking, telemetry, or external network dependencies. All hydration records and preferences are committed locally using parameterized SQLite WAL transactions.
                </AppText>
              </View>

              <View style={{ gap: 3 }}>
                <AppText variant="bodyBold" color="primary">Adaptive Notification Engine</AppText>
                <AppText variant="caption" color="secondary" style={{ lineHeight: 18 }}>
                  High-priority local channels, exact-alarm awareness on Android 12+, and rolling scheduling bounded by iOS system limits with tap deduplication.
                </AppText>
              </View>
            </View>

            <View style={styles.modalBtnRow}>
              <Button
                label="Done"
                onPress={() => setIsAboutModalVisible(false)}
                variant="primary"
                size="md"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    gap: 24,
  },
  header: {
    marginTop: 14,
    gap: 4,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    paddingLeft: 2,
    letterSpacing: 1.1,
    fontSize: 11,
    fontWeight: '700',
  },
  roundedCard: {
    overflow: 'hidden',
  },
  // Wrapper for Pressable to avoid flex layout bugs on Android
  pressableRow: {
    width: '100%',
  },
  // Main settings row: strictly row, left icon + texts, right controls pinned to right edge
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 64,
    width: '100%',
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    marginRight: 12,
  },
  settingRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  // 42x42 icon box
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  // Radio indicator
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Value pill badge
  valuePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  // iOS switch toggle
  switchTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  // Segmented card sections (Interval & Active Days)
  segmentedCardSection: {
    paddingVertical: 4,
    gap: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 6,
  },
  dayChip: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Status footer
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Permissions card
  permCard: {
    gap: 12,
  },
  permHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  permIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  testRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 2,
  },
  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 4,
    paddingBottom: 8,
  },
  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    padding: 22,
    borderWidth: 1.5,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 24,
    elevation: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalPresetChip: {
    flex: 1,
    minWidth: 80,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderWidth: 1.5,
    height: 48,
  },
  modalInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 8,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
});
