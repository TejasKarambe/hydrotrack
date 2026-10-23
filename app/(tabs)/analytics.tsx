import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Trophy, TrendingUp, Droplets, Award } from 'lucide-react-native';
import { Screen, AppText, Card } from '../../src/components/ui';
import { useAppTheme } from '../../src/theme/ThemeProvider';
import { useHydration } from '../../src/context/HydrationContext';
import {
  calculateAverageIntake,
  calculateDaysAchieved,
} from '../../src/utils/hydrationCalculations';

interface DaySummaryItem {
  dateKey: string;
  dayLabel: string;
  totalMl: number;
  isToday: boolean;
}

export default function AnalyticsScreen() {
  const { colors, isDark, radii } = useAppTheme();
  const { dailyGoalMl, getWeeklySummary, todayTotalMl } = useHydration();

  const [weeklyData, setWeeklyData] = useState<DaySummaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadWeeklyData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getWeeklySummary();
      setWeeklyData(data);
    } catch (err) {
      console.error('Failed to load weekly summary:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getWeeklySummary]);

  useEffect(() => {
    loadWeeklyData();
  }, [loadWeeklyData, todayTotalMl]);

  const amounts = weeklyData.map((d) => d.totalMl);
  const maxAmount = Math.max(...amounts, dailyGoalMl, 2500);
  const totalPeriod = amounts.reduce((acc, curr) => acc + curr, 0);
  const averageDaily = calculateAverageIntake(amounts);

  const daysComparison = weeklyData.map((d) => ({
    totalMl: d.totalMl,
    goalMl: dailyGoalMl,
  }));
  const achievedDays = calculateDaysAchieved(daysComparison);

  return (
    <Screen scrollable safeAreaEdges={['top']}>
      {/* Background Subtle Gradient */}
      <LinearGradient colors={colors.backgroundGradient} style={StyleSheet.absoluteFill} />

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
              {achievedDays} of {weeklyData.length} days
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
                  Target: {dailyGoalMl.toLocaleString()} ml/day
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
                {weeklyData.map((item) => {
                  const heightPercent = item.totalMl === 0
                    ? 6
                    : Math.max(8, Math.min(100, Math.round((item.totalMl / maxAmount) * 100)));
                  const achieved = item.totalMl >= dailyGoalMl && dailyGoalMl > 0;
                  const isZero = item.totalMl === 0;

                  return (
                    <View key={item.dateKey} style={styles.barCol}>
                      <AppText variant="caption" color="muted" style={styles.barValueText}>
                        {isZero ? '0' : `${Math.round(item.totalMl / 100) / 10}k`}
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
                        {item.dayLabel}
                      </AppText>
                    </View>
                  );
                })}
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Motivational Consistency Card */}
        <Animated.View entering={FadeInUp.delay(200).duration(450)}>
          <Card variant="subtle" style={styles.insightCard}>
            <View style={styles.insightHeaderRow}>
              <Trophy size={18} color="#D97706" />
              <AppText variant="bodyBold" color="primary">
                Hydration Consistency
              </AppText>
            </View>
            <AppText variant="subtext" color="secondary">
              {achievedDays >= 4
                ? `Excellent consistency! You hit your goal ${achievedDays} times in the last 7 days.`
                : achievedDays > 0
                ? `You reached your target ${achievedDays} times in the last 7 days. Consistency maintains focus.`
                : 'Build your momentum: Drinking small amounts every hour helps reach your target easily.'}
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
