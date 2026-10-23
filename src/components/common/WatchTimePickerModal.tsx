import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
} from 'react-native';
import { Clock, Check, Sparkles, AlertCircle, X } from 'lucide-react-native';
import { AppText, Button } from '../ui';
import { useAppTheme } from '../../theme/ThemeProvider';
import { parseTimeString, validateReminderTimeWindow } from '../../utils/reminderCalculations';

export interface WatchTimePickerModalProps {
  visible: boolean;
  initialStartTime: string; // e.g. "08:00"
  initialEndTime: string;   // e.g. "20:00"
  onClose: () => void;
  onSave: (startTime: string, endTime: string) => Promise<void> | void;
}

const PRESETS = [
  { label: '08:00 – 20:00 (Early 12h)', start: '08:00', end: '20:00' },
  { label: '09:00 – 21:00 (Standard 12h)', start: '09:00', end: '21:00' },
  { label: '07:00 – 22:00 (Active 15h)', start: '07:00', end: '22:00' },
  { label: '10:00 – 22:00 (Relaxed 12h)', start: '10:00', end: '22:00' },
];

function timeTo12Hour(timeStr: string): { hour12: number; minute: number; isPm: boolean } {
  const parsed = parseTimeString(timeStr);
  if (!parsed) {
    return { hour12: 9, minute: 0, isPm: false };
  }
  const isPm = parsed.hours >= 12;
  const hour12 = parsed.hours % 12 === 0 ? 12 : parsed.hours % 12;
  return { hour12, minute: parsed.minutes, isPm };
}

function timeTo24Hour(hour12: number, minute: number, isPm: boolean): string {
  let h24 = hour12 % 12;
  if (isPm) h24 += 12;
  const hh = String(h24).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  return `${hh}:${mm}`;
}

const DIAL_SIZE = 220;
const RADIUS = 82; // radius for number placement from center (110, 110)

const CLOCK_POSITIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => {
  const angle = (num * 30 * Math.PI) / 180;
  const x = Math.round(DIAL_SIZE / 2 + RADIUS * Math.sin(angle) - 18);
  const y = Math.round(DIAL_SIZE / 2 - RADIUS * Math.cos(angle) - 18);
  return { num, x, y };
});

