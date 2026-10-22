import React from 'react';
import {
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
  ActivityIndicator,
} from 'react-native';
import { useAppTheme } from '../../theme/ThemeProvider';

export type IconButtonVariant = 'default' | 'filled' | 'outline' | 'ghost';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  disabled?: boolean;
  loading?: boolean;
  rounded?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  accessibilityLabel,
  variant = 'default',
  size = 'md',
  disabled = false,
  loading = false,
  rounded = true,
  style,
  testID,
}) => {
  const { colors, radii } = useAppTheme();

  const isDisabled = disabled || loading;

  const dimension = size === 'sm' ? 36 : size === 'lg' ? 52 : 44;

  const getBackgroundColor = (pressed: boolean): string => {
    if (isDisabled) return colors.surfaceSubtle;
    switch (variant) {
      case 'filled':
        return pressed ? colors.accentHover : colors.accent;
      case 'default':
        return pressed ? colors.border : colors.surfaceSubtle;
      case 'outline':
      case 'ghost':
        return pressed ? colors.surfaceSubtle : 'transparent';
      default:
        return colors.surfaceSubtle;
    }
  };

  const getBorderColor = (): string => {
    if (variant === 'outline') {
      return colors.border;
    }
    return 'transparent';
  };

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          width: dimension,
          height: dimension,
          borderRadius: rounded ? dimension / 2 : radii.md,
          backgroundColor: getBackgroundColor(pressed),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 1 : 0,
          opacity: isDisabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'filled' ? colors.accentText : colors.accent}
        />
      ) : (
        icon
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
