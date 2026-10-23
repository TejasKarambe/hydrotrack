import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Alert, Modal, TextInput, Keyboard } from 'react-native';
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
  Edit3,
} from 'lucide-react-native';
import { Screen, AppText, Card, Divider, Button } from '../../src/components/ui';
import { useAppTheme } from '../../src/theme/ThemeProvider';
import { useHydration } from '../../src/context/HydrationContext';
import { ThemePreference } from '../../src/theme/tokens';
import { validateDailyGoal } from '../../src/types/database';

export default function SettingsScreen() {
  const { themePreference, setThemePreference, colors, isDark, radii } = useAppTheme();
  const { settings, updateUserSettings, resetAllData } = useHydration();

  const [isGoalModalVisible, setIsGoalModalVisible] = useState(false);
  const [goalInput, setGoalInput] = useState(String(settings.daily_goal_ml));
  const [goalError, setGoalError] = useState<string | null>(null);

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

  const handleOpenGoalModal = () => {
    setGoalInput(String(settings.daily_goal_ml));
    setGoalError(null);
    setIsGoalModalVisible(true);
  };

  const handleSaveGoal = async () => {
    const validation = validateDailyGoal(goalInput);
    if (!validation.isValid || !validation.value) {
      setGoalError(validation.error || 'Please enter a valid goal (500 - 10,000 ml).');
      return;
    }

    try {
      await updateUserSettings({ daily_goal_ml: validation.value });
      setIsGoalModalVisible(false);
      Keyboard.dismiss();
    } catch {
      Alert.alert('Error', 'Failed to update daily goal.');
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

  return (
    <Screen scrollable safeAreaEdges={['top']}>
      {/* Background Subtle Radiant Aura */}
      <LinearGradient colors={colors.backgroundGradient} style={StyleSheet.absoluteFill} />

      <View style={styles.container}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <AppText variant="h1" color="primary">
            Settings
          </AppText>
          <AppText variant="subtext" color="secondary">
            Preferences, daily target, and local database management
          </AppText>
        </Animated.View>

        {/* Appearance / Theme Selector */}
        <Animated.View entering={FadeInUp.delay(100).duration(450)} style={styles.section}>
          <AppText variant="caption" color="secondary" style={styles.sectionLabel}>
            APPEARANCE & THEME
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
                      styles.settingRow,
                      { opacity: pressed ? 0.75 : 1 },
                    ]}
                  >
                    <View style={styles.settingRowLeft}>
                      <View
                        style={[
                          styles.settingIconWrap,
                          {
                            backgroundColor: isSelected
                              ? colors.accentSubtle
                              : colors.surfaceSubtle,
                            borderColor: isSelected ? colors.borderGlow : 'transparent',
                          },
                        ]}
                      >
                        {opt.icon}
                      </View>
                      <View>
                        <AppText variant="bodyBold" color="primary">
                          {opt.label}
                        </AppText>
                        <AppText variant="caption" color="secondary">
                          {opt.value === 'system'
                            ? `Matches device appearance (Currently: ${isDark ? 'Dark' : 'Light'})`
                            : `Always apply ${opt.label.toLowerCase()}`}
                        </AppText>
                      </View>
                    </View>

                    {isSelected && (
                      <View
                        style={[
                          styles.checkBadge,
                          { backgroundColor: colors.accentSubtle },
                        ]}
                      >
                        <Check size={16} color={colors.accent} strokeWidth={2.8} />
                      </View>
                    )}
                  </Pressable>
                  {index < themeOptions.length - 1 && <Divider subtle spacing={0} />}
                </React.Fragment>
              );
            })}
          </Card>
        </Animated.View>

        {/* Hydration Targets */}
        <Animated.View entering={FadeInUp.delay(150).duration(450)} style={styles.section}>
          <AppText variant="caption" color="secondary" style={styles.sectionLabel}>
            HYDRATION TARGETS
          </AppText>

          <Card variant="default" padding={0} style={styles.roundedCard}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit daily water goal"
              onPress={handleOpenGoalModal}
              style={({ pressed }) => [styles.settingRow, { opacity: pressed ? 0.75 : 1 }]}
            >
              <View style={styles.settingRowLeft}>
                <View
                  style={[
                    styles.settingIconWrap,
                    { backgroundColor: colors.accentSubtle },
                  ]}
                >
                  <Target size={18} color={colors.accent} strokeWidth={2.4} />
                </View>
                <View>
                  <AppText variant="bodyBold" color="primary">
                    Daily Water Goal
                  </AppText>
                  <AppText variant="caption" color="secondary">
                    Tap to customize volume target
                  </AppText>
                </View>
              </View>
              <View style={styles.settingRowRight}>
                <AppText variant="bodyBold" color="accent">
                  {settings.daily_goal_ml.toLocaleString()} ml
                </AppText>
                <ChevronRight size={16} color={colors.textMuted} />
              </View>
            </Pressable>

            <Divider subtle spacing={0} />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Toggle preferred unit"
              onPress={handleToggleUnit}
              style={({ pressed }) => [styles.settingRow, { opacity: pressed ? 0.75 : 1 }]}
            >
              <View style={styles.settingRowLeft}>
                <View
                  style={[
                    styles.settingIconWrap,
                    { backgroundColor: colors.accentSubtle },
                  ]}
                >
                  <Scale size={18} color={colors.accent} strokeWidth={2.4} />
                </View>
                <View>
                  <AppText variant="bodyBold" color="primary">
                    Volume Unit
                  </AppText>
                  <AppText variant="caption" color="secondary">
                    Tap to toggle (ml / litres)
                  </AppText>
                </View>
              </View>
              <View style={styles.settingRowRight}>
                <AppText variant="bodyBold" color="accent">
                  {settings.preferred_display_unit === 'ml' ? 'Millilitres (ml)' : 'Litres (L)'}
                </AppText>
                <ChevronRight size={16} color={colors.textMuted} />
              </View>
            </Pressable>
          </Card>
        </Animated.View>

        {/* Reminders Window */}
        <Animated.View entering={FadeInUp.delay(200).duration(450)} style={styles.section}>
          <AppText variant="caption" color="secondary" style={styles.sectionLabel}>
            REMINDER SCHEDULE
          </AppText>

          <Card variant="default" padding={0} style={styles.roundedCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingRowLeft}>
                <View
                  style={[
                    styles.settingIconWrap,
                    { backgroundColor: colors.accentSubtle },
                  ]}
                >
                  <Bell size={18} color={colors.accent} strokeWidth={2.4} />
                </View>
                <View>
                  <AppText variant="bodyBold" color="primary">
                    Active Window
                  </AppText>
                  <AppText variant="caption" color="secondary">
                    {settings.reminder_start_time} – {settings.reminder_end_time} ({settings.reminder_interval_minutes}m interval)
                  </AppText>
                </View>
              </View>
              <View
                style={[
                  styles.activeTag,
                  { backgroundColor: colors.successBg },
                ]}
              >
                <AppText variant="caption" color="success">
                  Enabled
                </AppText>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Data & Privacy */}
        <Animated.View entering={FadeInUp.delay(250).duration(450)} style={styles.section}>
          <AppText variant="caption" color="secondary" style={styles.sectionLabel}>
            DATA MANAGEMENT & PRIVACY
          </AppText>

          <Card variant="default" padding={0} style={styles.roundedCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingRowLeft}>
                <View
                  style={[
                    styles.settingIconWrap,
                    { backgroundColor: colors.accentSubtle },
                  ]}
                >
                  <ShieldCheck size={18} color={colors.accent} strokeWidth={2.4} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyBold" color="primary">
                    100% Offline SQLite
                  </AppText>
                  <AppText variant="caption" color="secondary">
                    All logs remain on this device. No external servers or cloud accounts.
                  </AppText>
                </View>
              </View>
            </View>

            <Divider subtle spacing={0} />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reset all local data"
              onPress={handleResetData}
              style={({ pressed }) => [styles.settingRow, { opacity: pressed ? 0.75 : 1 }]}
            >
              <View style={styles.settingRowLeft}>
                <View
                  style={[
                    styles.settingIconWrap,
                    { backgroundColor: colors.dangerBg },
                  ]}
                >
                  <Trash2 size={18} color={colors.danger} strokeWidth={2.4} />
                </View>
                <View>
                  <AppText variant="bodyBold" color="danger">
                    Reset Local Data
                  </AppText>
                  <AppText variant="caption" color="secondary">
                    Clear all water records and reset settings
                  </AppText>
                </View>
              </View>
              <ChevronRight size={16} color={colors.danger} />
            </Pressable>
          </Card>
        </Animated.View>

        {/* Footer */}
        <View style={styles.aboutRow}>
          <Sparkles size={14} color={colors.accent} />
          <AppText variant="caption" color="muted">
            HydroTrack • SQLite Persistent Engine v2.0
          </AppText>
        </View>
      </View>

      {/* Edit Goal Modal */}
      <Modal
        visible={isGoalModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsGoalModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderGlow,
                borderRadius: radii.xl,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Target size={22} color={colors.accent} strokeWidth={2.5} />
              <AppText variant="h2" color="primary">
                Daily Water Target
              </AppText>
            </View>

            <AppText variant="subtext" color="secondary">
              Enter your target water intake in millilitres (500 – 10,000 ml).
            </AppText>

            <View
              style={[
                styles.modalInputWrap,
                {
                  borderColor: goalError ? colors.danger : colors.border,
                  backgroundColor: colors.surfaceSubtle,
                  borderRadius: radii.md,
                },
              ]}
            >
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
                autoFocus
              />
              <AppText variant="bodyBold" color="secondary">
                ml
              </AppText>
            </View>

            {goalError && (
              <AppText variant="caption" color="danger">
                {goalError}
              </AppText>
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
                label="Save Target"
                onPress={handleSaveGoal}
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
    paddingBottom: 40,
    gap: 20,
  },
  header: {
    marginTop: 8,
    gap: 4,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    paddingLeft: 4,
    letterSpacing: 0.6,
    fontWeight: '700',
  },
  roundedCard: {
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    padding: 24,
    borderWidth: 1.5,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderWidth: 1.5,
    height: 52,
  },
  modalInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
});
