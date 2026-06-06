/**
 * RootNavigator — top-level navigation container
 * Stack navigator wrapping the tab navigator + modal screens.
 */

import React, { useEffect, useState } from 'react';
import { InteractionManager } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { TabNavigator } from './TabNavigator';
import { AuthNavigator } from './AuthNavigator';
import { useAuthStore } from '@/modules/auth/store/useAuthStore';
import { LoadingSpinner } from '@/components/ui';
import { navLogger } from '@/services/logger/logger';
import { AddTransactionScreen } from '@/modules/transactions/screens/AddTransactionScreen';
import { TransactionDetailScreen } from '@/modules/transactions/screens/TransactionDetailScreen';
import { WorkspaceManagerScreen } from '@/modules/workspaces/screens/WorkspaceManagerScreen';
import { SettingsScreen } from '@/modules/settings/screens/SettingsScreen';
import { NotificationSettingsScreen } from '@/modules/settings/screens/NotificationSettingsScreen';
import { useTransactionStore } from '@/modules/transactions/store/useTransactionStore';
import { PaymentScreen } from '@/modules/upi/screens/PaymentScreen';
import { ScannerScreen } from '@/modules/upi/screens/ScannerScreen';
import { useStoreHydration } from '@/hooks/useStoreHydration';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { status, hydrate } = useAuthStore();
  const { isHydrated: storesHydrated } = useStoreHydration();
  const [isBootComplete, setIsBootComplete] = useState(false);

  useEffect(() => {
    if (!storesHydrated) return;

    hydrate()
      .finally(() => {
        setIsBootComplete(true);

        // Defer heavy recurring transaction processing until after first paint
        InteractionManager.runAfterInteractions(() => {
          try {
            useTransactionStore.getState().processRecurringTransactions();
          } catch (err) {
            navLogger.error('Failed to process recurring transactions', err);
          }
        });
      });
  }, [storesHydrated, hydrate]);

  if (!storesHydrated || !isBootComplete || status === 'idle' || status === 'loading') {
    return <LoadingSpinner fullScreen />;
  }

  const isAuthorized = status === 'authenticated' || status === 'guest';

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {isAuthorized ? (
        <Stack.Screen name="MainTabs" component={TabNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}

      <Stack.Screen name="Scanner" component={ScannerScreen} />

      <Stack.Group screenOptions={{ presentation: 'modal', animation: 'slide_from_bottom' }}>
        <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
        <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
        <Stack.Screen name="WorkspaceManager" component={WorkspaceManagerScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
      </Stack.Group>
    </Stack.Navigator>
  );
}