export const WatchTimePickerModal: React.FC<WatchTimePickerModalProps> = ({
  visible,
  initialStartTime,
  initialEndTime,
  onClose,
  onSave,
}) => {
  const { colors, radii, isDark } = useAppTheme();

  // Active target tab: 'start' or 'end'
  const [activeTarget, setActiveTarget] = useState<'start' | 'end'>('start');

  // Active dial mode: 'hours' or 'minutes'
  const [dialMode, setDialMode] = useState<'hours' | 'minutes'>('hours');

  // Start time state
  const [startHour12, setStartHour12] = useState(8);
  const [startMinute, setStartMinute] = useState(0);
  const [startIsPm, setStartIsPm] = useState(false);

  // End time state
  const [endHour12, setEndHour12] = useState(8);
  const [endMinute, setEndMinute] = useState(0);
  const [endIsPm, setEndIsPm] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset values when modal opens
  useEffect(() => {
    if (visible) {
      const s = timeTo12Hour(initialStartTime || '08:00');
      const e = timeTo12Hour(initialEndTime || '20:00');
      setStartHour12(s.hour12);
      setStartMinute(s.minute);
      setStartIsPm(s.isPm);
      setEndHour12(e.hour12);
      setEndMinute(e.minute);
      setEndIsPm(e.isPm);
      setActiveTarget('start');
      setDialMode('hours');
      setErrorMsg(null);
      setIsSaving(false);
    }
  }, [visible, initialStartTime, initialEndTime]);

  // Derived 24h formatted strings
  const currentStartTime24 = useMemo(
    () => timeTo24Hour(startHour12, startMinute, startIsPm),
    [startHour12, startMinute, startIsPm]
  );

  const currentEndTime24 = useMemo(
    () => timeTo24Hour(endHour12, endMinute, endIsPm),
    [endHour12, endMinute, endIsPm]
  );

  // Validation
  const validation = useMemo(() => {
    return validateReminderTimeWindow(currentStartTime24, currentEndTime24);
  }, [currentStartTime24, currentEndTime24]);

  const activeHour = activeTarget === 'start' ? startHour12 : endHour12;
  const activeMin = activeTarget === 'start' ? startMinute : endMinute;
  const activeIsPm = activeTarget === 'start' ? startIsPm : endIsPm;

  const handleSelectHour = (h: number) => {
    if (activeTarget === 'start') {
      setStartHour12(h);
    } else {
      setEndHour12(h);
    }
    // Automatically advance to minutes for convenience
    setDialMode('minutes');
    setErrorMsg(null);
  };

  const handleSelectMinute = (m: number) => {
    if (activeTarget === 'start') {
      setStartMinute(m);
    } else {
      setEndMinute(m);
    }
    setErrorMsg(null);
  };

  const handleToggleAmPm = (pm: boolean) => {
    if (activeTarget === 'start') {
      setStartIsPm(pm);
    } else {
      setEndIsPm(pm);
    }
    setErrorMsg(null);
  };

  const handleApplyPreset = (start: string, end: string) => {
    const s = timeTo12Hour(start);
    const e = timeTo12Hour(end);
    setStartHour12(s.hour12);
    setStartMinute(s.minute);
    setStartIsPm(s.isPm);
    setEndHour12(e.hour12);
    setEndMinute(e.minute);
    setEndIsPm(e.isPm);
    setErrorMsg(null);
  };

  const handleAdjustMinute = (delta: number) => {
    let next = (activeMin + delta) % 60;
    if (next < 0) next += 60;
    if (activeTarget === 'start') {
      setStartMinute(next);
    } else {
      setEndMinute(next);
    }
  };

  const handleSave = async () => {
    if (!validation.isValid) {
      setErrorMsg(validation.error || 'End time must be after start time.');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(currentStartTime24, currentEndTime24);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save active hours.');
    } finally {
      setIsSaving(false);
    }
  };

  // Compute angle of current selection for the clock hand
  const currentAngle = useMemo(() => {
    if (dialMode === 'hours') {
      return (activeHour * 30 * Math.PI) / 180;
    }
    return ((activeMin / 5) * 30 * Math.PI) / 180;
  }, [dialMode, activeHour, activeMin]);


  const formatDisplay = (h: number, m: number, pm: boolean) => {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${pm ? 'PM' : 'AM'}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderGlow, borderRadius: radii.xl }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.headerIconBox, { backgroundColor: colors.accentSubtle, borderColor: colors.accent }]}>
              <Clock size={20} color={colors.accent} strokeWidth={2.4} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="h2" color="primary">Active Reminder Hours</AppText>
              <AppText variant="caption" color="secondary">
                Analog watch face time picker
              </AppText>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.6 : 1 }]}
            >
              <X size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Start / End Switcher Tabs */}
          <View style={[styles.tabBar, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTarget === 'start' }}
              onPress={() => {
                setActiveTarget('start');
                setDialMode('hours');
              }}
              style={[
                styles.tabBtn,
                activeTarget === 'start' && {
                  backgroundColor: colors.accent,
                  shadowColor: colors.accent,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 3,
                },
              ]}
            >
              <AppText variant="caption" color={activeTarget === 'start' ? 'accentText' : 'muted'} style={{ fontSize: 10, fontWeight: '700' }}>
                START TIME
              </AppText>
              <AppText
                variant="bodyBold"
                color={activeTarget === 'start' ? 'accentText' : 'primary'}
                style={{ fontSize: 15 }}
              >
                {formatDisplay(startHour12, startMinute, startIsPm)}
              </AppText>
            </Pressable>

            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTarget === 'end' }}
              onPress={() => {
                setActiveTarget('end');
                setDialMode('hours');
              }}
              style={[
                styles.tabBtn,
                activeTarget === 'end' && {
                  backgroundColor: colors.accent,
                  shadowColor: colors.accent,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 3,
                },
              ]}
            >
              <AppText variant="caption" color={activeTarget === 'end' ? 'accentText' : 'muted'} style={{ fontSize: 10, fontWeight: '700' }}>
                END TIME
              </AppText>
              <AppText
                variant="bodyBold"
                color={activeTarget === 'end' ? 'accentText' : 'primary'}
                style={{ fontSize: 15 }}
              >
                {formatDisplay(endHour12, endMinute, endIsPm)}
              </AppText>
            </Pressable>
          </View>

          {/* Digital readout & Mode selection */}
          <View style={styles.readoutRow}>
            <View style={styles.digitsRow}>
              {/* Hour pill */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Set hour"
                onPress={() => setDialMode('hours')}
                style={[
                  styles.digitBox,
                  {
                    backgroundColor: dialMode === 'hours' ? colors.accentSubtle : colors.surfaceSubtle,
                    borderColor: dialMode === 'hours' ? colors.accent : colors.border,
                  },
                ]}
              >
                <AppText
                  variant="h1"
                  color={dialMode === 'hours' ? 'accent' : 'primary'}
                  style={{ fontSize: 26 }}
                >
                  {String(activeHour).padStart(2, '0')}
                </AppText>
                <AppText variant="caption" color={dialMode === 'hours' ? 'accent' : 'muted'} style={{ fontSize: 10, fontWeight: '700' }}>
                  HOUR
                </AppText>
              </Pressable>

              <AppText variant="h1" color="muted" style={{ paddingHorizontal: 4 }}>
                :
              </AppText>

              {/* Minute pill */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Set minute"
                onPress={() => setDialMode('minutes')}
                style={[
                  styles.digitBox,
                  {
                    backgroundColor: dialMode === 'minutes' ? colors.accentSubtle : colors.surfaceSubtle,
                    borderColor: dialMode === 'minutes' ? colors.accent : colors.border,
                  },
                ]}
              >
                <AppText
                  variant="h1"
                  color={dialMode === 'minutes' ? 'accent' : 'primary'}
                  style={{ fontSize: 26 }}
                >
                  {String(activeMin).padStart(2, '0')}
                </AppText>
                <AppText variant="caption" color={dialMode === 'minutes' ? 'accent' : 'muted'} style={{ fontSize: 10, fontWeight: '700' }}>
                  MIN
                </AppText>
              </Pressable>
            </View>

            {/* AM / PM Toggle */}
            <View style={[styles.amPmWrap, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
              <Pressable
                onPress={() => handleToggleAmPm(false)}
                style={[
                  styles.amPmBtn,
                  !activeIsPm && { backgroundColor: colors.accent },
                ]}
              >
                <AppText
                  variant="captionBold"
                  color={!activeIsPm ? 'accentText' : 'secondary'}
                >
                  AM
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => handleToggleAmPm(true)}
                style={[
                  styles.amPmBtn,
                  activeIsPm && { backgroundColor: colors.accent },
                ]}
              >
                <AppText
                  variant="captionBold"
                  color={activeIsPm ? 'accentText' : 'secondary'}
                >
                  PM
                </AppText>
              </Pressable>
            </View>
          </View>

          {/* Analog Watch Dial */}
          <View style={styles.watchContainer}>
            <View
              style={[
                styles.watchDial,
                {
                  backgroundColor: isDark ? '#141824' : '#F1F5F9',
                  borderColor: isDark ? '#2D3748' : '#CBD5E1',
                },
              ]}
            >
              {/* Pivot dot */}
              <View style={[styles.pivotDot, { backgroundColor: colors.accent }]} />

              {/* Hand indicator line (SVG-free line from center) */}
              <View
                style={[
                  styles.handLine,
                  {
                    backgroundColor: colors.accent,
                    transform: [
                      { rotate: `${(currentAngle * 180) / Math.PI}deg` },
                    ],
                  },
                ]}
              />

              {/* Numbers arranged around the dial */}
              {CLOCK_POSITIONS.map(({ num, x, y }) => {
                const label = dialMode === 'hours' ? String(num) : String((num % 12) * 5).padStart(2, '0');
                const isSelected =
                  dialMode === 'hours'
                    ? activeHour === num
                    : activeMin === (num % 12) * 5;

                return (
                  <Pressable
                    key={num}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${label}`}
                    onPress={() => {
                      if (dialMode === 'hours') {
                        handleSelectHour(num);
                      } else {
                        handleSelectMinute((num % 12) * 5);
                      }
                    }}
                    style={[
                      styles.dialNumberBtn,
                      {
                        left: x,
                        top: y,
                        backgroundColor: isSelected ? colors.accent : 'transparent',
                        borderColor: isSelected ? colors.accent : 'transparent',
                      },
                    ]}
                  >
                    <AppText
                      variant="bodyBold"
                      color={isSelected ? 'accentText' : 'primary'}
                      style={{ fontSize: 14 }}
                    >
                      {label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            {/* Quick minute step adjustments */}
            <View style={styles.stepAdjustRow}>
              <Pressable
                onPress={() => handleAdjustMinute(-5)}
                style={[styles.stepBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
              >
                <AppText variant="captionBold" color="secondary">-5m</AppText>
              </Pressable>
              <Pressable
                onPress={() => handleAdjustMinute(-1)}
                style={[styles.stepBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
              >
                <AppText variant="captionBold" color="secondary">-1m</AppText>
              </Pressable>
              <View style={styles.modeIndicator}>
                <Sparkles size={12} color={colors.accent} />
                <AppText variant="caption" color="accent" style={{ fontWeight: '700' }}>
                  {dialMode === 'hours' ? 'Tap an hour (1–12)' : 'Tap minute (00–55)'}
                </AppText>
              </View>
              <Pressable
                onPress={() => handleAdjustMinute(1)}
                style={[styles.stepBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
              >
                <AppText variant="captionBold" color="secondary">+1m</AppText>
              </Pressable>
              <Pressable
                onPress={() => handleAdjustMinute(5)}
                style={[styles.stepBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
              >
                <AppText variant="captionBold" color="secondary">+5m</AppText>
              </Pressable>
            </View>
          </View>

          {/* Quick Presets */}
          <View style={styles.presetSection}>
            <AppText variant="caption" color="secondary" style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.8 }}>
              QUICK 12H / 15H PRESETS
            </AppText>
            <View style={styles.presetsRow}>
              {PRESETS.map((p) => {
                const isMatch = currentStartTime24 === p.start && currentEndTime24 === p.end;
                return (
                  <Pressable
                    key={p.label}
                    onPress={() => handleApplyPreset(p.start, p.end)}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: isMatch ? colors.accentSubtle : colors.surfaceSubtle,
                        borderColor: isMatch ? colors.accent : colors.border,
                      },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      color={isMatch ? 'accent' : 'secondary'}
                      style={{ fontSize: 11, fontWeight: isMatch ? '700' : '500' }}
                    >
                      {p.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Validation banner */}
          {errorMsg || !validation.isValid ? (
            <View style={[styles.statusBanner, { backgroundColor: colors.dangerBg, borderColor: colors.danger }]}>
              <AlertCircle size={14} color={colors.danger} />
              <AppText variant="caption" color="danger" style={{ flex: 1 }}>
                {errorMsg || validation.error || 'End time must follow start time by at least 30m.'}
              </AppText>
            </View>
          ) : (
            <View style={[styles.statusBanner, { backgroundColor: colors.successBg, borderColor: colors.success }]}>
              <Check size={14} color={colors.success} />
              <AppText variant="caption" color="success" style={{ flex: 1 }}>
                Active schedule: {currentStartTime24} to {currentEndTime24} ({Math.round(((validation.endMinutes || 0) - (validation.startMinutes || 0)) / 60)}h window)
              </AppText>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <Button
              label="Cancel"
              variant="ghost"
              size="md"
              onPress={onClose}
              style={{ flex: 1 }}
            />
            <Button
              label={isSaving ? 'Saving...' : 'Save Active Hours'}
              variant="primary"
              size="md"
              onPress={handleSave}
              disabled={!validation.isValid || isSaving}
              style={{ flex: 1.4 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 390,
    borderWidth: 1.5,
    padding: 18,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  closeBtn: {
    padding: 6,
  },
  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 9,
    gap: 1,
  },
  // Readout
  readoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  digitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  digitBox: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  amPmWrap: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 2,
    gap: 2,
  },
  amPmBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Watch Dial
  watchContainer: {
    alignItems: 'center',
    gap: 10,
  },
  watchDial: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    borderRadius: DIAL_SIZE / 2,
    borderWidth: 2,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pivotDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    zIndex: 10,
  },
  handLine: {
    position: 'absolute',
    width: 2.5,
    height: RADIUS - 10,
    top: DIAL_SIZE / 2 - (RADIUS - 10),
    left: DIAL_SIZE / 2 - 1.25,
    borderRadius: 2,
    transformOrigin: 'bottom center',
    opacity: 0.85,
  },
  dialNumberBtn: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  stepAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  // Presets
  presetSection: {
    gap: 6,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  // Banner
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  // Action Row
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
});
