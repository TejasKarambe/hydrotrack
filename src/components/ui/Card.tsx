import React from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useAppTheme } from '../../theme/ThemeProvider';

export type CardVariant = 'default' | 'subtle' | 'outline' | 'elevated';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 16,
  onPress,
  style,
  testID,
  accessibilityLabel,
}) => {
  const { colors, radii } = useAppTheme();

  const getBackgroundColor = (): string => {
    switch (variant) {
      case 'subtle':
        return colors.surfaceSubtle;
      case 'outline':
        return 'transparent';
      case 'elevated':
        return colors.surfaceElevated;
      case 'default':
      default:
        return colors.surface;
    }
  };

  const getBorderColor = (): string => {
    switch (variant) {
      case 'outline':
        return colors.border;
      case 'subtle':
        return colors.borderSubtle;
      case 'default':
      case 'elevated':
      default:
        return colors.border;
    }
  };

  const cardStyle: ViewStyle = {
    backgroundColor: getBackgroundColor(),
    borderColor: getBorderColor(),
    borderWidth: 1,
    borderRadius: radii.lg,
    padding,
  };

  if (onPress) {
    return (
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [
          styles.base,
          cardStyle,
          pressed && { opacity: 0.85 },
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View testID={testID} style={[styles.base, cardStyle, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
