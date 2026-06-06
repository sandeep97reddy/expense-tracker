/**
 * Auth Zustand Store
 * Manages user session, token, and guest mode.
 * Persisted using MMKV so sessions survive app restarts.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandMMKVStorage } from '@/services/storage/mmkv';
import * as secureStore from '@/services/storage/secureStore';
import type { User, AuthStatus } from '../types/auth';
import { useAppStore } from '@/store/useAppStore';

interface AuthState {
  /** Current user profile */
  user: User | null;
  /** Current authentication status */
  status: AuthStatus;
  /** True if the user bypassed login to use the app offline */
  isGuest: boolean;

  // Actions
  /** Start a login flow */
  setLoading: () => void;
  /** Reset auth flow after cancel or failure */
  setUnauthenticated: () => void;
  /** Handle successful login */
  signIn: (user: User, token: string) => Promise<void>;
  /** Handle logout */
  signOut: () => Promise<void>;
  /** Bypass login to use offline mode */
  continueAsGuest: () => void;
  /** Hydrate token into memory on app start if needed */
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      status: 'idle',
      isGuest: false,

      setLoading: () => set({ status: 'loading' }),

      setUnauthenticated: () => set({ status: 'unauthenticated' }),

      signIn: async (user, token) => {
        try {
          // Store token securely
          await secureStore.setSecureItem(secureStore.SecureKeys.ACCESS_TOKEN, token);
          
          // Update global app state
          useAppStore.getState().setAuthenticated(true);
          useAppStore.getState().setOnboarded(true);

          set({
            user,
            status: 'authenticated',
            isGuest: false,
          });
        } catch (error) {
          console.error('[AuthStore] Failed to save token:', error);
          set({ status: 'unauthenticated' });
        }
      },

      signOut: async () => {
        try {
          // Remove token securely
          await secureStore.deleteSecureItem(secureStore.SecureKeys.ACCESS_TOKEN);
          
          // Update global app state
          useAppStore.getState().setAuthenticated(false);

          set({
            user: null,
            status: 'unauthenticated',
            isGuest: false,
          });
        } catch (error) {
          console.error('[AuthStore] Failed to remove token:', error);
        }
      },

      continueAsGuest: () => {
        useAppStore.getState().setOnboarded(true);
        set({
          user: null,
          status: 'guest',
          isGuest: true,
        });
      },

      hydrate: async () => {
        const { isGuest, user } = get();
        
        if (isGuest) {
          set({ status: 'guest' });
          return;
        }

        if (user) {
          // Try to get token from secure store to verify we are still logged in
          const token = await secureStore.getSecureItem(secureStore.SecureKeys.ACCESS_TOKEN);
          if (token) {
            set({ status: 'authenticated' });
            useAppStore.getState().setAuthenticated(true);
          } else {
            set({ status: 'unauthenticated', user: null });
            useAppStore.getState().setAuthenticated(false);
          }
        } else {
          set({ status: 'unauthenticated' });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => zustandMMKVStorage),
      // Don't persist status, it should be re-evaluated on hydration
      partialize: (state) => ({ 
        user: state.user, 
        isGuest: state.isGuest 
      }),
    },
  ),
);
