/// <reference types="nativewind/types" />

// CSS module declarations
declare module '*.css';

// Environment variable type declarations
declare module '@env' {
  export const EXPO_PUBLIC_API_BASE_URL: string;
  export const EXPO_PUBLIC_APP_ENV: 'development' | 'staging' | 'production';
  export const EXPO_PUBLIC_GOOGLE_CLIENT_ID: string;
  export const EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: string;
  export const EXPO_PUBLIC_APP_NAME: string;
  export const EXPO_PUBLIC_APP_VERSION: string;
}
