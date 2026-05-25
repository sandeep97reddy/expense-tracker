/**
 * MMKV Storage instance
 * High-performance key-value storage for React Native.
 * Used for app settings, theme persistence, cached data, and Zustand store persistence.
 */

import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

/** Main app storage instance */
export const storage = createMMKV({
  id: 'expense-tracker-storage',
});

/**
 * Zustand-compatible storage adapter for MMKV
 * Used with zustand/middleware `persist` for store persistence.
 */
export const zustandMMKVStorage: StateStorage = {
  getItem: (name: string): string | null => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string): void => {
    storage.set(name, value);
  },
  removeItem: (name: string): void => {
    storage.remove(name);
  },
};

/**
 * Type-safe MMKV helpers
 */
export const mmkv = {
  /** Get a string value */
  getString: (key: string): string | undefined => storage.getString(key),

  /** Set a string value */
  setString: (key: string, value: string): void => storage.set(key, value),

  /** Get a number value */
  getNumber: (key: string): number | undefined => storage.getNumber(key),

  /** Set a number value */
  setNumber: (key: string, value: number): void => storage.set(key, value),

  /** Get a boolean value */
  getBoolean: (key: string): boolean | undefined => storage.getBoolean(key),

  /** Set a boolean value */
  setBoolean: (key: string, value: boolean): void => storage.set(key, value),

  /** Get a JSON-parsed object */
  getObject: <T>(key: string): T | undefined => {
    const raw = storage.getString(key);
    if (!raw) return undefined;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  },

  /** Set an object (JSON stringified) */
  setObject: <T>(key: string, value: T): void => {
    storage.set(key, JSON.stringify(value));
  },

  /** Delete a key */
  delete: (key: string): void => {
    storage.remove(key);
  },

  /** Check if a key exists */
  contains: (key: string): boolean => storage.contains(key),

  /** Get all keys */
  getAllKeys: (): string[] => storage.getAllKeys(),

  /** Clear all storage */
  clearAll: (): void => storage.clearAll(),
} as const;
