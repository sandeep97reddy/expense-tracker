/**
 * useTheme — convenience hook for accessing theme
 * Returns the current colors, mode, and theme control functions.
 */

import { useThemeStore } from '@/store/useThemeStore';

export function useTheme() {
  const mode = useThemeStore((s) => s.mode);
  const colors = useThemeStore((s) => s.colors);
  const setMode = useThemeStore((s) => s.setMode);
  const cycleTheme = useThemeStore((s) => s.cycleTheme);

  const isDark = mode !== 'light';

  return {
    mode,
    colors,
    isDark,
    setMode,
    cycleTheme,
  } as const;
}
