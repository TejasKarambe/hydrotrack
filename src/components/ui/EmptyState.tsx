import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useAppTheme } from '../../theme/ThemeProvider';
import { AppText } from './AppText';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  style,
  testID,
}) => {
  const { colors, radii } = useAppTheme();

  return (
    <View testID={testID} style={[styles.container, style]}>
      {icon && (
        <View
          style={[
            styles.iconWrapper,
            {
              backgroundColor: colors.surfaceSubtle,
              borderRadius: radii.full,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          {icon}
        </View>
      )}

      <AppText variant="h3" color="primary" align="center" style={styles.title}>
        {title}
      </AppText>

      <AppText
        variant="subtext"
        color="secondary"
        align="center"
        style={styles.message}
      >
        {message}
      </AppText>

      {actionLabel && onAction && (
        <View style={styles.actionWrapper}>
          <Button
            label={actionLabel}
            onPress={onAction}
            variant="outline"
            size="sm"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },
  title: {
    marginBottom: 8,
  },
  message: {
    maxWidth: 280,
    marginBottom: 16,
  },
  actionWrapper: {
    marginTop: 8,
  },
});
