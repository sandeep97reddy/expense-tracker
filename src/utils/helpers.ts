/**
 * Common utility/helper functions
 */

import type { CurrencyCode, CurrencyInfo } from '@/types/common';
import { useAppStore } from '@/store/useAppStore';

/**
 * Generate a unique ID (UUID v4 compatible)
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Currency locale map for dynamic regional formatting */
const CURRENCY_LOCALE_MAP: Record<CurrencyCode, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  AED: 'ar-AE',
  AUD: 'en-AU',
  CAD: 'en-CA',
  JPY: 'ja-JP',
  CNY: 'zh-CN',
};

/** Language to system locale mapping for dates */
const LANGUAGE_LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  pt: 'pt-BR',
  zh: 'zh-CN',
  ja: 'ja-JP',
  ar: 'ar-EG',
  ru: 'ru-RU',
};

/**
 * Format a number as currency dynamically using regional formatting rules
 */
export function formatCurrency(
  amount: number,
  currencyCode?: CurrencyCode,
): string {
  // Pull from Zustand if not explicitly provided as an argument
  const activeCurrency = currencyCode || useAppStore.getState().currency || 'INR';
  const config = CURRENCY_MAP[activeCurrency];
  if (!config) return `${amount}`;

  const locale = CURRENCY_LOCALE_MAP[activeCurrency] || 'en-US';

  // JPY will format with 0 decimal places automatically based on config.decimalPlaces
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: config.decimalPlaces,
    maximumFractionDigits: config.decimalPlaces,
  }).format(Math.abs(amount));

  const sign = amount < 0 ? '-' : '';

  // Arabic formats standard symbol differently, handle it gracefully
  if (activeCurrency === 'AED') {
    return amount < 0 ? `-${formatted} د.إ` : `${formatted} د.إ`;
  }

  return `${sign}${config.symbol}${formatted}`;
}

/**
 * Format a date string using the active language locale
 */
export function formatDate(
  dateStr: string,
  format: 'short' | 'medium' | 'long' = 'medium',
): string {
  const date = new Date(dateStr);
  const activeLanguage = useAppStore.getState().language || 'en';
  const locale = LANGUAGE_LOCALE_MAP[activeLanguage] || 'en-US';

  switch (format) {
    case 'short':
      return date.toLocaleDateString(locale, {
        day: '2-digit',
        month: '2-digit',
      });
    case 'medium':
      return date.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    case 'long':
      return date.toLocaleDateString(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
  }
}

/**
 * Get month key from date (YYYY-MM)
 */
export function getMonthKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}…`;
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/** Currency configuration map */
const CURRENCY_MAP: Record<CurrencyCode, CurrencyInfo> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimalPlaces: 2 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', decimalPlaces: 2 },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', decimalPlaces: 2 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimalPlaces: 2 },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimalPlaces: 2 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimalPlaces: 0 },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimalPlaces: 2 },
};
