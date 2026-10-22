import React from 'react';
import {
  Pressable,
  ActivityIndicator,
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useAppTheme } from '../../theme/ThemeProvider';
import { AppText, TextColor } from './AppText';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accentSubtle';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  accessibilityLabel,
  testID,
}) => {
  const { colors, radii } = useAppTheme();

  const isDisabled = disabled || loading;

  const getBackgroundColor = (pressed: boolean): string => {
    if (isDisabled) {
      return variant === 'outline' || variant === 'ghost' ? 'transparent' : colors.surfaceSubtle;
    }
    switch (variant) {
      case 'primary':
        return pressed ? colors.accentHover : colors.accent;
      case 'secondary':
        return pressed ? colors.border : colors.surfaceSubtle;
      case 'outline':
      case 'ghost':
        return pressed ? (colors.accentSubtle) : 'transparent';
      case 'danger':
        return pressed ? colors.danger : colors.dangerBg;
      case 'accentSubtle':
        return pressed ? colors.accentMuted : colors.accentSubtle;
      default:
        return colors.accent;
    }
  };

  const getBorderColor = (): string => {
    if (variant === 'outline') {
      return isDisabled ? colors.border : colors.accent;
    }
    return 'transparent';
  };

  const getTextColor = (): TextColor => {
    if (isDisabled) return 'muted';
    switch (variant) {
      case 'primary':
        return 'accentText';
      case 'secondary':
        return 'primary';
      case 'outline':
      case 'ghost':
        return 'accent';
      case 'danger':
        return 'danger';
      case 'accentSubtle':
        return 'accent';
      default:
        return 'accentText';
    }
  };

  const sizeStyles = {
    sm: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      minHeight: 36,
      borderRadius: radii.md,
      gap: 6,
    },
    md: {
      paddingVertical: 12,
      paddingHorizontal: 18,
      minHeight: 48,
      borderRadius: radii.md,
      gap: 8,
    },
    lg: {
      paddingVertical: 15,
      paddingHorizontal: 24,
      minHeight: 56,
      borderRadius: radii.lg,
      gap: 10,
    },
  }[size];

  const textSizeVariant = size === 'sm' ? 'subtext' : size === 'lg' ? 'bodyBold' : 'bodyBold';

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        sizeStyles,
        {
          backgroundColor: getBackgroundColor(pressed),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 1.5 : 0,
          opacity: isDisabled ? 0.6 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.accentText : colors.accent}
        />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
          <AppText
            variant={textSizeVariant}
            color={getTextColor()}
            style={styles.label}
          >
            {label}
          </AppText>
          {rightIcon && <View style={styles.iconContainer}>{rightIcon}</View>}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
  },
});
