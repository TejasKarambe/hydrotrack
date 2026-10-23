import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { palette, spacing, radii, typography, ThemeColors, ThemeMode, ThemePreference } from './tokens';
import { getSettings, updateSetting } from '../database/settingsRepository';

const LEGACY_STORAGE_KEY = '@hydrotrack_theme_preference';

interface ThemeContextType {
  themePreference: ThemePreference;
  resolvedTheme: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  setThemePreference: (pref: ThemePreference) => Promise<void>;
  isLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const deviceColorScheme = useDeviceColorScheme() ?? 'light';
  const { setColorScheme: setNWColorScheme } = useNativeWindColorScheme();

  const [themePreference, setPreferenceState] = useState<ThemePreference>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted theme preference on mount from SQLite (with AsyncStorage migration check)
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const settings = await getSettings();
        if (isMounted && settings.theme_mode) {
          setPreferenceState(settings.theme_mode);
        }
      } catch (err) {
        // Fallback to AsyncStorage during initial migration
        try {
          const saved = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
          if (saved === 'light' || saved === 'dark' || saved === 'system') {
            if (isMounted) setPreferenceState(saved);
          }
        } catch {
          // ignore
        }
      } finally {
        if (isMounted) {
          setIsLoaded(true);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute resolved theme ('light' or 'dark')
  const resolvedTheme: ThemeMode = useMemo(() => {
    if (themePreference === 'system') {
      return deviceColorScheme === 'dark' ? 'dark' : 'light';
    }
    return themePreference;
  }, [themePreference, deviceColorScheme]);

  // Synchronize NativeWind colorScheme with resolved theme
  useEffect(() => {
    setNWColorScheme(resolvedTheme);
  }, [resolvedTheme, setNWColorScheme]);

  const setThemePreference = async (pref: ThemePreference) => {
    try {
      setPreferenceState(pref);
      // Persist in SQLite
      await updateSetting('theme_mode', pref);
      // Also sync to AsyncStorage for fast splash boot
      await AsyncStorage.setItem(LEGACY_STORAGE_KEY, pref);
    } catch (err) {
      console.warn('Failed to persist theme preference:', err);
    }
  };

  const isDark = resolvedTheme === 'dark';
  const colors = palette[resolvedTheme];

  const value = useMemo<ThemeContextType>(
    () => ({
      themePreference,
      resolvedTheme,
      isDark,
      colors,
      spacing,
      radii,
      typography,
      setThemePreference,
      isLoaded,
    }),
    [themePreference, resolvedTheme, isDark, colors, isLoaded]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return ctx;
};
