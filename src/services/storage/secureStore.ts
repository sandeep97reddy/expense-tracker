/**
 * SecureStore helpers
 * Encrypted key-value storage for sensitive data (auth tokens, secrets).
 * Uses Expo SecureStore under the hood (Keychain on iOS, EncryptedSharedPreferences on Android).
 */

import * as ExpoSecureStore from 'expo-secure-store';

/** Keys for secure storage — centralized to prevent typos */
export const SecureKeys = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_ID: 'user_id',
} as const;

type SecureKeyValue = (typeof SecureKeys)[keyof typeof SecureKeys];

/**
 * Store a value securely
 */
export async function setSecureItem(
  key: SecureKeyValue,
  value: string,
): Promise<void> {
  await ExpoSecureStore.setItemAsync(key, value);
}

/**
 * Retrieve a securely stored value
 */
export async function getSecureItem(
  key: SecureKeyValue,
): Promise<string | null> {
  return ExpoSecureStore.getItemAsync(key);
}

/**
 * Delete a securely stored value
 */
export async function deleteSecureItem(
  key: SecureKeyValue,
): Promise<void> {
  await ExpoSecureStore.deleteItemAsync(key);
}

/**
 * Store auth tokens (access + refresh) in one call
 */
export async function setAuthTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  await Promise.all([
    setSecureItem(SecureKeys.ACCESS_TOKEN, accessToken),
    setSecureItem(SecureKeys.REFRESH_TOKEN, refreshToken),
  ]);
}

/**
 * Retrieve both auth tokens
 */
export async function getAuthTokens(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> {
  const [accessToken, refreshToken] = await Promise.all([
    getSecureItem(SecureKeys.ACCESS_TOKEN),
    getSecureItem(SecureKeys.REFRESH_TOKEN),
  ]);
  return { accessToken, refreshToken };
}

/**
 * Clear all auth-related secure storage
 */
export async function clearAuthTokens(): Promise<void> {
  await Promise.all([
    deleteSecureItem(SecureKeys.ACCESS_TOKEN),
    deleteSecureItem(SecureKeys.REFRESH_TOKEN),
    deleteSecureItem(SecureKeys.USER_ID),
  ]);
}
