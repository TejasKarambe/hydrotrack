import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Trophy, TrendingUp, Droplets, Sparkles, Award, Calendar } from 'lucide-react-native';
import { Screen, AppText, Card } from '../../src/components/ui';
import { useAppTheme } from '../../src/theme/ThemeProvider';

interface WeeklyDayData {
  day: string;
  date: string;
  amount: number;
  goal: number;
  isToday: boolean;
}

const SAMPLE_WEEKLY_DATA: WeeklyDayData[] = [
  { day: 'Fri', date: 'Oct 16', amount: 2500, goal: 2500, isToday: false },
  { day: 'Sat', date: 'Oct 17', amount: 2800, goal: 2500, isToday: false },
  { day: 'Sun', date: 'Oct 18', amount: 1800, goal: 2500, isToday: false },
  { day: 'Mon', date: 'Oct 19', amount: 0, goal: 2500, isToday: false },
  { day: 'Tue', date: 'Oct 20', amount: 2000, goal: 2500, isToday: false },
  { day: 'Wed', date: 'Oct 21', amount: 2600, goal: 2500, isToday: false },
  { day: 'Thu', date: 'Oct 22', amount: 1250, goal: 2500, isToday: true },
];

export default function AnalyticsScreen() {
  const { colors, isDark, radii } = useAppTheme();

  const maxAmount = Math.max(...SAMPLE_WEEKLY_DATA.map((d) => d.amount), 3000);
  const totalPeriod = SAMPLE_WEEKLY_DATA.reduce((acc, curr) => acc + curr.amount, 0);
  const averageDaily = Math.round(totalPeriod / SAMPLE_WEEKLY_DATA.length);
  const achievedDays = SAMPLE_WEEKLY_DATA.filter((d) => d.amount >= d.goal).length;

  return (
    <Screen scrollable safeAreaEdges={['top']}>
      {/* Background Subtle Gradient */}
      <LinearGradient
        colors={colors.backgroundGradient}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.container}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <AppText variant="h1" color="primary">
            Hydration Insights
          </AppText>
          <AppText variant="subtext" color="secondary">
            7-day trends, weekly consistency, and daily average
          </AppText>
        </Animated.View>

        {/* Highlight Metrics Grid */}
        <Animated.View entering={FadeInUp.delay(100).duration(450)} style={styles.metricsGrid}>
          <LinearGradient
            colors={
              isDark
                ? ['rgba(17, 24, 39, 0.95)', 'rgba(30, 41, 59, 0.85)']
                : ['#FFFFFF', '#F0F9FF']
            }
            style={[
              styles.metricCard,
              { borderRadius: radii.lg, borderColor: colors.borderGlow },
            ]}
          >
            <View
              style={[
                styles.metricIconWrap,
                { backgroundColor: colors.accentSubtle },
              ]}
            >
              <TrendingUp size={20} color={colors.accent} strokeWidth={2.5} />
            </View>
            <AppText variant="caption" color="secondary">
              Daily Average
            </AppText>
            <AppText variant="numericMedium" color="primary">
              {averageDaily.toLocaleString()} ml
            </AppText>
          </LinearGradient>

          <LinearGradient
            colors={
              isDark
                ? ['rgba(17, 24, 39, 0.95)', 'rgba(30, 41, 59, 0.85)']
                : ['#FFFFFF', '#F0FDF4']
            }
            style={[
              styles.metricCard,
              { borderRadius: radii.lg, borderColor: 'rgba(5, 150, 105, 0.25)' },
            ]}
          >
            <View
              style={[
                styles.metricIconWrap,
                { backgroundColor: colors.successBg },
              ]}
            >
              <Award size={20} color={colors.success} strokeWidth={2.5} />
            </View>
            <AppText variant="caption" color="secondary">
              Target Achieved
            </AppText>
            <AppText variant="numericMedium" color="primary">
              {achievedDays} of 7 days
            </AppText>
          </LinearGradient>
        </Animated.View>

        {/* 7-Day Liquid Bar Chart */}
        <Animated.View entering={FadeInUp.delay(150).duration(450)}>
          <Card variant="default" style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View>
                <AppText variant="h3" color="primary">
                  Weekly Rhythm
                </AppText>
                <AppText variant="caption" color="secondary">
                  Target: 2,500 ml/day
                </AppText>
              </View>
              <View
                style={[
                  styles.totalBadge,
                  { backgroundColor: colors.accentSubtle, borderColor: colors.borderGlow },
                ]}
              >
                <Droplets size={14} color={colors.accent} />
                <AppText variant="caption" color="accent" style={styles.totalBadgeText}>
                  {totalPeriod.toLocaleString()} ml
                </AppText>
              </View>
            </View>

            {/* Visual Bars Container */}
            <View style={styles.chartContainer}>
              <View style={styles.barsRow}>
                {SAMPLE_WEEKLY_DATA.map((item) => {
                  const heightPercent = Math.max(8, Math.round((item.amount / maxAmount) * 100));
                  const achieved = item.amount >= item.goal;
                  const isZero = item.amount === 0;

                  return (
                    <View key={item.day} style={styles.barCol}>
                      <AppText variant="caption" color="muted" style={styles.barValueText}>
                        {isZero ? '0' : `${Math.round(item.amount / 100) / 10}k`}
                      </AppText>

                      <View
                        style={[
                          styles.barTrack,
                          {
                            backgroundColor: isDark
                              ? 'rgba(255, 255, 255, 0.05)'
                              : 'rgba(2, 132, 199, 0.06)',
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.barFill,
                            {
                              height: `${heightPercent}%`,
                              overflow: 'hidden',
                            },
                          ]}
                        >
                          <LinearGradient
                            colors={
                              achieved
                                ? [colors.waterGradient[0], colors.waterGradient[2]]
                                : isZero
                                ? [colors.border, colors.border]
                                : item.isToday
                                ? [colors.accent, colors.accentHover]
                                : [colors.accentMuted, colors.accent]
                            }
                            style={StyleSheet.absoluteFill}
                          />
                        </View>
                      </View>

                      <AppText
                        variant="caption"
                        color={item.isToday ? 'accent' : 'secondary'}
                        style={item.isToday ? styles.todayLabel : undefined}
                      >
                        {item.day}
                      </AppText>
                    </View>
                  );
                })}
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Motivational Streak & Consistency Card */}
        <Animated.View entering={FadeInUp.delay(200).duration(450)}>
          <Card variant="subtle" style={styles.insightCard}>
            <View style={styles.insightHeaderRow}>
              <Trophy size={18} color="#D97706" />
              <AppText variant="bodyBold" color="primary">
                Optimal Hydration Score: 85%
              </AppText>
            </View>
            <AppText variant="subtext" color="secondary">
              Your water consumption is highest during early afternoons. Keep regular sips to sustain focus and avoid energy crashes.
            </AppText>
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
  header: {
    marginTop: 8,
    gap: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    padding: 16,
    borderWidth: 1.5,
    gap: 6,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  metricIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  chartCard: {
    gap: 20,
    paddingVertical: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  totalBadgeText: {
    fontWeight: '800',
  },
  chartContainer: {
    height: 200,
    justifyContent: 'flex-end',
    paddingTop: 12,
  },
  barsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 6,
  },
  barValueText: {
    fontSize: 10,
    fontWeight: '700',
  },
  barTrack: {
    width: '100%',
    maxWidth: 24,
    height: 135,
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderRadius: 8,
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 8,
    minHeight: 6,
  },
  todayLabel: {
    fontWeight: '800',
  },
  insightCard: {
    gap: 8,
  },
  insightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
