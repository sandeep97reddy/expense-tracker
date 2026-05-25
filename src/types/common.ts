/**
 * Common shared types
 */

/** Standard API response wrapper */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/** Paginated API response */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/** Application error */
export interface AppError {
  code: string;
  message: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

/** Supported currencies */
export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'AUD' | 'CAD' | 'JPY' | 'CNY';

/** Currency display info */
export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  decimalPlaces: number;
}

/** Supported languages */
export type LanguageCode = 'en' | 'hi' | 'es' | 'fr' | 'de' | 'pt' | 'zh' | 'ja' | 'ar' | 'ru';
