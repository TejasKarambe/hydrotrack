import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Calendar as CalendarIcon, Clock, Droplets, Trash2, Edit2 } from 'lucide-react-native';
import { Screen, AppText, Card, Divider, EmptyState } from '../../src/components/ui';
import { useAppTheme } from '../../src/theme/ThemeProvider';
import { useHydration } from '../../src/context/HydrationContext';
import { getPastLocalDays, formatLocalTime } from '../../src/utils/dateUtils';
import { calculateTotalIntake, calculateProgressPercentage } from '../../src/utils/hydrationCalculations';
import { WaterLog } from '../../src/types/database';

export default function HistoryScreen() {
  const router = useRouter();
  const { colors, isDark, radii } = useAppTheme();
  const { dailyGoalMl, getLogsForDate, deleteLog, todayLogs } = useHydration();

  const pastDays = getPastLocalDays(7);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [selectedDayLogs, setSelectedDayLogs] = useState<WaterLog[]>([]);
  const [isLoadingDay, setIsLoadingDay] = useState<boolean>(false);

  const selectedDay = pastDays[selectedDayIndex];

  // Fetch records whenever selected day changes or todayLogs updates
  const loadDayRecords = useCallback(async () => {
    if (!selectedDay) return;
    setIsLoadingDay(true);
    try {
      const logs = await getLogsForDate(selectedDay.dateKey);
      setSelectedDayLogs(logs);
    } catch (err) {
      console.error('Failed to load day logs:', err);
    } finally {
      setIsLoadingDay(false);
    }
  }, [selectedDay, getLogsForDate]);

  useEffect(() => {
    loadDayRecords();
  }, [loadDayRecords, todayLogs]);

  const dayTotal = calculateTotalIntake(selectedDayLogs);
  const goalAchieved = dayTotal >= dailyGoalMl && dailyGoalMl > 0;
  const progressPercent = calculateProgressPercentage(dayTotal, dailyGoalMl);

  const handleDelete = (log: WaterLog) => {
    Alert.alert(
      'Delete Entry',
      `Delete this ${log.amount_ml} ml intake record?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLog(log.id);
              await loadDayRecords();
            } catch {
              Alert.alert('Error', 'Failed to delete record.');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (log: WaterLog) => {
    router.push({
      pathname: '/log-water',
      params: {
        editId: log.id,
        initialAmount: log.amount_ml.toString(),
        initialTime: log.consumed_at,
      },
    });
  };

  return (
    <Screen scrollable safeAreaEdges={['top']}>
      {/* Background Subtle Gradient */}
      <LinearGradient colors={colors.backgroundGradient} style={StyleSheet.absoluteFill} />

      <View style={styles.container}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <AppText variant="h1" color="primary">
            Intake History
          </AppText>
          <AppText variant="subtext" color="secondary">
            Daily timeline and past SQLite hydration logs
          </AppText>
        </Animated.View>

        {/* Date Selector Chips */}
        <Animated.View entering={FadeInUp.delay(100).duration(450)} style={styles.dateSelectorRow}>
          {pastDays.map((day, idx) => {
            const isSelected = idx === selectedDayIndex;
            return (
              <Pressable
                key={day.dateKey}
                accessibilityRole="button"
                accessibilityLabel={`Select ${day.label}`}
                onPress={() => setSelectedDayIndex(idx)}
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
                  {day.label}
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
                  Total for {selectedDay.label}
                </AppText>
                <View style={styles.metricRow}>
                  <AppText variant="numericLarge" color="primary">
                    {dayTotal.toLocaleString()}
                  </AppText>
                  <AppText variant="h3" color="secondary" style={styles.unitText}>
                    / {dailyGoalMl.toLocaleString()} ml
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
                  {goalAchieved ? 'Goal Achieved' : `${progressPercent}%`}
                </AppText>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Timeline Entries or Empty State */}
        <Animated.View entering={FadeInUp.delay(200).duration(450)} style={styles.timelineSection}>
          <View style={styles.timelineHeaderRow}>
            <AppText variant="h3" color="primary">
              Entries ({selectedDayLogs.length})
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add entry for this day"
              onPress={() => router.push('/log-water')}
            >
              <AppText variant="caption" color="accent">
                + Add Record
              </AppText>
            </Pressable>
          </View>

          {selectedDayLogs.length > 0 ? (
            <Card variant="default" padding={0} style={styles.timelineCard}>
              {selectedDayLogs.map((entry, index) => (
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

                    <View style={styles.timelineActions}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Edit record"
                        onPress={() => handleEdit(entry)}
                        style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.6 : 1 }]}
                      >
                        <Edit2 size={16} color={colors.textSecondary} />
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Delete record"
                        onPress={() => handleDelete(entry)}
                        style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.6 : 1 }]}
                      >
                        <Trash2 size={16} color={colors.danger} />
                      </Pressable>
                    </View>
                  </View>
                  {index < selectedDayLogs.length - 1 && (
                    <Divider subtle spacing={0} />
                  )}
                </React.Fragment>
              ))}
            </Card>
          ) : (
            <Card variant="subtle">
              <EmptyState
                icon={<CalendarIcon size={24} color={colors.textSecondary} />}
                title={`No Logs for ${selectedDay.label}`}
                message="No water intake was recorded on this day in SQLite."
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
  timelineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  actionBtn: {
    padding: 6,
  },
});
