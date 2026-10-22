import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Calendar as CalendarIcon, Clock, Droplets, CheckCircle2, ChevronRight } from 'lucide-react-native';
import { Screen, AppText, Card, Divider, EmptyState } from '../../src/components/ui';
import { useAppTheme } from '../../src/theme/ThemeProvider';

interface HistoryDay {
  dateStr: string;
  dayLabel: string;
  totalMl: number;
  goalMl: number;
  entries: { id: string; amount: number; time: string; label: string }[];
}

const SAMPLE_DAYS: HistoryDay[] = [
  {
    dateStr: '2026-10-22',
    dayLabel: 'Today',
    totalMl: 1250,
    goalMl: 2500,
    entries: [
      { id: '1', amount: 250, time: '09:15 AM', label: 'Morning Kickstart' },
      { id: '2', amount: 500, time: '11:30 AM', label: 'Workout Hydration' },
      { id: '3', amount: 500, time: '02:00 PM', label: 'Desk Refill' },
    ],
  },
  {
    dateStr: '2026-10-21',
    dayLabel: 'Yesterday',
    totalMl: 2600,
    goalMl: 2500,
    entries: [
      { id: '4', amount: 300, time: '08:30 AM', label: 'Morning Cup' },
      { id: '5', amount: 500, time: '11:00 AM', label: 'Gym Bottle' },
      { id: '6', amount: 800, time: '01:45 PM', label: 'Lunch Refill' },
      { id: '7', amount: 500, time: '04:30 PM', label: 'Afternoon Sip' },
      { id: '8', amount: 500, time: '08:00 PM', label: 'Evening Glass' },
    ],
  },
  {
    dateStr: '2026-10-20',
    dayLabel: 'Tue, Oct 20',
    totalMl: 2000,
    goalMl: 2500,
    entries: [
      { id: '9', amount: 500, time: '09:00 AM', label: 'Hydration Flask' },
      { id: '10', amount: 500, time: '01:00 PM', label: 'Lunch Glass' },
      { id: '11', amount: 1000, time: '06:00 PM', label: 'Evening Carafe' },
    ],
  },
  {
    dateStr: '2026-10-19',
    dayLabel: 'Mon, Oct 19',
    totalMl: 0,
    goalMl: 2500,
    entries: [],
  },
];

export default function HistoryScreen() {
  const { colors, isDark, radii } = useAppTheme();
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  const currentDay = SAMPLE_DAYS[selectedDateIndex];
  const goalAchieved = currentDay.totalMl >= currentDay.goalMl;

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
            Intake Logs
          </AppText>
          <AppText variant="subtext" color="secondary">
            Daily timeline and past hydration records
          </AppText>
        </Animated.View>

        {/* Date Selector Chips */}
        <Animated.View entering={FadeInUp.delay(100).duration(450)} style={styles.dateSelectorRow}>
          {SAMPLE_DAYS.map((day, idx) => {
            const isSelected = idx === selectedDateIndex;
            return (
              <Pressable
                key={day.dateStr}
                accessibilityRole="button"
                accessibilityLabel={`Select ${day.dayLabel}`}
                onPress={() => setSelectedDateIndex(idx)}
                style={({ pressed }) => [
                  styles.dateChip,
                  {
                    backgroundColor: isSelected ? colors.accent : colors.surface,
                    borderColor: isSelected ? colors.accent : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <AppText
                  variant="caption"
                  color={isSelected ? 'accentText' : 'secondary'}
                  style={isSelected ? styles.selectedChipText : undefined}
                >
                  {day.dayLabel}
                </AppText>
              </Pressable>
            );
          })}
        </Animated.View>

        {/* Day Summary Card */}
        <Animated.View entering={FadeInUp.delay(150).duration(450)}>
          <LinearGradient
            colors={
              isDark
                ? ['rgba(17, 24, 39, 0.95)', 'rgba(30, 41, 59, 0.85)']
                : ['#FFFFFF', '#F0F9FF']
            }
            style={[
              styles.summaryCard,
              { borderRadius: radii.lg, borderColor: colors.borderGlow },
            ]}
          >
            <View style={styles.summaryTop}>
              <View>
                <AppText variant="caption" color="secondary">
                  Total for {currentDay.dayLabel}
                </AppText>
                <View style={styles.metricRow}>
                  <AppText variant="numericLarge" color="primary">
                    {currentDay.totalMl.toLocaleString()}
                  </AppText>
                  <AppText variant="h3" color="secondary" style={styles.unitText}>
                    / {currentDay.goalMl.toLocaleString()} ml
                  </AppText>
                </View>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: goalAchieved
                      ? colors.successBg
                      : colors.accentSubtle,
                    borderColor: goalAchieved
                      ? 'rgba(5, 150, 105, 0.3)'
                      : colors.borderGlow,
                  },
                ]}
              >
                <AppText
                  variant="caption"
                  color={goalAchieved ? 'success' : 'accent'}
                  style={styles.statusBadgeText}
                >
                  {goalAchieved ? 'Goal Achieved' : `${Math.round((currentDay.totalMl / currentDay.goalMl) * 100)}%`}
                </AppText>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Timeline Entries or Empty State */}
        <Animated.View entering={FadeInUp.delay(200).duration(450)} style={styles.timelineSection}>
          <AppText variant="h3" color="primary">
            Entries ({currentDay.entries.length})
          </AppText>

          {currentDay.entries.length > 0 ? (
            <Card variant="default" padding={0} style={styles.timelineCard}>
              {currentDay.entries.map((entry, index) => (
                <React.Fragment key={entry.id}>
                  <View style={styles.timelineRow}>
                    <View style={styles.timelineLeft}>
                      <View
                        style={[
                          styles.timelineIconBadge,
                          { backgroundColor: colors.accentSubtle },
                        ]}
                      >
                        <Droplets size={16} color={colors.accent} strokeWidth={2.5} />
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
                  {index < currentDay.entries.length - 1 && (
                    <Divider subtle spacing={0} />
                  )}
                </React.Fragment>
              ))}
            </Card>
          ) : (
            <Card variant="subtle">
              <EmptyState
                icon={<CalendarIcon size={24} color={colors.textSecondary} />}
                title="No logs for this date"
                message="No water intake was recorded on this day."
              />
            </Card>
          )}
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
  dateSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  dateChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1.5,
  },
  selectedChipText: {
    fontWeight: '800',
  },
  summaryCard: {
    padding: 18,
    borderWidth: 1.5,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2,
  },
  unitText: {
    paddingBottom: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontWeight: '800',
  },
  timelineSection: {
    gap: 12,
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
