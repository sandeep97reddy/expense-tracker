/**
 * ThemeProvider — wraps the app with theme context
 * Syncs the Zustand theme state with React Navigation and StatusBar
 */

import React, { useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { useThemeStore } from '@/store/useThemeStore';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { mode, colors } = useThemeStore();

  // Build a React Navigation theme from our custom colors
  const navigationTheme = useMemo(() => {
    const base = mode === 'light' ? DefaultTheme : DarkTheme;
    return {
      ...base,
      dark: mode !== 'light',
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.card,
        text: colors.text,
        border: colors.border,
        notification: colors.error,
      },
    };
  }, [mode, colors]);

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style={mode === 'light' ? 'dark' : 'light'} />
      {children}
    </NavigationThemeProvider>
  );
}
