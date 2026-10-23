import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../theme/ThemeProvider';
import { AppText } from '../ui/AppText';
import { Droplet } from 'lucide-react-native';

import { formatVolume } from '../../utils/hydrationCalculations';

interface AnimatedWaterVesselProps {
  currentMl: number;
  goalMl: number;
  size?: number;
  unit?: 'ml' | 'l';
}

export const AnimatedWaterVessel: React.FC<AnimatedWaterVesselProps> = ({
  currentMl,
  goalMl,
  size = 230,
  unit = 'ml',
}) => {
  const { colors, isDark } = useAppTheme();

  const percentage = Math.min(100, Math.max(0, Math.round((currentMl / goalMl) * 100)));

  // Reanimated shared values
  const fillAnim = useSharedValue(percentage / 100);
  const waveOffset1 = useSharedValue(0);
  const waveOffset2 = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  // Animate fill level smoothly with spring physics whenever currentMl changes
  useEffect(() => {
    fillAnim.value = withSpring(percentage / 100, {
      damping: 15,
      stiffness: 90,
    });
    // Trigger subtle celebratory pulse when water changes
    pulseScale.value = withSequence(
      withTiming(1.04, { duration: 180, easing: Easing.out(Easing.ease) }),
      withSpring(1, { damping: 12 })
    );
  }, [percentage, fillAnim, pulseScale]);

  // Continuous subtle living water wave ripple
  useEffect(() => {
    waveOffset1.value = withRepeat(
      withTiming(1, { duration: 2800, easing: Easing.linear }),
      -1,
      false
    );
    waveOffset2.value = withRepeat(
      withTiming(1, { duration: 3800, easing: Easing.linear }),
      -1,
      false
    );
  }, [waveOffset1, waveOffset2]);

  // Wave 1 translation
  const waveStyle1 = useAnimatedStyle(() => {
    const translateX = interpolate(waveOffset1.value, [0, 1], [0, -size]);
    return {
      transform: [{ translateX }],
    };
  });

  // Wave 2 translation (opposing / different speed)
  const waveStyle2 = useAnimatedStyle(() => {
    const translateX = interpolate(waveOffset2.value, [0, 1], [-size, 0]);
    return {
      transform: [{ translateX }],
    };
  });

  // Animated water level height
  const waterContainerStyle = useAnimatedStyle(() => {
    const height = interpolate(fillAnim.value, [0, 1], [16, size + 10]);
    return {
      height,
    };
  });

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Generate continuous SVG wave path with width = 2 * size
  const waveWidth = size * 2;
  const waveHeight = 18;
  const pathD1 = `
    M 0 ${waveHeight}
    Q ${size * 0.25} 0, ${size * 0.5} ${waveHeight}
    T ${size} ${waveHeight}
    T ${size * 1.5} ${waveHeight}
    T ${waveWidth} ${waveHeight}
    V ${size + 40}
    H 0
    Z
  `;

  const pathD2 = `
    M 0 ${waveHeight * 0.8}
    Q ${size * 0.25} ${waveHeight * 1.5}, ${size * 0.5} ${waveHeight * 0.8}
    T ${size} ${waveHeight * 0.8}
    T ${size * 1.5} ${waveHeight * 0.8}
    T ${waveWidth} ${waveHeight * 0.8}
    V ${size + 40}
    H 0
    Z
  `;

  return (
    <Animated.View style={[styles.outerContainer, { width: size, height: size }, pulseStyle]}>
      {/* Outer ambient glow ring */}
      <View
        style={[
          styles.glowRing,
          {
            width: size + 20,
            height: size + 20,
            borderRadius: (size + 20) / 2,
            backgroundColor: colors.accentGlow,
          },
        ]}
      />

      {/* Main Glass Sphere / Vessel */}
      <View
        style={[
          styles.vessel,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: colors.borderGlow,
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.65)' : 'rgba(240, 249, 255, 0.7)',
          },
        ]}
      >
        {/* Living Water Fill Reservoir */}
        <Animated.View style={[styles.waterFillContainer, { width: size }, waterContainerStyle]}>
          {/* Back wave layer */}
          <Animated.View style={[styles.waveLayer, waveStyle2]}>
            <Svg width={waveWidth} height={size + 30} style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="backWaveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor={colors.waterGradient[1]} stopOpacity={0.6} />
                  <Stop offset="100%" stopColor={colors.waterGradient[2]} stopOpacity={0.9} />
                </LinearGradient>
              </Defs>
              <Path d={pathD2} fill="url(#backWaveGrad)" />
            </Svg>
          </Animated.View>

          {/* Front wave layer */}
          <Animated.View style={[styles.waveLayer, waveStyle1]}>
            <Svg width={waveWidth} height={size + 30} style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="frontWaveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor={colors.waterGradient[0]} stopOpacity={0.8} />
                  <Stop offset="100%" stopColor={colors.waterGradient[2]} stopOpacity={0.98} />
                </LinearGradient>
              </Defs>
              <Path d={pathD1} fill="url(#frontWaveGrad)" />
            </Svg>
          </Animated.View>
        </Animated.View>

        {/* Glass reflection gloss overlay (gives realistic 3D liquid depth) */}
        <ExpoLinearGradient
          colors={
            isDark
              ? ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.01)', 'rgba(0, 0, 0, 0.25)']
              : ['rgba(255, 255, 255, 0.55)', 'rgba(255, 255, 255, 0.05)', 'rgba(2, 132, 199, 0.08)']
          }
          style={[styles.glassReflection, { borderRadius: size / 2 }]}
        />

        {/* Center Information Overlay */}
        <View style={styles.centerContent}>
          <View style={[styles.dropletBadge, { backgroundColor: isDark ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.7)' }]}>
            <Droplet size={18} color={colors.accent} strokeWidth={2.8} />
            <AppText variant="caption" color="accent" style={styles.percentText}>
              {percentage}%
            </AppText>
          </View>

          <View style={styles.amountContainer}>
            <AppText variant="numericHero" color="primary" style={styles.numericValue}>
              {formatVolume(currentMl, unit, false)}
            </AppText>
            <AppText variant="caption" color="secondary" style={styles.targetLabel}>
              of {formatVolume(goalMl, unit)}
            </AppText>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 12,
  },
  glowRing: {
    position: 'absolute',
  },
  vessel: {
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  waterFillContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  waveLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
  },
  glassReflection: {
    ...StyleSheet.absoluteFill,
    pointerEvents: 'none',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    gap: 4,
  },
  dropletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  percentText: {
    fontWeight: '800',
    fontSize: 13,
  },
  amountContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  numericValue: {
    fontSize: 44,
    lineHeight: 48,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  targetLabel: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.85,
  },
});
