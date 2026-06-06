/**
 * TabNavigator — Bottom tab navigation
 * 4 tabs: Dashboard, Transactions, Analytics + FAB actions
 * Theme-aware styling with custom icons.
 */

import React, { useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, TouchableOpacity, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { TabParamList } from './types';
import { useTheme } from '@/hooks/useTheme';

import { DashboardScreen } from '@/modules/dashboard/screens/DashboardScreen';
import { TransactionsScreen } from '@/modules/transactions/screens/TransactionsScreen';
import { AnalyticsScreen } from '@/modules/analytics/screens/AnalyticsScreen';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';

const Tab = createBottomTabNavigator<TabParamList>();

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<keyof TabParamList, { focused: IoniconsName; unfocused: IoniconsName }> = {
  Dashboard: { focused: 'home', unfocused: 'home-outline' },
  Transactions: { focused: 'swap-horizontal', unfocused: 'swap-horizontal-outline' },
  AddAction: { focused: 'add', unfocused: 'add' },
  ScanAction: { focused: 'qr-code', unfocused: 'qr-code-outline' },
  Analytics: { focused: 'pie-chart', unfocused: 'pie-chart-outline' },
};

function FloatingActionButton({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.9, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{
        top: -20,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Animated.View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          transform: [{ scale }],
          ...Platform.select({
            ios: {
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
            },
            android: {
              elevation: 8,
            },
          }),
        }}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </Animated.View>
    </TouchableOpacity>
  );
}

function ScanTabButton({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 8,
      }}
    >
      <Ionicons name="qr-code-outline" size={24} color={colors.tabIconDefault} />
    </TouchableOpacity>
  );
}

export function TabNavigator() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        lazy: true,
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
      <Tab.Screen
        name="AddAction"
        component={View}
        options={{
          tabBarIcon: () => null,
          tabBarLabel: () => null,
          tabBarButton: () => (
            <FloatingActionButton onPress={() => navigation.navigate('AddTransaction')} />
          ),
        }}
      />
      <Tab.Screen
        name="ScanAction"
        component={View}
        options={{
          tabBarIcon: () => null,
          tabBarLabel: () => null,
          tabBarButton: () => (
            <ScanTabButton onPress={() => navigation.navigate('Scanner')} />
          ),
        }}
      />
      <Tab.Screen name="Analytics">
        {() => (
          <ErrorBoundary>
            <AnalyticsScreen />
          </ErrorBoundary>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
