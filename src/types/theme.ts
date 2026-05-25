/**
 * Theme type definitions
 * Defines the shape of all theme-related types used across the app
 */

/** Supported theme modes */
export type ThemeMode = 'light' | 'dark' | 'amoled';

/** Complete color palette for a single theme */
export interface ThemeColors {
  // Backgrounds
  background: string;
  surface: string;
  surfaceElevated: string;
  card: string;

  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Brand
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Borders & Dividers
  border: string;
  borderLight: string;
  divider: string;

  // Semantic
  success: string;
  warning: string;
  error: string;
  info: string;

  // Transaction types
  income: string;
  expense: string;
  transfer: string;

  // Interactive
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;

  // Overlays
  overlay: string;
  shimmer: string;

  // Status bar
  statusBar: 'light-content' | 'dark-content';
}

/** Theme configuration object */
export interface ThemeConfig {
  mode: ThemeMode;
  colors: ThemeColors;
}

/** Storage keys for theme persistence */
export const THEME_STORAGE_KEY = 'app_theme_mode';
