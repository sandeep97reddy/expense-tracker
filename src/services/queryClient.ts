/**
 * React Query client configuration
 * Centralized QueryClient with production-grade defaults.
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /** Data considered fresh for 2 minutes */
      staleTime: 2 * 60 * 1000,
      /** Cached data garbage-collected after 10 minutes */
      gcTime: 10 * 60 * 1000,
      /** Retry failed requests up to 2 times */
      retry: 2,
      /** Exponential backoff for retries */
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 15000),
      /** Refetch when app comes to foreground */
      refetchOnWindowFocus: false,
      /** Don't refetch on reconnect by default (mobile-friendly) */
      refetchOnReconnect: true,
    },
    mutations: {
      /** Retry mutations once */
      retry: 1,
    },
  },
});
