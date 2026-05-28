/**
 * App.tsx — Application root
 * Wires together all providers: ErrorBoundary → QueryClient → Theme → Navigation
 */

import './global.css';

import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { RootNavigator } from '@/navigation/RootNavigator';
import { linking } from '@/navigation/linking';
import { queryClient } from '@/services/queryClient';
import { AppLockOverlay } from '@/components/security/AppLockOverlay';

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <NavigationContainer linking={linking}>
              <ThemeProvider>
                <RootNavigator />
                <AppLockOverlay />
              </ThemeProvider>
            </NavigationContainer>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
