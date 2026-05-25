/**
 * Axios API client
 * Production-grade HTTP client with:
 * - Auth token injection via request interceptor
 * - 401 handling with token refresh (stub for Phase 3)
 * - Request/response dev logging
 * - Configurable timeout
 * - Typed error handling
 */

import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { getSecureItem, SecureKeys } from '@/services/storage/secureStore';
import { getEnv } from '@/utils/env';
import { apiLogger } from '@/services/logger/logger';

/** Custom error shape returned by our API */
export interface ApiErrorResponse {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

/** Create the Axios instance */
function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: getEnv('EXPO_PUBLIC_API_BASE_URL'),
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  // ──────────────────────────────────────
  // Request interceptor — attach auth token
  // ──────────────────────────────────────
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await getSecureItem(SecureKeys.ACCESS_TOKEN);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Structured request logging
      if (__DEV__) {
        apiLogger.debug(`→ ${config.method?.toUpperCase()} ${config.url}`);
      }

      return config;
    },
    (error: AxiosError) => Promise.reject(error),
  );

  // ──────────────────────────────────────
  // Response interceptor — handle errors
  // ──────────────────────────────────────
  client.interceptors.response.use(
    (response) => {
      if (__DEV__) {
        apiLogger.debug(`✓ ${response.status} ${response.config.url}`);
      }
      return response;
    },
    async (error: AxiosError<ApiErrorResponse>) => {
      const originalRequest = error.config;

      // Handle 401 — Token refresh (Phase 3 implementation)
      if (error.response?.status === 401 && originalRequest) {
        // TODO: Implement token refresh flow in Phase 3
        // 1. Get refresh token from SecureStore
        // 2. Call /auth/refresh
        // 3. Store new tokens
        // 4. Retry original request
        apiLogger.warn('401 Unauthorized — token refresh not yet implemented');
      }

      // Structured error logging
      if (__DEV__) {
        apiLogger.error(
          `✗ ${error.response?.status ?? 'NETWORK'} ${originalRequest?.url}`,
          { message: error.response?.data?.message ?? error.message },
        );
      }

      return Promise.reject(error);
    },
  );

  return client;
}

/** Singleton API client instance */
export const apiClient = createApiClient();

/**
 * Type-safe API helper functions
 */
export const api = {
  get: <T>(url: string, params?: Record<string, unknown>) =>
    apiClient.get<T>(url, { params }).then((r) => r.data),

  post: <T>(url: string, data?: unknown) =>
    apiClient.post<T>(url, data).then((r) => r.data),

  put: <T>(url: string, data?: unknown) =>
    apiClient.put<T>(url, data).then((r) => r.data),

  patch: <T>(url: string, data?: unknown) =>
    apiClient.patch<T>(url, data).then((r) => r.data),

  delete: <T>(url: string) =>
    apiClient.delete<T>(url).then((r) => r.data),
} as const;
