/**
 * Root Zustand store — app-level state
 * Manages onboarding, auth status, and global preferences.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandMMKVStorage } from '@/services/storage/mmkv';
import type { CurrencyCode, LanguageCode } from '@/types/common';

interface AppState {
  /** Has the user completed onboarding */
  isOnboarded: boolean;
  /** Is the user authenticated (signed in with Google) */
  isAuthenticated: boolean;
  /** Selected currency */
  currency: CurrencyCode;
  /** Selected language */
  language: LanguageCode;

  /** Are master notifications enabled */
  notificationsEnabled: boolean;
  /** Are daily reminders enabled */
  dailyReminderEnabled: boolean;
  /** Are budget alerts enabled */
  budgetAlertsEnabled: boolean;

  // Actions
  setOnboarded: (value: boolean) => void;
  setAuthenticated: (value: boolean) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setLanguage: (language: LanguageCode) => void;
  setNotificationsEnabled: (value: boolean) => void;
  setDailyReminderEnabled: (value: boolean) => void;
  setBudgetAlertsEnabled: (value: boolean) => void;
  reset: () => void;
}

const initialState = {
  isOnboarded: false,
  isAuthenticated: false,
  currency: 'INR' as CurrencyCode,
  language: 'en' as LanguageCode,
  notificationsEnabled: false,
  dailyReminderEnabled: false,
  budgetAlertsEnabled: true,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,

      setOnboarded: (value) => set({ isOnboarded: value }),
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setCurrency: (currency) => set({ currency }),
      setLanguage: (language) => set({ language }),
      setNotificationsEnabled: (value) => set({ notificationsEnabled: value }),
      setDailyReminderEnabled: (value) => set({ dailyReminderEnabled: value }),
      setBudgetAlertsEnabled: (value) => set({ budgetAlertsEnabled: value }),
      reset: () => set(initialState),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => zustandMMKVStorage),
    },
  ),
);
