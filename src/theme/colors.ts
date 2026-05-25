/**
 * Color palettes — Light, Dark, AMOLED
 * All colors curated to be harmonious and premium-feeling.
 * Teal is the primary brand color per the Architecture spec.
 */

import type { ThemeColors } from '@/types/theme';

/** Light theme palette */
export const lightColors: ThemeColors = {
  // Backgrounds
  background: '#FFFFFF',
  surface: '#F8FAFC',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',

  // Text
  text: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',

  // Brand — Teal
  primary: '#0D9488',
  primaryLight: '#14B8A6',
  primaryDark: '#0F766E',

  // Borders
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  divider: '#E2E8F0',

  // Semantic
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  info: '#2563EB',

  // Transaction types
  income: '#059669',
  expense: '#DC2626',
  transfer: '#7C3AED',

  // Interactive
  tint: '#0D9488',
  tabIconDefault: '#94A3B8',
  tabIconSelected: '#0D9488',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  shimmer: '#E2E8F0',

  // Status bar
  statusBar: 'dark-content',
};

/** Dark theme palette */
export const darkColors: ThemeColors = {
  // Backgrounds
  background: '#0F172A',
  surface: '#1E293B',
  surfaceElevated: '#334155',
  card: '#1E293B',

  // Text
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  textInverse: '#0F172A',

  // Brand — Brighter teal for dark surfaces
  primary: '#14B8A6',
  primaryLight: '#2DD4BF',
  primaryDark: '#0D9488',

  // Borders
  border: '#334155',
  borderLight: '#1E293B',
  divider: '#334155',

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Transaction types
  income: '#10B981',
  expense: '#EF4444',
  transfer: '#8B5CF6',

  // Interactive
  tint: '#14B8A6',
  tabIconDefault: '#64748B',
  tabIconSelected: '#14B8A6',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.7)',
  shimmer: '#334155',

  // Status bar
  statusBar: 'light-content',
};

/** AMOLED theme palette — true blacks for OLED power saving */
export const amoledColors: ThemeColors = {
  // Backgrounds — true black
  background: '#000000',
  surface: '#0A0A0A',
  surfaceElevated: '#171717',
  card: '#0A0A0A',

  // Text
  text: '#FAFAFA',
  textSecondary: '#A3A3A3',
  textTertiary: '#525252',
  textInverse: '#000000',

  // Brand
  primary: '#2DD4BF',
  primaryLight: '#5EEAD4',
  primaryDark: '#14B8A6',

  // Borders
  border: '#262626',
  borderLight: '#171717',
  divider: '#262626',

  // Semantic
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',

  // Transaction types
  income: '#34D399',
  expense: '#F87171',
  transfer: '#A78BFA',

  // Interactive
  tint: '#2DD4BF',
  tabIconDefault: '#525252',
  tabIconSelected: '#2DD4BF',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.85)',
  shimmer: '#262626',

  // Status bar
  statusBar: 'light-content',
};

/** Map theme mode to its color palette */
export const themeColorMap = {
  light: lightColors,
  dark: darkColors,
  amoled: amoledColors,
} as const;
