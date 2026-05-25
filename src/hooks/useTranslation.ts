import { useAppStore } from '@/store/useAppStore';
import { translations } from '@/services/i18n/translations';
import { I18nManager } from 'react-native';

// Type helper for nested keys representation
type PathsToStringProps<T> = T extends string
  ? []
  : {
      [K in keyof T]: [K, ...PathsToStringProps<T[K]>];
    }[keyof T];

type Join<T extends unknown[], D extends string> = T extends []
  ? never
  : T extends [infer F]
  ? F extends string
    ? F
    : never
  : T extends [infer F, ...infer R]
  ? F extends string
    ? `${F}${D}${Join<R, D>}`
    : never
  : string;

export type TranslationKey = Join<PathsToStringProps<typeof translations.en>, '.'>;

/**
 * Highly-optimized, type-safe custom Translation Hook.
 * Automatically syncs with the user's language selection from Zustand store.
 */
export function useTranslation() {
  const language = useAppStore((state) => state.language);
  const isRTL = language === 'ar';

  /**
   * Translates a key path (e.g. 'dashboard.balance') into the localized string.
   * Supports both signature forms:
   * 1. t('key.path', { var: 'value' })
   * 2. t('key.path', 'Default Fallback String', { var: 'value' })
   */
  const t = (
    keyPath: TranslationKey | string,
    defaultValueOrVariables?: string | Record<string, string | number>,
    variables?: Record<string, string | number>,
  ): string => {
    const keys = keyPath.split('.');
    const dict = translations[language] || translations.en;
    
    // Traverses the dictionary tree by dot notation
    let result: any = dict;
    for (const key of keys) {
      if (result && Object.prototype.hasOwnProperty.call(result, key)) {
        result = result[key];
      } else {
        // Fallback to English dictionary if key is missing in active locale
        let fallbackResult: any = translations.en;
        for (const fKey of keys) {
          if (fallbackResult && Object.prototype.hasOwnProperty.call(fallbackResult, fKey)) {
            fallbackResult = fallbackResult[fKey];
          } else {
            fallbackResult = null;
            break;
          }
        }
        
        // If not found, use default string or keyPath
        const fallbackText = fallbackResult || (typeof defaultValueOrVariables === 'string' ? defaultValueOrVariables : keyPath as string);
        
        let interpolated = fallbackText;
        const vars = typeof defaultValueOrVariables === 'object' ? defaultValueOrVariables : variables;
        if (vars) {
          Object.entries(vars).forEach(([k, val]) => {
            interpolated = interpolated.replace(new RegExp(`{{${k}}}`, 'g'), String(val));
          });
        }
        return interpolated;
      }
    }

    if (typeof result !== 'string') {
      return typeof defaultValueOrVariables === 'string' ? defaultValueOrVariables : (keyPath as string);
    }

    // Dynamic variable interpolation (e.g. {{count}})
    const vars = typeof defaultValueOrVariables === 'object' ? defaultValueOrVariables : variables;
    if (vars) {
      let interpolated = result;
      Object.entries(vars).forEach(([k, val]) => {
        interpolated = interpolated.replace(new RegExp(`{{${k}}}`, 'g'), String(val));
      });
      return interpolated;
    }

    return result;
  };

  /**
   * Helper to translate a raw transaction category name dynamically.
   */
  const tCategory = (categoryName: string): string => {
    const categoryTranslations = (translations[language] as any)?.categories || translations.en.categories;
    return categoryTranslations[categoryName] || categoryName;
  };

  return {
    t,
    tCategory,
    language,
    isRTL,
  };
}
