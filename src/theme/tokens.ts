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
}

export const palette: Record<ThemeMode, ThemeColors> = {
  // Vibrant, refreshing, high-end Light Palette
  light: {
    background: '#F6F9FD',
    backgroundGradient: ['#EDF5FF', '#F6F9FD', '#F0F9FF'],
    surface: '#FFFFFF',
    surfaceSubtle: '#F1F5F9',
    surfaceElevated: '#FFFFFF',
    surfaceGlass: 'rgba(255, 255, 255, 0.85)',
    textPrimary: '#0F172A', // Deep obsidian navy
    textSecondary: '#475569', // Clean slate
    textMuted: '#94A3B8',
    border: '#E2E8F0',
    borderSubtle: '#F1F5F9',
    borderGlow: 'rgba(14, 165, 233, 0.25)',
    accent: '#0284C7', // Vivid aquatic blue
    accentHover: '#0369A1',
    accentMuted: '#BAE6FD',
    accentSubtle: '#E0F2FE',
    accentText: '#FFFFFF',
    accentGlow: 'rgba(2, 132, 199, 0.22)',
    waterGradient: ['#38BDF8', '#0EA5E9', '#0284C7'], // Electric sky to deep azure
    waterWaveTop: 'rgba(56, 189, 248, 0.65)',
    waterWaveBottom: '#0284C7',
    success: '#059669',
    successBg: '#D1FAE5',
    warning: '#D97706',
    warningBg: '#FEF3C7',
    danger: '#E11D48',
    dangerBg: '#FFE4E6',
    cardShadow: 'rgba(15, 23, 42, 0.06)',
    tabBarBg: 'rgba(255, 255, 255, 0.95)',
    tabBarBorder: '#E2E8F0',
  },
  // Luxurious, futuristic OLED Dark Palette
  dark: {
    background: '#090D16', // Ultra deep space navy
    backgroundGradient: ['#0B1120', '#090D16', '#060A12'],
    surface: '#111827', // Rich midnight slate
    surfaceSubtle: '#172033',
    surfaceElevated: '#1A243B',
    surfaceGlass: 'rgba(17, 24, 39, 0.85)',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    border: '#1E293B',
    borderSubtle: '#141D2D',
    borderGlow: 'rgba(56, 189, 248, 0.3)',
    accent: '#38BDF8', // Luminous electric cyan
    accentHover: '#7DD3FC',
    accentMuted: '#075985',
    accentSubtle: 'rgba(56, 189, 248, 0.12)',
    accentText: '#090D16',
    accentGlow: 'rgba(56, 189, 248, 0.35)',
    waterGradient: ['#22D3EE', '#0EA5E9', '#0369A1'], // Neon cyan to royal blue
    waterWaveTop: 'rgba(34, 211, 238, 0.7)',
    waterWaveBottom: '#0284C7',
    success: '#34D399',
    successBg: 'rgba(5, 150, 105, 0.2)',
    warning: '#FBBF24',
    warningBg: 'rgba(217, 119, 6, 0.2)',
    danger: '#FB7185',
    dangerBg: 'rgba(225, 29, 72, 0.2)',
    cardShadow: 'rgba(0, 0, 0, 0.45)',
    tabBarBg: 'rgba(13, 19, 33, 0.95)',
    tabBarBorder: '#1E293B',
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
