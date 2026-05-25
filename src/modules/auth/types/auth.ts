/**
 * Authentication type definitions
 */

/** User profile information from Google/OAuth */
export interface User {
  id: string;
  email: string;
  name: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
  locale?: string;
}

/** Authentication status */
export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'guest';

/** Standard auth response */
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}
