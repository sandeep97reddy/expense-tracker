/**
 * Tracks MMKV persist rehydration for all critical Zustand stores.
 * Prevents empty-state flash before persisted data is loaded.
 */

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/modules/auth/store/useAuthStore';
import { useTransactionStore } from '@/modules/transactions/store/useTransactionStore';
import { useWorkspaceStore } from '@/modules/workspaces/store/useWorkspaceStore';
import { useBudgetStore } from '@/modules/analytics/store/useBudgetStore';
import { useAppStore } from '@/store/useAppStore';
import { useCategoryStore } from '@/modules/transactions/store/useCategoryStore';
import { useThemeStore } from '@/store/useThemeStore';

type PersistedStore = {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (fn: () => void) => () => void;
  };
};

const PERSISTED_STORES: PersistedStore[] = [
  useAuthStore,
  useTransactionStore,
  useWorkspaceStore,
  useBudgetStore,
  useAppStore,
  useCategoryStore,
  useThemeStore,
];

export function hasAllStoresHydrated(): boolean {
  return PERSISTED_STORES.every((store) => store.persist.hasHydrated());
}

export function useStoreHydration(): { isHydrated: boolean } {
  const [isHydrated, setIsHydrated] = useState(hasAllStoresHydrated);

  useEffect(() => {
    if (hasAllStoresHydrated()) {
      setIsHydrated(true);
      return;
    }

    const unsubscribers = PERSISTED_STORES.map((store) =>
      store.persist.onFinishHydration(() => {
        if (hasAllStoresHydrated()) {
          setIsHydrated(true);
        }
      }),
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []);

  return { isHydrated };
}
