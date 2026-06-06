/**
 * App.tsx — Application root
 * Wires together all providers: ErrorBoundary → Theme → Navigation
 */

import './global.css';

import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { RootNavigator } from '@/navigation/RootNavigator';
import { linking } from '@/navigation/linking';
import { AppLockOverlay } from '@/components/security/AppLockOverlay';

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <NavigationContainer linking={linking}>
            <ThemeProvider>
              <RootNavigator />
              <AppLockOverlay />
            </ThemeProvider>
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
