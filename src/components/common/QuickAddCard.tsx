import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../theme/ThemeProvider';
import { AppText } from '../ui/AppText';
import { Droplets, GlassWater, CupSoda, Milk, Sparkles } from 'lucide-react-native';

interface QuickAddCardProps {
  amount: number;
  label: string;
  sublabel: string;
  iconType: 'cup' | 'glass' | 'bottle';
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const QuickAddCard: React.FC<QuickAddCardProps> = ({
  amount,
  label,
  sublabel,
  iconType,
  onPress,
}) => {
  const { colors, isDark, radii } = useAppTheme();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const renderIcon = () => {
    switch (iconType) {
      case 'cup':
        return <CupSoda size={22} color={colors.accent} strokeWidth={2.4} />;
      case 'glass':
        return <GlassWater size={24} color={colors.accent} strokeWidth={2.4} />;
      case 'bottle':
        return <Droplets size={26} color={colors.accent} strokeWidth={2.4} />;
      default:
        return <GlassWater size={24} color={colors.accent} strokeWidth={2.4} />;
    }
  };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`Quick add ${amount} millilitres of water`}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={[
        styles.container,
        {
          borderRadius: radii.lg,
          borderColor: isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(2, 132, 199, 0.15)',
        },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={
          isDark
            ? ['rgba(17, 24, 39, 0.95)', 'rgba(30, 41, 59, 0.85)']
            : ['#FFFFFF', '#F0F9FF']
        }
        style={[styles.gradientBg, { borderRadius: radii.lg }]}
      >
        {/* Soft glowing icon circle */}
        <View
          style={[
            styles.iconWrapper,
            {
              backgroundColor: colors.accentSubtle,
              borderColor: colors.borderGlow,
            },
          ]}
        >
          {renderIcon()}
        </View>

        {/* Volume & Details */}
        <View style={styles.textColumn}>
          <AppText variant="h3" color="primary" style={styles.amountText}>
            +{amount}
          </AppText>
          <AppText variant="caption" color="secondary" style={styles.labelText}>
            {label}
          </AppText>
          <AppText variant="subtext" color="muted" style={styles.sublabelText}>
            {sublabel}
          </AppText>
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderWidth: 1.5,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  gradientBg: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  textColumn: {
    alignItems: 'center',
    gap: 1,
  },
  amountText: {
    fontSize: 17,
    fontWeight: '800',
  },
  labelText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sublabelText: {
    fontSize: 10,
  },
});
