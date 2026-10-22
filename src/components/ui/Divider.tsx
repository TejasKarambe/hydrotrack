import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useAppTheme } from '../../theme/ThemeProvider';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  spacing?: number;
  subtle?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  spacing = 8,
  subtle = false,
  style,
}) => {
  const { colors } = useAppTheme();

  const borderColor = subtle ? colors.borderSubtle : colors.border;

  if (orientation === 'vertical') {
    return (
      <View
        style={[
          styles.vertical,
          {
            backgroundColor: borderColor,
            marginHorizontal: spacing,
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.horizontal,
        {
          backgroundColor: borderColor,
          marginVertical: spacing,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  horizontal: {
    height: 1,
    width: '100%',
  },
  vertical: {
    width: 1,
    height: '100%',
  },
});
