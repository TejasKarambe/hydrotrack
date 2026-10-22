import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
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
  Info,
  Check,
  Sparkles,
} from 'lucide-react-native';
import { Screen, AppText, Card, Divider } from '../../src/components/ui';
import { useAppTheme } from '../../src/theme/ThemeProvider';
import { ThemePreference } from '../../src/theme/tokens';

export default function SettingsScreen() {
  const { themePreference, setThemePreference, colors, isDark, radii } = useAppTheme();

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

  return (
    <Screen scrollable safeAreaEdges={['top']}>
      {/* Background Subtle Radiant Aura */}
      <LinearGradient
        colors={colors.backgroundGradient}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.container}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <AppText variant="h1" color="primary">
            Settings
          </AppText>
          <AppText variant="subtext" color="secondary">
            Appearance, hydration targets, and preferences
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
                            borderColor: isSelected
                              ? colors.borderGlow
                              : 'transparent',
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
            <View style={styles.settingRow}>
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
                    Configured volume target
                  </AppText>
                </View>
              </View>
              <AppText variant="bodyBold" color="accent">
                2,500 ml
              </AppText>
            </View>

            <Divider subtle spacing={0} />

            <View style={styles.settingRow}>
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
                    Display Unit
                  </AppText>
                  <AppText variant="caption" color="secondary">
                    Volume measurement
                  </AppText>
                </View>
              </View>
              <AppText variant="bodyBold" color="accent">
                Millilitres (ml)
              </AppText>
            </View>
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
                    09:00 AM – 09:00 PM (Hourly interval)
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

        {/* Privacy Card */}
        <Animated.View entering={FadeInUp.delay(250).duration(450)} style={styles.section}>
          <AppText variant="caption" color="secondary" style={styles.sectionLabel}>
            PRIVACY & SECURITY
          </AppText>

          <LinearGradient
            colors={
              isDark
                ? ['rgba(17, 24, 39, 0.95)', 'rgba(30, 41, 59, 0.85)']
                : ['#FFFFFF', '#F0F9FF']
            }
            style={[
              styles.privacyCard,
              { borderRadius: radii.lg, borderColor: colors.borderGlow },
            ]}
          >
            <View style={styles.privacyHeader}>
              <ShieldCheck size={22} color={colors.accent} strokeWidth={2.5} />
              <AppText variant="bodyBold" color="primary">
                100% Offline & Private
              </AppText>
            </View>
            <AppText variant="subtext" color="secondary">
              All hydration records are stored locally on your device. HydroTrack does not upload your personal data to any external server.
            </AppText>
          </LinearGradient>
        </Animated.View>

        {/* Footer */}
        <View style={styles.aboutRow}>
          <Sparkles size={14} color={colors.accent} />
          <AppText variant="caption" color="muted">
            HydroTrack • Living Fluid Architecture
          </AppText>
        </View>
      </View>
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
  privacyCard: {
    padding: 18,
    borderWidth: 1.5,
    gap: 8,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 8,
  },
});
