/**
 * Environment variable helpers
 * Type-safe access to EXPO_PUBLIC_ environment variables
 * with strict runtime validation for production builds.
 */

type EnvKey =
  | 'EXPO_PUBLIC_API_BASE_URL'
  | 'EXPO_PUBLIC_APP_ENV'
  | 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'
  | 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'
  | 'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID'
  | 'EXPO_PUBLIC_APP_NAME'
  | 'EXPO_PUBLIC_APP_VERSION';

/** Variables that are required in production — missing them is a hard error */
const REQUIRED_IN_PRODUCTION: EnvKey[] = [
  'EXPO_PUBLIC_API_BASE_URL',
  'EXPO_PUBLIC_APP_ENV',
  'EXPO_PUBLIC_APP_NAME',
  'EXPO_PUBLIC_APP_VERSION',
];

/**
 * Get an environment variable value.
 * In Expo, EXPO_PUBLIC_ vars are inlined at build time via process.env.
 *
 * - In development: logs a warning for missing vars.
 * - In production: throws an error for required vars to catch misconfigurations
 *   before they reach users.
 */
export function getEnv(key: EnvKey): string {
  const value = process.env[key];

  if (!value) {
    const appEnv = process.env['EXPO_PUBLIC_APP_ENV'];
    const isProduction = appEnv === 'production';

    if (isProduction && REQUIRED_IN_PRODUCTION.includes(key)) {
      // Hard failure in production for required vars
      throw new Error(
        `[ENV] FATAL: Required environment variable "${key}" is missing. ` +
          `Aborting — configure this variable in your EAS build profile or .env file.`,
      );
    }

    if (__DEV__) {
      console.warn(`[ENV] Missing environment variable: ${key}`);
    }
  }

  return value ?? '';
}

/** Whether we are in development mode */
export const isDev = getEnv('EXPO_PUBLIC_APP_ENV') === 'development';

/** Whether we are in production mode */
export const isProd = getEnv('EXPO_PUBLIC_APP_ENV') === 'production';

/** Whether we are in staging mode */
export const isStaging = getEnv('EXPO_PUBLIC_APP_ENV') === 'staging';

/** App version string */
export const appVersion = getEnv('EXPO_PUBLIC_APP_VERSION');

/** App name */
export const appName = getEnv('EXPO_PUBLIC_APP_NAME');

/** Base API URL */
export const apiBaseUrl = getEnv('EXPO_PUBLIC_API_BASE_URL');
