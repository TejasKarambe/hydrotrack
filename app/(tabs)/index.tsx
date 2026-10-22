import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
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
} from 'lucide-react-native';
import { Screen, AppText, Card, Divider } from '../../src/components/ui';
import { useAppTheme } from '../../src/theme/ThemeProvider';
import { AnimatedWaterVessel } from '../../src/components/common/AnimatedWaterVessel';
import { QuickAddCard } from '../../src/components/common/QuickAddCard';

const DAILY_GOAL = 2500;
const INITIAL_CONSUMED = 1250;

interface IntakeEntry {
  id: string;
  amount: number;
  time: string;
  label: string;
}

const INITIAL_TIMELINE: IntakeEntry[] = [
  { id: '1', amount: 250, time: '09:15 AM', label: 'Morning Kickstart' },
  { id: '2', amount: 500, time: '11:30 AM', label: 'Workout Hydration' },
  { id: '3', amount: 500, time: '02:00 PM', label: 'Desk Refill' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark, radii } = useAppTheme();

  const [consumedAmount, setConsumedAmount] = useState(INITIAL_CONSUMED);
  const [timeline, setTimeline] = useState<IntakeEntry[]>(INITIAL_TIMELINE);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const remaining = Math.max(0, DAILY_GOAL - consumedAmount);
  const percentage = Math.min(100, Math.round((consumedAmount / DAILY_GOAL) * 100));

  const handleQuickAdd = (amount: number, label: string) => {
    setConsumedAmount((prev) => prev + amount);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTimeline((prev) => [
      {
        id: Date.now().toString(),
        amount,
        time: timeStr,
        label,
      },
      ...prev,
    ]);

    // Show temporary lively toast feedback
    setToastMessage(`+${amount} ml added!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getHydrationTip = (): string => {
    if (percentage >= 100) return "Goal achieved! Excellent hydration today! 🎉";
    if (percentage >= 60) return "You're in great flow. Just a couple more glasses to complete!";
    return "Drink one glass now to keep your focus and energy sharp.";
  };

  return (
    <Screen scrollable safeAreaEdges={['top']}>
      {/* Background Subtle Radiant Aura */}
      <LinearGradient
        colors={colors.backgroundGradient}
        style={StyleSheet.absoluteFill}
      />

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
              Thursday, Oct 22 • Stay refreshed
            </AppText>
          </View>

          {/* Interactive Streak Pill */}
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
              5 Day Streak
            </AppText>
          </View>
        </Animated.View>

        {/* Temporary Lively Feedback Toast */}
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

        {/* Realistic Living Water Vessel Centerpiece */}
        <Animated.View entering={FadeInUp.duration(500)}>
          <AnimatedWaterVessel currentMl={consumedAmount} goalMl={DAILY_GOAL} size={230} />
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
                    {percentage >= 100 ? 'Target Reached!' : `${remaining.toLocaleString()} ml remaining`}
                  </AppText>
                  <AppText variant="caption" color="accent" style={styles.insightPercent}>
                    {percentage}%
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
              accessibilityLabel="Open custom water log modal"
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
              sublabel="Espresso / Tea"
              iconType="cup"
              onPress={() => handleQuickAdd(150, 'Small Cup')}
            />
            <QuickAddCard
              amount={250}
              label="Glass"
              sublabel="Fresh Water"
              iconType="glass"
              onPress={() => handleQuickAdd(250, 'Glass of Water')}
            />
            <QuickAddCard
              amount={500}
              label="Flask / Bottle"
              sublabel="Hydration Refill"
              iconType="bottle"
              onPress={() => handleQuickAdd(500, 'Sports Bottle')}
            />
          </View>
        </Animated.View>

        {/* Reminder Pill Card */}
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
                    Next Reminder
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
                  Scheduled for 06:00 PM (Hourly interval)
                </AppText>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Recent Intake Timeline */}
        <Animated.View entering={FadeInUp.delay(250).duration(450)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText variant="h3" color="primary">
              Today's Logs
            </AppText>
            <Pressable onPress={() => router.push('/(tabs)/history')}>
              <AppText variant="caption" color="accent">
                View all ({timeline.length})
              </AppText>
            </Pressable>
          </View>

          <Card variant="default" padding={0} style={styles.timelineCard}>
            {timeline.map((entry, index) => (
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
                        {entry.amount} ml
                      </AppText>
                      <AppText variant="caption" color="secondary">
                        {entry.label}
                      </AppText>
                    </View>
                  </View>
                  <View style={styles.timelineRight}>
                    <Clock size={12} color={colors.textMuted} />
                    <AppText variant="caption" color="muted">
                      {entry.time}
                    </AppText>
                  </View>
                </View>
                {index < timeline.length - 1 && <Divider subtle spacing={0} />}
              </React.Fragment>
            ))}
          </Card>
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  timelineIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
