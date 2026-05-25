/**
 * App-wide constants
 */

/** MMKV storage keys */
export const STORAGE_KEYS = {
  THEME_MODE: 'theme_mode',
  IS_ONBOARDED: 'is_onboarded',
  CURRENCY: 'currency',
  LANGUAGE: 'language',
  TRANSACTIONS: 'transactions',
  CATEGORIES: 'categories',
  USER_PREFERENCES: 'user_preferences',
} as const;

/** React Query cache keys */
export const QUERY_KEYS = {
  TRANSACTIONS: ['transactions'] as const,
  TRANSACTION_DETAIL: (id: string) => ['transactions', id] as const,
  CATEGORIES: ['categories'] as const,
  ANALYTICS_OVERVIEW: ['analytics', 'overview'] as const,
  ANALYTICS_TRENDS: ['analytics', 'trends'] as const,
  MONTHLY_STATS: (monthKey: string) => ['stats', monthKey] as const,
  USER_PROFILE: ['user', 'profile'] as const,
  WORKSPACES: ['workspaces'] as const,
} as const;

/** App metadata */
export const APP_CONFIG = {
  NAME: 'ExpenseTracker',
  VERSION: '1.0.0',
  DEFAULT_CURRENCY: 'INR' as const,
  DEFAULT_LANGUAGE: 'en' as const,
  MAX_ATTACHMENT_SIZE_MB: 10,
  PAGINATION_LIMIT: 20,
} as const;
