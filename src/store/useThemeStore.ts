/**
 * Theme Zustand store — persisted to MMKV
 * Manages the current theme mode (light/dark/amoled) and
 * exposes computed colors from the active palette.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ThemeMode, ThemeColors } from '@/types/theme';
import { themeColorMap } from '@/theme/colors';
import { zustandMMKVStorage } from '@/services/storage/mmkv';

interface ThemeState {
  /** Current theme mode */
  mode: ThemeMode;
  /** Resolved colors for the current mode */
  colors: ThemeColors;
  /** Set a specific theme mode */
  setMode: (mode: ThemeMode) => void;
  /** Cycle to the next theme: light → dark → amoled → light */
  cycleTheme: () => void;
}

const THEME_CYCLE: ThemeMode[] = ['light', 'dark', 'amoled'];

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'dark',
      colors: themeColorMap.dark,

      setMode: (mode) =>
        set({
          mode,
          colors: themeColorMap[mode],
        }),

      cycleTheme: () =>
        set((state) => {
          const currentIndex = THEME_CYCLE.indexOf(state.mode);
          const nextIndex = (currentIndex + 1) % THEME_CYCLE.length;
          const nextMode = THEME_CYCLE[nextIndex]!;
          return {
            mode: nextMode,
            colors: themeColorMap[nextMode],
          };
        }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => zustandMMKVStorage),
      // Only persist the mode, rehydrate colors from the map
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.colors = themeColorMap[state.mode];
        }
      },
    },
  ),
);
