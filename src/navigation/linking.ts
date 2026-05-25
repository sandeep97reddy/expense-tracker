/**
 * Deep linking configuration
 */

import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['expensetracker://', 'https://expensetracker.app'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Dashboard: 'dashboard',
          Transactions: 'transactions',
          Analytics: 'analytics',
          Settings: 'settings',
        },
      },
    },
  },
};
