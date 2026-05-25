/**
 * API endpoint constants
 * Centralized endpoint definitions to avoid string duplication across the codebase.
 */

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    GOOGLE: '/auth/google',
    ME: '/auth/me',
  },

  // Users
  USERS: {
    PROFILE: '/users/profile',
    UPDATE: '/users/profile',
    DELETE: '/users/account',
  },

  // Transactions
  TRANSACTIONS: {
    LIST: '/transactions',
    CREATE: '/transactions',
    DETAIL: (id: string) => `/transactions/${id}`,
    UPDATE: (id: string) => `/transactions/${id}`,
    DELETE: (id: string) => `/transactions/${id}`,
    SEARCH: '/transactions/search',
    STATS: '/transactions/stats',
  },

  // Categories
  CATEGORIES: {
    LIST: '/categories',
    CREATE: '/categories',
    UPDATE: (id: string) => `/categories/${id}`,
    DELETE: (id: string) => `/categories/${id}`,
  },

  // Analytics
  ANALYTICS: {
    OVERVIEW: '/analytics/overview',
    TRENDS: '/analytics/trends',
    CATEGORY_BREAKDOWN: '/analytics/categories',
    MONTHLY: '/analytics/monthly',
  },

  // Workspaces (Family)
  WORKSPACES: {
    LIST: '/workspaces',
    CREATE: '/workspaces',
    DETAIL: (id: string) => `/workspaces/${id}`,
    INVITE: (id: string) => `/workspaces/${id}/invite`,
    MEMBERS: (id: string) => `/workspaces/${id}/members`,
  },
} as const;
