/**
 * TabNavigator — Bottom tab navigation
 * 4 tabs: Dashboard, Transactions, Analytics, Settings
 * Theme-aware styling with custom icons.
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import type { TabParamList } from './types';
import { useTheme } from '@/hooks/useTheme';

// Placeholder screens — will be replaced with real module screens
import { DashboardScreen } from '@/modules/dashboard/screens/DashboardScreen';
import { TransactionsScreen } from '@/modules/transactions/screens/TransactionsScreen';
import { AnalyticsScreen } from '@/modules/analytics/screens/AnalyticsScreen';
import { SettingsScreen } from '@/modules/settings/screens/SettingsScreen';

const Tab = createBottomTabNavigator<TabParamList>();

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<keyof TabParamList, { focused: IoniconsName; unfocused: IoniconsName }> = {
  Dashboard: { focused: 'home', unfocused: 'home-outline' },
  Transactions: { focused: 'swap-horizontal', unfocused: 'swap-horizontal-outline' },
  Analytics: { focused: 'pie-chart', unfocused: 'pie-chart-outline' },
  Settings: { focused: 'settings', unfocused: 'settings-outline' },
};

export function TabNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, size }) => {
          const icons = TAB_ICONS[route.name];
          const iconName = focused ? icons.focused : icons.unfocused;
          return (
            <Ionicons
              name={iconName}
              size={size}
              color={focused ? colors.tabIconSelected : colors.tabIconDefault}
            />
          );
        },
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
