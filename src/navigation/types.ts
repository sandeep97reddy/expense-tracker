/**
 * Navigation type definitions
 * Type-safe route param lists for all navigators.
 */

import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

/**
 * Tab Navigator — bottom tabs
 */
export type TabParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  AddAction: undefined;
  ScanAction: undefined;
  Analytics: undefined;
};

/**
 * Auth Stack Navigator
 */
export type AuthStackParamList = {
  Login: undefined;
};

/**
 * Root Stack Navigator — wraps tabs + modal screens
 */
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  MainTabs: NavigatorScreenParams<TabParamList>;
  // Modal screens
  Scanner: undefined;
  Payment: {
    upiId: string;
    payeeName: string;
    amount: string;
    transactionNote: string;
    originalQRData: string;
    isMerchant: string; // 'true' or 'false'
    merchantCategory: string;
    organizationId: string;
    qrImageUri: string;
    generatedQR: string; // 'true' or 'false'
    amountLocked: string; // 'true' or 'false'
  };
  AddTransaction: { transactionId?: string; type?: 'income' | 'expense' | 'transfer' } | undefined;
  TransactionDetail: { id: string };
  WorkspaceManager: undefined;
  Settings: undefined;
  NotificationSettings: undefined;
};

/**
 * Screen prop helpers — use these in screen components
 *
 * Usage:
 *   const MyScreen = ({ navigation, route }: RootStackScreenProps<'MainTabs'>) => { ... }
 */
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type TabScreenProps<T extends keyof TabParamList> =
  BottomTabScreenProps<TabParamList, T>;

/**
 * Global type augmentation for useNavigation/useRoute
 */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
