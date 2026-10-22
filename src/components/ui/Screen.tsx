import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '../../theme/ThemeProvider';

export interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  safeAreaEdges?: ('top' | 'bottom' | 'left' | 'right')[];
  header?: React.ReactNode;
  footer?: React.ReactNode;
  keyboardOffset?: number;
  testID?: string;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  scrollable = false,
  style,
  contentContainerStyle,
  safeAreaEdges = ['top'],
  header,
  footer,
  keyboardOffset = 0,
  testID,
}) => {
  const insets: EdgeInsets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const containerPadding: ViewStyle = {
    paddingTop: safeAreaEdges.includes('top') ? insets.top : 0,
    paddingBottom: safeAreaEdges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: safeAreaEdges.includes('left') ? insets.left : 0,
    paddingRight: safeAreaEdges.includes('right') ? insets.right : 0,
  };

  const backgroundColor = colors.background;

  return (
    <View
      testID={testID}
      style={[styles.container, { backgroundColor }, containerPadding, style]}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {header}

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={keyboardOffset}
      >
        {scrollable ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.staticContent, contentContainerStyle]}>{children}</View>
        )}
      </KeyboardAvoidingView>

      {footer}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  staticContent: {
    flex: 1,
  },
});
