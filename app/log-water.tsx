import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Keyboard,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { X, Droplets, Check, Clock, Sparkles, CupSoda, GlassWater } from 'lucide-react-native';
import { Screen, AppText, Button, Card, IconButton } from '../src/components/ui';
import { useAppTheme } from '../src/theme/ThemeProvider';

const PRESET_AMOUNTS = [
  { val: 150, label: 'Small Cup' },
  { val: 250, label: 'Glass' },
  { val: 350, label: 'Mug' },
  { val: 500, label: 'Bottle' },
  { val: 750, label: 'Flask' },
  { val: 1000, label: 'Pitcher' },
];

export default function LogWaterModal() {
  const router = useRouter();
  const { colors, isDark, radii } = useAppTheme();

  const [amount, setAmount] = useState<string>('250');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const parsedAmount = parseInt(amount, 10);
  const isValid = !isNaN(parsedAmount) && parsedAmount > 0 && parsedAmount <= 5000;

  // Animated fill proportion (clamped to 1000 ml for visualization)
  const visualFill = Math.min(1, Math.max(0.1, (parsedAmount || 0) / 1000));

  const handleSave = () => {
    if (!isValid || isSubmitting) return;

    Keyboard.dismiss();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
      setTimeout(() => {
        router.back();
      }, 700);
    }, 350);
  };

  const handleSelectQuick = (val: number) => {
    setAmount(val.toString());
  };

  return (
    <Screen
      scrollable
      safeAreaEdges={['top', 'bottom']}
      keyboardOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <View style={styles.container}>
        {/* Top Header */}
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
                Log Hydration
              </AppText>
              <AppText variant="subtext" color="secondary">
                Record intake in millilitres
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

        {/* Realistic Interactive Fluid Vessel Preview */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.flaskContainer}>
          <View
            style={[
              styles.flaskOuter,
              {
                borderColor: colors.borderGlow,
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
              <LinearGradient
                colors={colors.waterGradient}
                style={StyleSheet.absoluteFill}
              />
            </View>

            <View style={styles.flaskCenterText}>
              <TextInput
                value={amount}
                onChangeText={setAmount}
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
        </Animated.View>

        {/* Quick Presets Grid */}
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
                  onPress={() => handleSelectQuick(item.val)}
                  style={({ pressed }) => [
                    styles.presetPill,
                    {
                      backgroundColor: isSelected
                        ? colors.accent
                        : colors.surface,
                      borderColor: isSelected
                        ? colors.accent
                        : colors.border,
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

        {/* Timestamp Info */}
        <Card variant="subtle" style={styles.timeCard}>
          <View style={styles.timeRow}>
            <Clock size={16} color={colors.textSecondary} />
            <AppText variant="subtext" color="secondary">
              Timestamp: Today, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </AppText>
          </View>
        </Card>

        {/* Action Button */}
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
                {parsedAmount} ml logged successfully!
              </AppText>
            </View>
          ) : (
            <Button
              label={`Save ${isValid ? `${parsedAmount} ml` : 'Entry'}`}
              onPress={handleSave}
              disabled={!isValid || isSubmitting}
              loading={isSubmitting}
              variant="primary"
              size="lg"
              fullWidth
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
    paddingBottom: 32,
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
  timeCard: {
    paddingVertical: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
