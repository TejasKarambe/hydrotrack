export type ThemeMode = 'light' | 'dark';
export type ThemePreference = 'system' | 'light' | 'dark';

export interface ThemeColors {
  background: string;
  backgroundGradient: [string, string, string];
  surface: string;
  surfaceSubtle: string;
  surfaceElevated: string;
  surfaceGlass: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderSubtle: string;
  borderGlow: string;
  accent: string;
  accentHover: string;
  accentMuted: string;
  accentSubtle: string;
  accentText: string;
  accentGlow: string;
  waterGradient: [string, string, string];
  waterWaveTop: string;
  waterWaveBottom: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  danger: string;
  dangerBg: string;
  cardShadow: string;
  tabBarBg: string;
  tabBarBorder: string;
  // Neumorphic shadow helpers
  neuShadowLight: string;
  neuShadowDark: string;
}

export const palette: Record<ThemeMode, ThemeColors> = {
  // ─── Soft Neumorphic Light ─────────────────────────────────────────────────
  light: {
    background: '#E7F1F9',
    backgroundGradient: ['#EAF3FB', '#E7F1F9', '#DDE9F4'],
    surface: '#EEF5FC',
    surfaceSubtle: '#E0ECF6',
    surfaceElevated: '#F5FAFF',
    surfaceGlass: 'rgba(231, 241, 249, 0.90)',
    textPrimary: '#26344F',       // Deep navy
    textSecondary: '#7B8387',     // Cool grey
    textMuted: '#A9B4BA',
    border: '#D5E4F0',
    borderSubtle: '#E0ECF6',
    borderGlow: 'rgba(254, 128, 93, 0.30)',
    accent: '#FE805D',            // Warm coral-orange
    accentHover: '#F5664A',
    accentMuted: '#FFD0C4',
    accentSubtle: '#FFECE7',
    accentText: '#FE805D',
    accentGlow: 'rgba(254, 128, 93, 0.28)',
    waterGradient: ['#FFA07A', '#FE805D', '#F5664A'],
    waterWaveTop: 'rgba(254, 128, 93, 0.60)',
    waterWaveBottom: '#F5664A',
    success: '#27AE60',
    successBg: '#D5F0E0',
    warning: '#F39C12',
    warningBg: '#FEF5DC',
    danger: '#E74C3C',
    dangerBg: '#FDDBD8',
    cardShadow: 'rgba(38, 52, 79, 0.10)',
    tabBarBg: 'rgba(231, 241, 249, 0.97)',
    tabBarBorder: '#C8DBE9',
    neuShadowLight: '#FFFFFF',
    neuShadowDark: 'rgba(166, 193, 216, 0.75)',
  },
  // ─── Deep Neumorphic Dark ──────────────────────────────────────────────────
  dark: {
    background: '#1A1F2E',        // Deep navy-slate
    backgroundGradient: ['#1D2335', '#1A1F2E', '#161B29'],
    surface: '#212840',
    surfaceSubtle: '#1C2236',
    surfaceElevated: '#263050',
    surfaceGlass: 'rgba(26, 31, 46, 0.90)',
    textPrimary: '#E8EEF6',
    textSecondary: '#8A97B0',
    textMuted: '#5A677E',
    border: '#2A3350',
    borderSubtle: '#1F2840',
    borderGlow: 'rgba(254, 128, 93, 0.35)',
    accent: '#FE805D',            // Same coral — pops against dark
    accentHover: '#FF9578',
    accentMuted: '#5C2D1E',
    accentSubtle: 'rgba(254, 128, 93, 0.14)',
    accentText: '#FFFFFF',
    accentGlow: 'rgba(254, 128, 93, 0.40)',
    waterGradient: ['#FF9578', '#FE805D', '#F5664A'],
    waterWaveTop: 'rgba(255, 149, 120, 0.65)',
    waterWaveBottom: '#F5664A',
    success: '#2ECC71',
    successBg: 'rgba(39, 174, 96, 0.18)',
    warning: '#F1C40F',
    warningBg: 'rgba(243, 156, 18, 0.18)',
    danger: '#E74C3C',
    dangerBg: 'rgba(231, 76, 60, 0.18)',
    cardShadow: 'rgba(0, 0, 0, 0.50)',
    tabBarBg: 'rgba(20, 25, 38, 0.97)',
    tabBarBorder: '#243050',
    neuShadowLight: 'rgba(255, 255, 255, 0.05)',
    neuShadowDark: 'rgba(0, 0, 0, 0.45)',
  },
};

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const radii = {
  none: 0,
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  '2xl': 32,
  full: 9999,
} as const;

export const fontFamilies = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',
};

export const typography = {
  h1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700' as const,
    letterSpacing: -0.6,
  },
  h2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
  },
  h3: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500' as const,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  bodyBold: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  subtext: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  captionBold: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  },
  numericHero: {
    fontSize: 52,
    lineHeight: 58,
    fontWeight: '800' as const,
    letterSpacing: -1.5,
  },
  numericLarge: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700' as const,
    letterSpacing: -0.8,
  },
  numericMedium: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
  },
} as const;
