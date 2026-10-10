/**
 * Raja & Rani - Royal Luxe Theme
 * Dark royal aesthetic with cyan (Raja) and rose (Rani) accents
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#F8FAFC',
    background: '#0B0F19',
    backgroundElement: '#1E293B',
    backgroundSelected: '#111827',
    textSecondary: '#94A3B8',
  },
} as const;

export const RoyalColors = {
  background: '#0B0F19',
  card: '#1E293B',
  cardDark: '#111827',
  raja: '#06B6D4',
  rajaLight: '#38BDF8',
  rani: '#F43F5E',
  raniLight: '#FB7185',
  gold: '#F59E0B',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  neonBorder: '#38BDF8',
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
