import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import {
  Droplet,
  Plus,
  Clock,
  Bell,
  Flame,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Zap,
  Trash2,
  Edit2,
  GlassWater,
} from 'lucide-react-native';
import { Screen, AppText, Card, Divider, EmptyState } from '../../src/components/ui';
import { useAppTheme } from '../../src/theme/ThemeProvider';
import { useHydration } from '../../src/context/HydrationContext';
import { AnimatedWaterVessel } from '../../src/components/common/AnimatedWaterVessel';
import { QuickAddCard } from '../../src/components/common/QuickAddCard';
import { formatLocalTime } from '../../src/utils/dateUtils';
import { WaterLog } from '../../src/types/database';

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark, radii } = useAppTheme();
  const {
    todayLogs,
    todayTotalMl,
    dailyGoalMl,
    remainingMl,
    progressPercent,
    streak,
    isLoading,
    isInitialized,
    quickAdd,
    deleteLog,
  } = useHydration();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  const handleQuickAdd = async (amount: number, label: string) => {
    if (isQuickAdding) return;
    try {
      setIsQuickAdding(true);
      await quickAdd(amount);
      setToastMessage(`+${amount} ml added! (${label})`);
      setTimeout(() => {
        setToastMessage(null);
      }, 2500);
    } catch (err) {
      Alert.alert('Error', 'Failed to save water intake. Please try again.');
    } finally {
      setIsQuickAdding(false);
    }
  };

  const handleDeleteLog = (log: WaterLog) => {
    Alert.alert(
      'Delete Entry',
      `Are you sure you want to delete this ${log.amount_ml} ml intake log?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLog(log.id);
              setToastMessage('Entry deleted');
              setTimeout(() => setToastMessage(null), 2000);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete record.');
            }
          },
        },
      ]
    );
  };

  const handleEditLog = (log: WaterLog) => {
    router.push({
      pathname: '/log-water',
      params: {
        editId: log.id,
        initialAmount: log.amount_ml.toString(),
        initialTime: log.consumed_at,
      },
    });
  };

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getHydrationTip = (): string => {
    if (progressPercent >= 100) return 'Daily goal reached! Outstanding hydration today! 🎉';
    if (progressPercent >= 60) return "You're in great flow. Just a couple more glasses to complete!";
    if (todayTotalMl === 0) return 'Kickstart your day: Drink your first glass to wake up your body.';
    return 'Consistent sips keep your focus sharp and energy balanced.';
  };

  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  if (isLoading && !isInitialized) {
    return (
      <Screen safeAreaEdges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <AppText variant="subtext" color="secondary" style={styles.loadingText}>
            Loading hydration records...
          </AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable safeAreaEdges={['top']}>
      {/* Background Subtle Radiant Aura */}
      <LinearGradient colors={colors.backgroundGradient} style={StyleSheet.absoluteFill} />

      <View style={styles.container}>
        {/* Top Header with Greeting & Streak Badge */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.headerRow}>
          <View>
            <View style={styles.greetingRow}>
              <AppText variant="h1" color="primary">
                {getGreeting()}
              </AppText>
            </View>
            <AppText variant="subtext" color="secondary">
              {todayFormatted} • Stay refreshed
            </AppText>
          </View>

          {/* Dynamic Streak Pill */}
          <View
            style={[
              styles.streakBadge,
              {
                backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
                borderColor: 'rgba(245, 158, 11, 0.3)',
              },
            ]}
          >
            <Flame size={16} color="#F59E0B" fill="#F59E0B" />
            <AppText variant="caption" style={styles.streakText}>
              {streak > 0 ? `${streak} Day Streak` : 'Streak: Day 1'}
            </AppText>
          </View>
        </Animated.View>

        {/* Temporary Feedback Toast */}
        {toastMessage && (
          <Animated.View
            entering={FadeInDown.duration(250)}
            style={[
              styles.floatingToast,
              {
                backgroundColor: colors.accent,
                shadowColor: colors.accent,
              },
            ]}
          >
            <Sparkles size={16} color={colors.accentText} />
            <AppText variant="bodyBold" color="accentText">
              {toastMessage}
            </AppText>
          </Animated.View>
        )}

        {/* Living Water Vessel Centerpiece (Driven by real SQLite data) */}
        <Animated.View entering={FadeInUp.duration(500)}>
          <AnimatedWaterVessel currentMl={todayTotalMl} goalMl={dailyGoalMl} size={230} />
        </Animated.View>

        {/* Hydration Insight Card */}
        <Animated.View entering={FadeInUp.delay(100).duration(450)}>
          <LinearGradient
            colors={
              isDark
                ? ['rgba(17, 24, 39, 0.95)', 'rgba(30, 41, 59, 0.85)']
                : ['#FFFFFF', '#F0F9FF']
            }
            style={[
              styles.insightCard,
              {
                borderRadius: radii.lg,
                borderColor: colors.borderGlow,
              },
            ]}
          >
            <View style={styles.insightContent}>
              <View
                style={[
                  styles.insightIconBadge,
                  { backgroundColor: colors.accentSubtle },
                ]}
              >
                <Zap size={18} color={colors.accent} strokeWidth={2.5} />
              </View>
              <View style={styles.insightTextCol}>
                <View style={styles.insightTopRow}>
                  <AppText variant="bodyBold" color="primary">
                    {progressPercent >= 100
                      ? 'Target Achieved!'
                      : `${remainingMl.toLocaleString()} ml remaining`}
                  </AppText>
                  <AppText variant="caption" color="accent" style={styles.insightPercent}>
                    {progressPercent}%
                  </AppText>
                </View>
                <AppText variant="subtext" color="secondary">
                  {getHydrationTip()}
                </AppText>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Tactile Quick Add Vessels */}
        <Animated.View entering={FadeInUp.delay(150).duration(450)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Droplet size={18} color={colors.accent} strokeWidth={2.5} />
              <AppText variant="h3" color="primary">
                Quick Drink
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open custom water log screen"
              onPress={() => router.push('/log-water')}
              style={({ pressed }) => [
                styles.customAddLink,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <AppText variant="caption" color="accent">
                Custom +
              </AppText>
            </Pressable>
          </View>

          <View style={styles.quickAddRow}>
            <QuickAddCard
              amount={150}
              label="Small Cup"
              sublabel="Tea / Espresso"
              iconType="cup"
              onPress={() => handleQuickAdd(150, 'Small Cup')}
            />
            <QuickAddCard
              amount={250}
              label="Glass"
              sublabel="Fresh Water"
              iconType="glass"
              onPress={() => handleQuickAdd(250, 'Glass')}
            />
            <QuickAddCard
              amount={500}
              label="Flask / Bottle"
              sublabel="Hydration Refill"
              iconType="bottle"
              onPress={() => handleQuickAdd(500, 'Bottle')}
            />
          </View>
        </Animated.View>

        {/* Reminder Summary Card */}
        <Animated.View entering={FadeInUp.delay(200).duration(450)}>
          <Card variant="subtle" style={styles.reminderCard}>
            <View style={styles.reminderContent}>
              <View
                style={[
                  styles.reminderIconWrapper,
                  { backgroundColor: colors.accentSubtle },
                ]}
              >
                <Bell size={18} color={colors.accent} />
              </View>
              <View style={styles.reminderTextCol}>
                <View style={styles.reminderTitleRow}>
                  <AppText variant="bodyBold" color="primary">
                    Smart Reminder
                  </AppText>
                  <View
                    style={[
                      styles.activeBadge,
                      { backgroundColor: colors.successBg },
                    ]}
                  >
                    <AppText variant="caption" color="success">
                      Active
                    </AppText>
                  </View>
                </View>
                <AppText variant="subtext" color="secondary">
                  Active 09:00 AM – 09:00 PM (Hourly interval)
                </AppText>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Live Today's Intake Timeline */}
        <Animated.View entering={FadeInUp.delay(250).duration(450)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText variant="h3" color="primary">
              Today's Logs ({todayLogs.length})
            </AppText>
            {todayLogs.length > 0 && (
              <Pressable onPress={() => router.push('/(tabs)/history')}>
                <AppText variant="caption" color="accent">
                  Full History
                </AppText>
              </Pressable>
            )}
          </View>

          {todayLogs.length > 0 ? (
            <Card variant="default" padding={0} style={styles.timelineCard}>
              {todayLogs.map((entry, index) => (
                <React.Fragment key={entry.id}>
                  <View style={styles.timelineRow}>
                    <View style={styles.timelineLeft}>
                      <View
                        style={[
                          styles.timelineIconBadge,
                          { backgroundColor: colors.accentSubtle },
                        ]}
                      >
                        <Droplet size={16} color={colors.accent} strokeWidth={2.5} />
                      </View>
                      <View>
                        <AppText variant="bodyBold" color="primary">
                          {entry.amount_ml} ml
                        </AppText>
                        <View style={styles.timeTagRow}>
                          <Clock size={11} color={colors.textMuted} />
                          <AppText variant="caption" color="muted">
                            {formatLocalTime(entry.consumed_at)}
                          </AppText>
                        </View>
                      </View>
                    </View>

                    {/* Action buttons (Edit & Delete) */}
                    <View style={styles.timelineActions}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Edit water intake entry"
                        onPress={() => handleEditLog(entry)}
                        style={({ pressed }) => [
                          styles.actionIconBtn,
                          { opacity: pressed ? 0.6 : 1 },
                        ]}
                      >
                        <Edit2 size={16} color={colors.textSecondary} />
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Delete water intake entry"
                        onPress={() => handleDeleteLog(entry)}
                        style={({ pressed }) => [
                          styles.actionIconBtn,
                          { opacity: pressed ? 0.6 : 1 },
                        ]}
                      >
                        <Trash2 size={16} color={colors.danger} />
                      </Pressable>
                    </View>
                  </View>
                  {index < todayLogs.length - 1 && <Divider subtle spacing={0} />}
                </React.Fragment>
              ))}
            </Card>
          ) : (
            <Card variant="subtle" style={styles.emptyCard}>
              <EmptyState
                icon={<GlassWater size={28} color={colors.accent} />}
                title="No Water Logged Today"
                message="Tap a quick-add vessel above or log a custom amount to start tracking."
                actionLabel="Log Water"
                onAction={() => router.push('/log-water')}
              />
            </Card>
          )}
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    marginTop: 8,
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  streakText: {
    color: '#D97706',
    fontWeight: '800',
    fontSize: 12,
  },
  floatingToast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 99,
  },
  insightCard: {
    padding: 16,
    borderWidth: 1.5,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  insightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  insightIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTextCol: {
    flex: 1,
    gap: 2,
  },
  insightTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightPercent: {
    fontWeight: '800',
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customAddLink: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 10,
  },
  reminderCard: {
    padding: 14,
  },
  reminderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reminderIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderTextCol: {
    flex: 1,
    gap: 2,
  },
  reminderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timelineCard: {
    overflow: 'hidden',
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  timelineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  timelineIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIconBtn: {
    padding: 6,
  },
  emptyCard: {
    paddingVertical: 8,
  },
});
