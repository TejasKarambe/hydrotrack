import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  Calendar as CalendarIcon,
  Clock,
  Droplets,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react-native';
import { Screen, AppText, Card, Divider, EmptyState, Button, IconButton } from '../../src/components/ui';
import { useAppTheme } from '../../src/theme/ThemeProvider';
import { useHydration } from '../../src/context/HydrationContext';
import {
  getLocalDateKey,
  isLocalToday,
  formatLocalTime,
  formatRelativeDate,
  formatDateFull,
  formatMonthYear,
  shiftDateByDays,
  getPastLocalDays,
  getCalendarGrid,
} from '../../src/utils/dateUtils';
import {
  calculateTotalIntake,
  calculateProgressPercentage,
  calculateRemaining,
  formatVolume,
} from '../../src/utils/hydrationCalculations';
import { WaterLog } from '../../src/types/database';

export default function HistoryScreen() {
  const router = useRouter();
  const { colors, isDark, radii } = useAppTheme();
  const {
    dailyGoalMl,
    getLogsForDate,
    deleteLog,
    todayLogs,
    getDatesWithLogs,
    settings,
  } = useHydration();

  // Current selected date state
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const selectedDateKey = useMemo(() => getLocalDateKey(selectedDate), [selectedDate]);
  const isSelectedToday = useMemo(() => isLocalToday(selectedDate.toISOString()), [selectedDate]);

  // Selected day logs and loading/error states
  const [selectedDayLogs, setSelectedDayLogs] = useState<WaterLog[]>([]);
  const [isLoadingDay, setIsLoadingDay] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Quick 14-day history strip
  const quickDays = useMemo(() => getPastLocalDays(14), []);

  // Calendar Picker Modal State
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [calendarYear, setCalendarYear] = useState<number>(() => selectedDate.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(() => selectedDate.getMonth());
  const [monthDatesWithLogs, setMonthDatesWithLogs] = useState<string[]>([]);

  // Fetch records for the selected dateKey
  const loadDayRecords = useCallback(
    async (dateKey: string) => {
      if (!dateKey) return;
      setIsLoadingDay(true);
      setLoadError(null);
      try {
        const logs = await getLogsForDate(dateKey);
        setSelectedDayLogs(logs);
      } catch (err) {
        console.error('[History] Failed to load day records:', err);
        setLoadError('Could not load water records for this date.');
      } finally {
        setIsLoadingDay(false);
      }
    },
    [getLogsForDate]
  );

  useEffect(() => {
    loadDayRecords(selectedDateKey);
  }, [selectedDateKey, loadDayRecords, todayLogs.length]);

  // Fetch month dots for the calendar picker
  const loadMonthLogDates = useCallback(
    async (year: number, month: number) => {
      try {
        const dates = await getDatesWithLogs(year, month);
        setMonthDatesWithLogs(dates);
      } catch (err) {
        console.error('[History] Failed to load month log dates:', err);
      }
    },
    [getDatesWithLogs]
  );

  useEffect(() => {
    if (isCalendarOpen) {
      loadMonthLogDates(calendarYear, calendarMonth);
    }
  }, [isCalendarOpen, calendarYear, calendarMonth, loadMonthLogDates]);

  // Calculations for selected day
  const dayTotal = useMemo(() => calculateTotalIntake(selectedDayLogs), [selectedDayLogs]);
  const goalAchieved = dayTotal >= dailyGoalMl && dailyGoalMl > 0;
  const progressPercent = useMemo(
    () => calculateProgressPercentage(dayTotal, dailyGoalMl),
    [dayTotal, dailyGoalMl]
  );
  const remainingMl = useMemo(
    () => calculateRemaining(dayTotal, dailyGoalMl),
    [dayTotal, dailyGoalMl]
  );

  // Stepper handlers
  const handlePrevDay = () => {
    setSelectedDate((prev) => shiftDateByDays(prev, -1));
  };

  const handleNextDay = () => {
    if (isSelectedToday) return; // Prevent navigating into future dates
    setSelectedDate((prev) => shiftDateByDays(prev, 1));
  };

  // Calendar month navigation
  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarYear((y) => y - 1);
      setCalendarMonth(11);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    const now = new Date();
    // Prevent navigating into future months
    if (
      calendarYear > now.getFullYear() ||
      (calendarYear === now.getFullYear() && calendarMonth >= now.getMonth())
    ) {
      return;
    }

    if (calendarMonth === 11) {
      setCalendarYear((y) => y + 1);
      setCalendarMonth(0);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  const handleSelectCalendarDay = (date: Date) => {
    const today = new Date();
    if (date.getTime() > today.getTime()) return;
    setSelectedDate(date);
    setIsCalendarOpen(false);
  };

  const handleJumpToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCalendarYear(today.getFullYear());
    setCalendarMonth(today.getMonth());
    setIsCalendarOpen(false);
  };

  // Record actions
  const handleDelete = (log: WaterLog) => {
    Alert.alert(
      'Delete Entry',
      `Delete this ${formatVolume(log.amount_ml, settings.preferred_display_unit)} intake record?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLog(log.id);
              await loadDayRecords(selectedDateKey);
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
        selectedDate: selectedDateKey,
      },
    });
  };

  const handleAddForSelectedDay = () => {
    router.push({
      pathname: '/log-water',
      params: {
        selectedDate: selectedDateKey,
      },
    });
  };

  // Calendar Grid Data
  const calendarGrid = useMemo(
    () => getCalendarGrid(calendarYear, calendarMonth),
    [calendarYear, calendarMonth]
  );
  const monthLogDatesSet = useMemo(
    () => new Set(monthDatesWithLogs),
    [monthDatesWithLogs]
  );

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
            Daily timeline and past SQLite hydration records
          </AppText>
        </Animated.View>

        {/* Date Stepper Navigation Bar */}
        <Animated.View entering={FadeInUp.delay(50).duration(450)}>
          <Card variant="default" padding={12} style={styles.navBarCard}>
            <View style={styles.stepperRow}>
              {/* Previous Day Button */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go to previous day"
                onPress={handlePrevDay}
                style={({ pressed }) => [
                  styles.navArrowBtn,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <ChevronLeft size={20} color={colors.textPrimary} />
              </Pressable>

              {/* Center Date Trigger for Calendar Picker */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open calendar date picker"
                onPress={() => {
                  setCalendarYear(selectedDate.getFullYear());
                  setCalendarMonth(selectedDate.getMonth());
                  setIsCalendarOpen(true);
                }}
                style={({ pressed }) => [
                  styles.dateCenterBtn,
                  {
                    backgroundColor: colors.accentSubtle,
                    borderColor: colors.borderGlow,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <CalendarIcon size={16} color={colors.accent} strokeWidth={2.4} />
                <View style={styles.dateCenterTextCol}>
                  <AppText variant="bodyBold" color="primary" style={styles.relativeDateText}>
                    {formatRelativeDate(selectedDateKey)}
                  </AppText>
                  <AppText variant="caption" color="secondary">
                    {formatDateFull(selectedDateKey)}
                  </AppText>
                </View>
              </Pressable>

              {/* Next Day Button (Disabled if Today) */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go to next day"
                disabled={isSelectedToday}
                onPress={handleNextDay}
                style={({ pressed }) => [
                  styles.navArrowBtn,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    opacity: isSelectedToday ? 0.3 : pressed ? 0.7 : 1,
                  },
                ]}
              >
                <ChevronRight
                  size={20}
                  color={isSelectedToday ? colors.textMuted : colors.textPrimary}
                />
              </Pressable>
            </View>
          </Card>
        </Animated.View>

        {/* Quick Date Selector Horizontal Strip */}
        <Animated.View entering={FadeInUp.delay(100).duration(450)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickStripContent}
          >
            {quickDays.map((item) => {
              const isSelected = item.dateKey === selectedDateKey;
              const [y, m, d] = item.dateKey.split('-').map(Number);
              const dayObj = new Date(y, m - 1, d);
              const weekday = dayObj.toLocaleDateString([], { weekday: 'short' });
              const dayNum = dayObj.getDate();

              return (
                <Pressable
                  key={item.dateKey}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${item.label}`}
                  onPress={() => setSelectedDate(dayObj)}
                  style={({ pressed }) => [
                    styles.quickDayPill,
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
                    style={styles.quickDayWeekday}
                  >
                    {weekday}
                  </AppText>
                  <AppText
                    variant="bodyBold"
                    color={isSelected ? 'accentText' : 'primary'}
                    style={styles.quickDayNum}
                  >
                    {dayNum}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Selected Day Summary Card */}
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
              <View style={{ flex: 1 }}>
                <AppText variant="caption" color="secondary">
                  Intake for {formatRelativeDate(selectedDateKey)}
                </AppText>
                <View style={styles.metricRow}>
                  <AppText variant="numericLarge" color="primary">
                    {formatVolume(dayTotal, settings.preferred_display_unit, false)}
                  </AppText>
                  <AppText variant="h3" color="secondary" style={styles.unitText}>
                    / {formatVolume(dailyGoalMl, settings.preferred_display_unit)}
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
                {goalAchieved ? (
                  <CheckCircle2 size={14} color={colors.success} strokeWidth={2.5} />
                ) : (
                  <Droplets size={14} color={colors.accent} strokeWidth={2.5} />
                )}
                <AppText
                  variant="caption"
                  color={goalAchieved ? 'success' : 'accent'}
                  style={styles.statusBadgeText}
                >
                  {goalAchieved ? 'Goal Met' : `${progressPercent}%`}
                </AppText>
              </View>
            </View>

            {/* Visual Progress Bar */}
            <View
              style={[
                styles.progressBarTrack,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(2, 132, 199, 0.08)' },
              ]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(100, progressPercent)}%`,
                  },
                ]}
              >
                <LinearGradient
                  colors={
                    goalAchieved
                      ? [colors.success, '#10B981']
                      : [colors.accent, colors.accentHover]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </View>
            </View>

            {/* Bottom Sub-metrics */}
            <View style={styles.summarySubRow}>
              <AppText variant="caption" color="muted">
                {selectedDayLogs.length} {selectedDayLogs.length === 1 ? 'record' : 'records'} logged
              </AppText>
              <AppText variant="caption" color="muted">
                {goalAchieved
                  ? `Goal exceeded by ${formatVolume(dayTotal - dailyGoalMl, settings.preferred_display_unit)}`
                  : `${formatVolume(remainingMl, settings.preferred_display_unit)} remaining`}
              </AppText>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Timeline Entries or Empty State */}
        <Animated.View entering={FadeInUp.delay(200).duration(450)} style={styles.timelineSection}>
          <View style={styles.timelineHeaderRow}>
            <AppText variant="h3" color="primary">
              Timeline ({selectedDayLogs.length})
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add record for this date"
              onPress={handleAddForSelectedDay}
              style={({ pressed }) => [
                styles.addRecordBtn,
                {
                  backgroundColor: colors.accentSubtle,
                  borderColor: colors.borderGlow,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Plus size={14} color={colors.accent} strokeWidth={2.5} />
              <AppText variant="caption" color="accent" style={{ fontWeight: '700' }}>
                Add Record
              </AppText>
            </Pressable>
          </View>

          {/* Loading Indicator */}
          {isLoadingDay && (
            <Card variant="subtle" style={styles.centeredCard}>
              <ActivityIndicator size="small" color={colors.accent} />
              <AppText variant="caption" color="secondary">
                Loading records from SQLite...
              </AppText>
            </Card>
          )}

          {/* Error Banner */}
          {!isLoadingDay && loadError && (
            <Card variant="default" style={[styles.errorCard, { borderColor: colors.danger }]}>
              <View style={styles.errorRow}>
                <AlertCircle size={20} color={colors.danger} />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyBold" color="danger">
                    Error Loading Logs
                  </AppText>
                  <AppText variant="caption" color="secondary">
                    {loadError}
                  </AppText>
                </View>
                <IconButton
                  icon={<RefreshCw size={16} color={colors.accent} />}
                  onPress={() => loadDayRecords(selectedDateKey)}
                  accessibilityLabel="Retry loading records"
                  variant="ghost"
                  size="sm"
                />
              </View>
            </Card>
          )}

          {/* Timeline List */}
          {!isLoadingDay && !loadError && selectedDayLogs.length > 0 && (
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
                          {formatVolume(entry.amount_ml, settings.preferred_display_unit)}
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
          )}

          {/* Empty State */}
          {!isLoadingDay && !loadError && selectedDayLogs.length === 0 && (
            <Card variant="subtle">
              <EmptyState
                icon={<CalendarIcon size={26} color={colors.accent} />}
                title={`No Records for ${formatRelativeDate(selectedDateKey)}`}
                message={`No hydration intake was logged on ${formatDateFull(selectedDateKey)}. Tap below to add an entry.`}
                actionLabel="Log Water for this Date"
                onAction={handleAddForSelectedDay}
              />
            </Card>
          )}
        </Animated.View>
      </View>

      {/* Interactive Calendar Picker Modal */}
      <Modal
        visible={isCalendarOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCalendarOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.calendarModalContent,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderGlow,
                borderRadius: radii.xl,
              },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.calendarModalHeader}>
              <View style={styles.monthNavRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Previous month"
                  onPress={handlePrevMonth}
                  style={({ pressed }) => [
                    styles.monthNavBtn,
                    { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <ChevronLeft size={18} color={colors.textPrimary} />
                </Pressable>

                <AppText variant="h3" color="primary" style={styles.monthYearTitle}>
                  {formatMonthYear(calendarYear, calendarMonth)}
                </AppText>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Next month"
                  onPress={handleNextMonth}
                  style={({ pressed }) => [
                    styles.monthNavBtn,
                    { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <ChevronRight size={18} color={colors.textPrimary} />
                </Pressable>
              </View>

              <IconButton
                icon={<X size={18} color={colors.textSecondary} />}
                onPress={() => setIsCalendarOpen(false)}
                accessibilityLabel="Close calendar picker"
                variant="default"
                size="sm"
              />
            </View>

            {/* Weekday Column Headers */}
            <View style={styles.weekdayRow}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                <AppText
                  key={idx}
                  variant="caption"
                  color="muted"
                  style={styles.weekdayColText}
                >
                  {day}
                </AppText>
              ))}
            </View>

            {/* Calendar Days Grid */}
            <View style={styles.daysGrid}>
              {calendarGrid.map((cell) => {
                const isSelected = cell.dateKey === selectedDateKey;
                const hasLogs = monthLogDatesSet.has(cell.dateKey);

                return (
                  <Pressable
                    key={cell.dateKey}
                    accessibilityRole="button"
                    accessibilityLabel={`Date ${cell.dateKey}`}
                    disabled={cell.isFuture}
                    onPress={() => handleSelectCalendarDay(cell.date)}
                    style={({ pressed }) => [
                      styles.dayCell,
                      {
                        backgroundColor: isSelected
                          ? colors.accent
                          : cell.isToday
                          ? colors.accentSubtle
                          : 'transparent',
                        borderColor: cell.isToday && !isSelected ? colors.accent : 'transparent',
                        opacity: cell.isFuture
                          ? 0.25
                          : !cell.isCurrentMonth
                          ? 0.4
                          : pressed
                          ? 0.7
                          : 1,
                      },
                    ]}
                  >
                    <AppText
                      variant="bodyBold"
                      color={
                        isSelected
                          ? 'accentText'
                          : cell.isToday
                          ? 'accent'
                          : cell.isCurrentMonth
                          ? 'primary'
                          : 'muted'
                      }
                      style={styles.dayCellText}
                    >
                      {cell.dayNumber}
                    </AppText>

                    {/* Dot indicator if logs exist */}
                    {hasLogs && (
                      <View
                        style={[
                          styles.hasLogsDot,
                          {
                            backgroundColor: isSelected
                              ? '#FFFFFF'
                              : colors.accent,
                          },
                        ]}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Modal Bottom Actions */}
            <View style={styles.calendarModalFooter}>
              <Button
                label="Jump to Today"
                onPress={handleJumpToToday}
                variant="secondary"
                size="sm"
              />
              <Button
                label="Done"
                onPress={() => setIsCalendarOpen(false)}
                variant="primary"
                size="sm"
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
    gap: 16,
  },
  header: {
    marginTop: 8,
    gap: 4,
  },
  navBarCard: {
    borderWidth: 1.5,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  navArrowBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dateCenterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  dateCenterTextCol: {
    alignItems: 'center',
  },
  relativeDateText: {
    fontSize: 15,
  },
  quickStripContent: {
    gap: 8,
    paddingVertical: 2,
  },
  quickDayPill: {
    width: 54,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  quickDayWeekday: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  quickDayNum: {
    fontSize: 16,
  },
  summaryCard: {
    padding: 18,
    borderWidth: 1.5,
    gap: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  summarySubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineSection: {
    gap: 12,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  centeredCard: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  errorCard: {
    borderWidth: 1.5,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarModalContent: {
    width: '100%',
    maxWidth: 360,
    padding: 20,
    borderWidth: 1.5,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 8,
  },
  calendarModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  monthYearTitle: {
    fontSize: 16,
    minWidth: 130,
    textAlign: 'center',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  weekdayColText: {
    width: 38,
    textAlign: 'center',
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'space-between',
  },
  dayCell: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    position: 'relative',
  },
  dayCellText: {
    fontSize: 13,
  },
  hasLogsDot: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  calendarModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
});
