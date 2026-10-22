import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle, StyleProp, Platform } from 'react-native';
import { useAppTheme } from '../../theme/ThemeProvider';
import { typography, fontFamilies } from '../../theme/tokens';

export type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'subtitle'
  | 'body'
  | 'bodyBold'
  | 'subtext'
  | 'caption'
  | 'numericHero'
  | 'numericLarge'
  | 'numericMedium';

export type TextColor =
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'accent'
  | 'accentText'
  | 'danger'
  | 'success'
  | 'warning'
  | 'white';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: TextColor;
  align?: 'left' | 'center' | 'right';
  style?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}

export const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  color = 'primary',
  align = 'left',
  style,
  children,
  ...props
}) => {
  const { colors } = useAppTheme();

  const resolveColor = (): string => {
    switch (color) {
      case 'primary':
        return colors.textPrimary;
      case 'secondary':
        return colors.textSecondary;
      case 'muted':
        return colors.textMuted;
      case 'accent':
        return colors.accent;
      case 'accentText':
        return colors.accentText;
      case 'danger':
        return colors.danger;
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'white':
        return '#FFFFFF';
      default:
        return colors.textPrimary;
    }
  };

  const getFontFamily = (): string => {
    switch (variant) {
      case 'numericHero':
        return fontFamilies.extraBold;
      case 'h1':
      case 'h2':
      case 'numericLarge':
      case 'numericMedium':
        return fontFamilies.bold;
      case 'h3':
      case 'bodyBold':
        return fontFamilies.semiBold;
      case 'subtitle':
      case 'caption':
        return fontFamilies.medium;
      case 'body':
      case 'subtext':
      default:
        return fontFamilies.regular;
    }
  };

  const fontStyle = typography[variant];
  const textColor = resolveColor();
  const fontFamily = getFontFamily();

  return (
    <Text
      allowFontScaling
      style={[
        styles.base,
        fontStyle,
        {
          fontFamily,
          color: textColor,
          textAlign: align,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});
