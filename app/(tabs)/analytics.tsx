import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  LayoutChangeEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  TrendingUp,
  Droplets,
  Award,
  CheckCircle2,
  Calendar,
  Sparkles,
  Info,
  Clock,
  Target,
} from 'lucide-react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Screen, AppText, Card, Divider } from '../../src/components/ui';
import { useAppTheme } from '../../src/theme/ThemeProvider';
import { useHydration } from '../../src/context/HydrationContext';
import {
  calculateWeeklyMetrics,
  DailyIntakeItem,
  calculateProgressPercentage,
  formatVolume,
} from '../../src/utils/hydrationCalculations';
import { formatDateFull, formatRelativeDate } from '../../src/utils/dateUtils';

export default function AnalyticsScreen() {
  const { colors, isDark, radii } = useAppTheme();
  const { dailyGoalMl, getWeeklySummary, todayTotalMl, settings } = useHydration();

  const [weeklyData, setWeeklyData] = useState<DailyIntakeItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [containerWidth, setContainerWidth] = useState<number>(320);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(6); // Default to today (last index)

  const loadWeeklyData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getWeeklySummary();
      setWeeklyData(data);
      if (data.length > 0) {
        setSelectedDayIndex(data.length - 1);
      }
    } catch (err) {
      console.error('[Analytics] Failed to load weekly summary:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getWeeklySummary]);

  useEffect(() => {
    loadWeeklyData();
  }, [loadWeeklyData, todayTotalMl, dailyGoalMl]);

  // Derived metrics from pure calculation module
  const metrics = useMemo(
    () => calculateWeeklyMetrics(weeklyData, dailyGoalMl),
    [weeklyData, dailyGoalMl]
  );

  const selectedDay = weeklyData[selectedDayIndex] || weeklyData[weeklyData.length - 1];
  const selectedDayTotal = selectedDay ? selectedDay.totalMl : 0;
  const selectedDayMet = selectedDayTotal >= dailyGoalMl && dailyGoalMl > 0;
  const selectedDayProgress = calculateProgressPercentage(selectedDayTotal, dailyGoalMl);

  // Maximum scale for the chart
  const amounts = weeklyData.map((d) => d.totalMl);
  const maxIntake = Math.max(...amounts, 0);
  const chartMax = Math.max(maxIntake * 1.15, dailyGoalMl * 1.2, 2500);

  // Dynamic bar width based on measured container width
  const chartInnerWidth = Math.max(260, containerWidth - 48);
  const barWidth = Math.max(18, Math.min(28, Math.floor((chartInnerWidth - 70) / 7)));
  const barSpacing = Math.max(8, Math.floor((chartInnerWidth - 70 - barWidth * 7) / 6));

  // Prepare chart data for react-native-gifted-charts
  const barData = useMemo(() => {
    return weeklyData.map((item, index) => {
      const achieved = item.totalMl >= dailyGoalMl && dailyGoalMl > 0;
      const isSelected = index === selectedDayIndex;
      const isZero = item.totalMl === 0;

      let frontColor: string;
      let gradientColor: string;

      if (achieved) {
        frontColor = colors.success;
        gradientColor = '#10B981';
      } else if (item.isToday) {
        frontColor = colors.accent;
        gradientColor = colors.accentHover;
      } else if (isZero) {
        frontColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(2, 132, 199, 0.15)';
        gradientColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(2, 132, 199, 0.08)';
      } else {
        frontColor = isDark ? 'rgba(56, 189, 248, 0.65)' : 'rgba(2, 132, 199, 0.65)';
        gradientColor = isDark ? 'rgba(56, 189, 248, 0.35)' : 'rgba(2, 132, 199, 0.35)';
      }

      // If selected, highlight with a glowing appearance
      if (isSelected) {
        frontColor = achieved ? '#34D399' : colors.accent;
      }

      return {
        value: item.totalMl === 0 ? Math.round(chartMax * 0.02) : item.totalMl,
        label: item.isToday ? 'Today' : item.dayLabel,
        frontColor,
        gradientColor,
        showGradient: true,
        onPress: () => setSelectedDayIndex(index),
        topLabelComponent: () => (
          <View style={styles.topLabelContainer}>
            {achieved ? (
              <CheckCircle2 size={11} color={colors.success} strokeWidth={2.8} />
            ) : item.isToday ? (
              <View
                style={[
                  styles.todayDot,
                  { backgroundColor: colors.accent, borderColor: colors.borderGlow },
                ]}
              />
            ) : null}
          </View>
        ),
      };
    });
  }, [
    weeklyData,
    dailyGoalMl,
    selectedDayIndex,
    colors,
    isDark,
    chartMax,
  ]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0 && Math.abs(width - containerWidth) > 5) {
      setContainerWidth(width);
    }
  };

  return (
    <Screen scrollable safeAreaEdges={['top']}>
      {/* Background Subtle Gradient */}
      <LinearGradient colors={colors.backgroundGradient} style={StyleSheet.absoluteFill} />

      <View style={styles.container}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <AppText variant="h1" color="primary">
            Hydration Analytics
          </AppText>
          <AppText variant="subtext" color="secondary">
            7-day trends, goal achievements, and SQLite intake patterns
          </AppText>
        </Animated.View>

        {/* Highlight 4-Metric Grid */}
        <Animated.View entering={FadeInUp.delay(100).duration(450)} style={styles.metricsGrid}>
          {/* Card 1: 7-Day Daily Average (Includes Zero-Intake Days) */}
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
              <TrendingUp size={18} color={colors.accent} strokeWidth={2.5} />
            </View>
            <AppText variant="caption" color="secondary">
              7-Day Average
            </AppText>
            <AppText variant="numericMedium" color="primary">
              {formatVolume(metrics.averageDaily, settings.preferred_display_unit)}
            </AppText>
            <AppText variant="caption" color="muted" style={styles.metricSubtext}>
              Includes zero-intake days
            </AppText>
          </LinearGradient>

          {/* Card 2: Days Goal Achieved */}
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
              <Award size={18} color={colors.success} strokeWidth={2.5} />
            </View>
            <AppText variant="caption" color="secondary">
              Goals Met
            </AppText>
            <AppText variant="numericMedium" color="primary">
              {metrics.daysAchieved} of {weeklyData.length}
            </AppText>
            <AppText variant="caption" color="muted" style={styles.metricSubtext}>
              {metrics.completionRate}% completion rate
            </AppText>
          </LinearGradient>

          {/* Card 3: Total 7-Day Volume */}
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
              <Droplets size={18} color={colors.accent} strokeWidth={2.5} />
            </View>
            <AppText variant="caption" color="secondary">
              Total Volume
            </AppText>
            <AppText variant="numericMedium" color="primary">
              {formatVolume(metrics.totalPeriod, settings.preferred_display_unit)}
            </AppText>
            <AppText variant="caption" color="muted" style={styles.metricSubtext}>
              Past 7 days consumed
            </AppText>
          </LinearGradient>

          {/* Card 4: Best Day */}
          <LinearGradient
            colors={
              isDark
                ? ['rgba(17, 24, 39, 0.95)', 'rgba(30, 41, 59, 0.85)']
                : ['#FFFFFF', '#FEF3C7']
            }
            style={[
              styles.metricCard,
              { borderRadius: radii.lg, borderColor: 'rgba(217, 119, 6, 0.25)' },
            ]}
          >
            <View
              style={[
                styles.metricIconWrap,
                { backgroundColor: isDark ? 'rgba(217, 119, 6, 0.2)' : 'rgba(217, 119, 6, 0.12)' },
              ]}
            >
              <Sparkles size={18} color="#D97706" strokeWidth={2.5} />
            </View>
            <AppText variant="caption" color="secondary">
              Best Day
            </AppText>
            <AppText variant="numericMedium" color="primary">
              {metrics.bestDay ? formatVolume(metrics.bestDay.totalMl, settings.preferred_display_unit) : formatVolume(0, settings.preferred_display_unit)}
            </AppText>
            <AppText variant="caption" color="muted" style={styles.metricSubtext}>
              {metrics.bestDay ? metrics.bestDay.dayLabel : 'No logs yet'}
            </AppText>
          </LinearGradient>
        </Animated.View>

        {/* 7-Day Intake Bar Chart Container */}
        <Animated.View entering={FadeInUp.delay(150).duration(450)}>
          <Card variant="default" style={styles.chartCard} onLayout={handleLayout}>
            {/* Chart Header */}
            <View style={styles.chartHeader}>
              <View>
                <AppText variant="h3" color="primary">
                  7-Day Water Intake
                </AppText>
                <AppText variant="caption" color="secondary">
                  Tap any bar to inspect daily statistics
                </AppText>
              </View>

              <View
                style={[
                  styles.goalLegendBadge,
                  { backgroundColor: colors.accentSubtle, borderColor: colors.borderGlow },
                ]}
              >
                <Target size={13} color={colors.accent} />
                <AppText variant="caption" color="accent" style={styles.goalLegendText}>
                  Goal: {formatVolume(dailyGoalMl, settings.preferred_display_unit)}
                </AppText>
              </View>
            </View>

            {/* Loading state or Bar Chart */}
            {isLoading ? (
              <View style={styles.chartLoadingContainer}>
                <ActivityIndicator size="small" color={colors.accent} />
                <AppText variant="caption" color="secondary">
                  Calculating hydration analytics...
                </AppText>
              </View>
            ) : (
              <View style={styles.chartWrapper}>
                <BarChart
                  data={barData}
                  width={chartInnerWidth}
                  height={190}
                  barWidth={barWidth}
                  spacing={barSpacing}
                  roundedTop
                  roundedBottom={false}
                  noOfSections={4}
                  maxValue={chartMax}
                  showReferenceLine1
                  referenceLine1Position={dailyGoalMl}
                  referenceLine1Config={{
                    color: colors.accent,
                    dashWidth: 4,
                    dashGap: 4,
                    labelText: `${formatVolume(dailyGoalMl, settings.preferred_display_unit)}`,
                    labelTextStyle: {
                      color: colors.accent,
                      fontSize: 9,
                      fontWeight: '700',
                    },
                  }}
                  hideRules={false}
                  rulesType="dashed"
                  rulesColor={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}
                  yAxisTextStyle={{
                    color: colors.textMuted,
                    fontSize: 10,
                  }}
                  xAxisLabelTextStyle={{
                    color: colors.textSecondary,
                    fontSize: 11,
                    fontWeight: '600',
                  }}
                  isAnimated
                  animationDuration={450}
                  initialSpacing={12}
                />
              </View>
            )}

            {/* Selected Day Inspector Card */}
            {selectedDay && (
              <View
                style={[
                  styles.inspectorBox,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: selectedDayMet ? 'rgba(5, 150, 105, 0.3)' : colors.borderGlow,
                  },
                ]}
              >
                <View style={styles.inspectorTop}>
                  <View style={styles.inspectorLeft}>
                    <Calendar size={15} color={colors.accent} />
                    <AppText variant="bodyBold" color="primary">
                      {formatRelativeDate(selectedDay.dateKey)} ({formatDateFull(selectedDay.dateKey)})
                    </AppText>
                  </View>

                  <View
                    style={[
                      styles.inspectorBadge,
                      {
                        backgroundColor: selectedDayMet
                          ? colors.successBg
                          : selectedDay.isToday
                          ? colors.accentSubtle
                          : isDark
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.05)',
                        borderColor: selectedDayMet
                          ? 'rgba(5, 150, 105, 0.3)'
                          : colors.border,
                      },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      color={selectedDayMet ? 'success' : selectedDay.isToday ? 'accent' : 'secondary'}
                      style={styles.inspectorBadgeText}
                    >
                      {selectedDayMet
                        ? 'Goal Achieved'
                        : selectedDay.isToday
                        ? 'In Progress (Today)'
                        : `${selectedDayProgress}% Reached`}
                    </AppText>
                  </View>
                </View>

                <View style={styles.inspectorProgressRow}>
                  <AppText variant="numericMedium" color="primary">
                    {formatVolume(selectedDay.totalMl, settings.preferred_display_unit)}
                  </AppText>
                  <AppText variant="caption" color="secondary">
                    {selectedDayMet
                      ? `Exceeded by ${formatVolume(selectedDay.totalMl - dailyGoalMl, settings.preferred_display_unit)}`
                      : `${formatVolume(Math.max(0, dailyGoalMl - selectedDay.totalMl), settings.preferred_display_unit)} remaining to reach goal`}
                  </AppText>
                </View>
              </View>
            )}

            {/* Chart Legend / Visual Indicators */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                <AppText variant="caption" color="secondary">
                  Goal Met
                </AppText>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    {
                      backgroundColor: isDark
                        ? 'rgba(56, 189, 248, 0.65)'
                        : 'rgba(2, 132, 199, 0.65)',
                    },
                  ]}
                />
                <AppText variant="caption" color="secondary">
                  Incomplete
                </AppText>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    {
                      backgroundColor: colors.accent,
                      borderColor: colors.borderGlow,
                      borderWidth: 1,
                    },
                  ]}
                />
                <AppText variant="caption" color="secondary">
                  Today (Partial)
                </AppText>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Accessible Textual Summary (Requirement 7) */}
        <Animated.View entering={FadeInUp.delay(200).duration(450)}>
          <Card
            variant="subtle"
            style={styles.summaryBox}
            accessibilityRole="summary"
            accessibilityLabel={metrics.textSummary}
          >
            <View style={styles.summaryHeaderRow}>
              <Info size={16} color={colors.accent} />
              <AppText variant="bodyBold" color="primary">
                Weekly Summary Breakdown
              </AppText>
            </View>
            <AppText variant="subtext" color="secondary" style={styles.summaryTextContent}>
              {metrics.textSummary}
            </AppText>
          </Card>
        </Animated.View>

        {/* 7-Day Day-by-Day Detailed Table / List */}
        <Animated.View entering={FadeInUp.delay(250).duration(450)} style={styles.breakdownSection}>
          <AppText variant="h3" color="primary">
            Daily Breakdown
          </AppText>

          <Card variant="default" padding={0} style={styles.breakdownCard}>
            {weeklyData.map((dayItem, index) => {
              const achieved = dayItem.totalMl >= dailyGoalMl && dailyGoalMl > 0;
              const percent = calculateProgressPercentage(dayItem.totalMl, dailyGoalMl);
              const isSelected = index === selectedDayIndex;

              return (
                <React.Fragment key={dayItem.dateKey}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`View ${dayItem.dayLabel} breakdown`}
                    onPress={() => setSelectedDayIndex(index)}
                    style={({ pressed }) => [
                      styles.breakdownRow,
                      {
                        backgroundColor: isSelected
                          ? colors.accentSubtle
                          : 'transparent',
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                  >
                    <View style={styles.breakdownLeft}>
                      <View
                        style={[
                          styles.dayInitialBadge,
                          {
                            backgroundColor: achieved
                              ? colors.successBg
                              : dayItem.isToday
                              ? colors.accentSubtle
                              : colors.surface,
                            borderColor: achieved
                              ? 'rgba(5, 150, 105, 0.3)'
                              : colors.border,
                          },
                        ]}
                      >
                        <AppText
                          variant="caption"
                          color={achieved ? 'success' : dayItem.isToday ? 'accent' : 'secondary'}
                          style={{ fontWeight: '800' }}
                        >
                          {dayItem.dayLabel.slice(0, 3)}
                        </AppText>
                      </View>
                      <View>
                        <AppText variant="bodyBold" color="primary">
                          {formatRelativeDate(dayItem.dateKey)}
                        </AppText>
                        <AppText variant="caption" color="muted">
                          {formatDateFull(dayItem.dateKey)}
                        </AppText>
                      </View>
                    </View>

                    <View style={styles.breakdownRight}>
                      <AppText variant="bodyBold" color="primary">
                        {formatVolume(dayItem.totalMl, settings.preferred_display_unit)}
                      </AppText>
                      <View style={styles.breakdownStatusTag}>
                        {achieved ? (
                          <CheckCircle2 size={12} color={colors.success} strokeWidth={2.5} />
                        ) : dayItem.isToday ? (
                          <Clock size={12} color={colors.accent} strokeWidth={2.5} />
                        ) : null}
                        <AppText
                          variant="caption"
                          color={achieved ? 'success' : dayItem.isToday ? 'accent' : 'muted'}
                          style={{ fontWeight: '700' }}
                        >
                          {achieved
                            ? 'Goal Met'
                            : dayItem.isToday
                            ? `${percent}% (Today)`
                            : `${percent}%`}
                        </AppText>
                      </View>
                    </View>
                  </Pressable>
                  {index < weeklyData.length - 1 && <Divider subtle spacing={0} />}
                </React.Fragment>
              );
            })}
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
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: 14,
    borderWidth: 1.5,
    gap: 4,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  metricSubtext: {
    fontSize: 10,
    marginTop: 2,
  },
  chartCard: {
    gap: 16,
    paddingVertical: 18,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  goalLegendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  goalLegendText: {
    fontWeight: '700',
    fontSize: 11,
  },
  chartLoadingContainer: {
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    overflow: 'hidden',
  },
  topLabelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
  },
  inspectorBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
    marginTop: 4,
  },
  inspectorTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inspectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inspectorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  inspectorBadgeText: {
    fontWeight: '700',
    fontSize: 11,
  },
  inspectorProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
    paddingTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryBox: {
    gap: 8,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryTextContent: {
    lineHeight: 20,
  },
  breakdownSection: {
    gap: 12,
  },
  breakdownCard: {
    overflow: 'hidden',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayInitialBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  breakdownRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  breakdownStatusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
