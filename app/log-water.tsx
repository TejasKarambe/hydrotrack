import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Keyboard,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { X, Droplets, Check, Clock, Trash2, Calendar } from 'lucide-react-native';
import { Screen, AppText, Button, Card, IconButton } from '../src/components/ui';
import { useAppTheme } from '../src/theme/ThemeProvider';
import { useHydration } from '../src/context/HydrationContext';
import { validateWaterAmount } from '../src/types/database';
import { formatLocalTime } from '../src/utils/dateUtils';

const PRESET_AMOUNTS = [
  { val: 150, label: 'Small Cup' },
  { val: 250, label: 'Glass' },
  { val: 350, label: 'Mug' },
  { val: 500, label: 'Bottle' },
  { val: 750, label: 'Flask' },
  { val: 1000, label: 'Pitcher' },
];

const TIME_OFFSETS = [
  { label: 'Right now', minutesAgo: 0 },
  { label: '15m ago', minutesAgo: 15 },
  { label: '30m ago', minutesAgo: 30 },
  { label: '1h ago', minutesAgo: 60 },
  { label: '2h ago', minutesAgo: 120 },
];

export default function LogWaterModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    editId?: string;
    initialAmount?: string;
    initialTime?: string;
  }>();

  const isEditing = Boolean(params.editId);
  const editId = params.editId;

  const { colors, isDark, radii } = useAppTheme();
  const { logCustomAmount, editLog, deleteLog } = useHydration();

  const [amountStr, setAmountStr] = useState<string>(params.initialAmount || '250');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedMinutesAgo, setSelectedMinutesAgo] = useState<number>(0);
  const [customConsumedDate, setCustomConsumedDate] = useState<Date>(
    params.initialTime ? new Date(params.initialTime) : new Date()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const parsedAmount = parseInt(amountStr, 10);
  const visualFill = Math.min(1, Math.max(0.08, (parsedAmount || 0) / 1000));

  const handleSelectTimeOffset = (minutesAgo: number) => {
    setSelectedMinutesAgo(minutesAgo);
    const d = new Date();
    d.setMinutes(d.getMinutes() - minutesAgo);
    setCustomConsumedDate(d);
  };

  const handleSave = async () => {
    Keyboard.dismiss();
    const validation = validateWaterAmount(amountStr);

    if (!validation.isValid || !validation.value) {
      setErrorMessage(validation.error || 'Please enter a valid amount.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (isEditing && editId) {
        await editLog(editId, validation.value, customConsumedDate);
      } else {
        await logCustomAmount(validation.value, customConsumedDate);
      }

      setSuccess(true);
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (err) {
      console.error('Save failed:', err);
      Alert.alert('Error', 'Failed to save water intake. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!editId) return;
    Alert.alert(
      'Delete Record',
      'Are you sure you want to delete this water intake entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLog(editId);
              router.back();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete record.');
            }
          },
        },
      ]
    );
  };

  return (
    <Screen
      scrollable
      safeAreaEdges={['top', 'bottom']}
      keyboardOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <View style={styles.container}>
        {/* Top Navigation */}
        <View style={styles.topBar}>
          <View style={styles.titleRow}>
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: colors.accentSubtle, borderColor: colors.borderGlow },
              ]}
            >
              <Droplets size={20} color={colors.accent} strokeWidth={2.5} />
            </View>
            <View>
              <AppText variant="h2" color="primary">
                {isEditing ? 'Edit Intake' : 'Log Water'}
              </AppText>
              <AppText variant="subtext" color="secondary">
                {isEditing ? 'Update logged millilitres' : 'Record volume in millilitres'}
              </AppText>
            </View>
          </View>

          <IconButton
            icon={<X size={20} color={colors.textPrimary} />}
            onPress={() => router.back()}
            accessibilityLabel="Close log water modal"
            variant="default"
            size="sm"
          />
        </View>

        {/* Live Fluid Flask Container */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.flaskContainer}>
          <View
            style={[
              styles.flaskOuter,
              {
                borderColor: errorMessage ? colors.danger : colors.borderGlow,
                backgroundColor: isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(240, 249, 255, 0.7)',
              },
            ]}
          >
            {/* Live animated fluid inside the flask */}
            <View
              style={[
                styles.flaskFluid,
                {
                  height: `${visualFill * 100}%`,
                },
              ]}
            >
              <LinearGradient colors={colors.waterGradient} style={StyleSheet.absoluteFill} />
            </View>

            <View style={styles.flaskCenterText}>
              <TextInput
                value={amountStr}
                onChangeText={(text) => {
                  setAmountStr(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                keyboardType="numeric"
                maxLength={4}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.largeAmountInput,
                  { color: colors.textPrimary },
                ]}
                selectTextOnFocus
                accessibilityLabel="Intake amount in millilitres"
              />
              <AppText variant="h3" color="secondary" style={styles.mlUnit}>
                ml
              </AppText>
            </View>
          </View>

          {errorMessage && (
            <AppText variant="caption" color="danger" style={styles.errorText}>
              {errorMessage}
            </AppText>
          )}
        </Animated.View>

        {/* Popular Presets */}
        <View style={styles.presetsSection}>
          <AppText variant="caption" color="secondary" style={styles.presetsLabel}>
            POPULAR VOLUMES
          </AppText>

          <View style={styles.presetsGrid}>
            {PRESET_AMOUNTS.map((item) => {
              const isSelected = parsedAmount === item.val;
              return (
                <Pressable
                  key={item.val}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${item.val} ml`}
                  onPress={() => {
                    setAmountStr(item.val.toString());
                    if (errorMessage) setErrorMessage(null);
                  }}
                  style={({ pressed }) => [
                    styles.presetPill,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.surface,
                      borderColor: isSelected ? colors.accent : colors.border,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <AppText
                    variant="bodyBold"
                    color={isSelected ? 'accentText' : 'primary'}
                  >
                    +{item.val}
                  </AppText>
                  <AppText
                    variant="caption"
                    color={isSelected ? 'accentText' : 'secondary'}
                    style={styles.pillSubtext}
                  >
                    {item.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Optional Timestamp Offset Selection */}
        <View style={styles.presetsSection}>
          <View style={styles.timeLabelRow}>
            <Clock size={14} color={colors.textSecondary} />
            <AppText variant="caption" color="secondary" style={styles.presetsLabel}>
              TIME CONSUMED
            </AppText>
          </View>

          <View style={styles.timeOffsetsRow}>
            {TIME_OFFSETS.map((t) => {
              const isSelected = selectedMinutesAgo === t.minutesAgo;
              return (
                <Pressable
                  key={t.label}
                  accessibilityRole="button"
                  accessibilityLabel={`Set time to ${t.label}`}
                  onPress={() => handleSelectTimeOffset(t.minutesAgo)}
                  style={({ pressed }) => [
                    styles.timeChip,
                    {
                      backgroundColor: isSelected ? colors.accentSubtle : colors.surface,
                      borderColor: isSelected ? colors.accent : colors.border,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <AppText
                    variant="caption"
                    color={isSelected ? 'accent' : 'secondary'}
                    style={isSelected ? styles.selectedTimeChipText : undefined}
                  >
                    {t.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          <Card variant="subtle" style={styles.activeTimeCard}>
            <AppText variant="subtext" color="secondary">
              Logged for: {customConsumedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({customConsumedDate.toLocaleDateString([], { month: 'short', day: 'numeric' })})
            </AppText>
          </Card>
        </View>

        {/* Action Buttons */}
        <View style={styles.footer}>
          {success ? (
            <View
              style={[
                styles.successBanner,
                { backgroundColor: colors.successBg, borderRadius: radii.md },
              ]}
            >
              <Check size={20} color={colors.success} strokeWidth={3} />
              <AppText variant="bodyBold" color="success">
                {isEditing ? 'Updated successfully!' : `${parsedAmount} ml logged successfully!`}
              </AppText>
            </View>
          ) : (
            <Button
              label={isEditing ? 'Update Entry' : `Save ${parsedAmount ? `${parsedAmount} ml` : 'Entry'}`}
              onPress={handleSave}
              disabled={isSubmitting}
              loading={isSubmitting}
              variant="primary"
              size="lg"
              fullWidth
            />
          )}

          {isEditing && (
            <Button
              label="Delete Entry"
              onPress={handleDelete}
              variant="danger"
              size="md"
              fullWidth
              leftIcon={<Trash2 size={16} color={colors.danger} />}
            />
          )}

          <Button
            label="Cancel"
            onPress={() => router.back()}
            variant="ghost"
            size="md"
            fullWidth
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
    gap: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  flaskContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  flaskOuter: {
    width: 200,
    height: 180,
    borderRadius: 28,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  },
  flaskFluid: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0.85,
  },
  flaskCenterText: {
    flexDirection: 'row',
    alignItems: 'baseline',
    zIndex: 10,
    gap: 6,
  },
  largeAmountInput: {
    fontSize: 52,
    fontWeight: '800',
    minWidth: 100,
    textAlign: 'center',
    includeFontPadding: false,
  },
  mlUnit: {
    fontWeight: '700',
    paddingBottom: 6,
  },
  errorText: {
    marginTop: 8,
    fontWeight: '600',
  },
  presetsSection: {
    gap: 10,
  },
  presetsLabel: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetPill: {
    flexBasis: '31%',
    flexGrow: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  pillSubtext: {
    fontSize: 10,
  },
  timeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeOffsetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  selectedTimeChipText: {
    fontWeight: '700',
  },
  activeTimeCard: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  footer: {
    gap: 10,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
});
