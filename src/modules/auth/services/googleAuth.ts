/**
 * Google Auth Service
 * Helper service to manage Google OAuth using expo-auth-session.
 */

import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { useAuthStore } from '../store/useAuthStore';
import { useCallback, useEffect } from 'react';
import type { User } from '../types/auth';
import { getEnv } from '@/utils/env';

// Instruct WebBrowser to close after successful auth
WebBrowser.maybeCompleteAuthSession();

// Client IDs pulled from environment via getEnv helper
const GOOGLE_CLIENT_IDS = {
  webClientId: getEnv('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID') || 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  iosClientId: getEnv('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID') || 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  androidClientId: getEnv('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID') || 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
};

/**
 * Custom hook to manage Google Sign In flow.
 * Must be called inside a React component (e.g., LoginScreen).
 */
export function useGoogleAuth() {
  const { signIn, setLoading, setUnauthenticated } = useAuthStore();

  const redirectUri = makeRedirectUri({
    scheme: 'paisatrack',
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_CLIENT_IDS.webClientId,
    iosClientId: GOOGLE_CLIENT_IDS.iosClientId,
    androidClientId: GOOGLE_CLIENT_IDS.androidClientId,
    scopes: ['profile', 'email'],
    redirectUri,
  });

  const fetchUserInfo = useCallback(async (token: string) => {
    try {
      const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`Userinfo request failed: ${res.status}`);
      }

      const userInfo = await res.json();

      if (!userInfo?.id || !userInfo?.email) {
        throw new Error('Incomplete user profile from Google');
      }

      const user: User = {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        givenName: userInfo.given_name,
        familyName: userInfo.family_name,
        picture: userInfo.picture,
        locale: userInfo.locale,
      };

      await signIn(user, token);
    } catch (error) {
      console.error('[GoogleAuth] Failed to fetch user info:', error);
      setUnauthenticated();
    }
  }, [signIn, setUnauthenticated]);

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        setLoading();
        fetchUserInfo(authentication.accessToken);
      } else {
        setUnauthenticated();
      }
    } else if (response?.type === 'error') {
      console.error('[GoogleAuth] Sign in failed:', response.error);
      setUnauthenticated();
    } else if (response?.type === 'cancel' || response?.type === 'dismiss') {
      setUnauthenticated();
    }
  }, [response, setLoading, setUnauthenticated, fetchUserInfo]);

  const signInPrompt = useCallback(async () => {
    setLoading();
    try {
      await promptAsync();
    } catch (error) {
      console.error('[GoogleAuth] promptAsync failed:', error);
      setUnauthenticated();
    }
  }, [promptAsync, setLoading, setUnauthenticated]);

  return {
    isReady: !!request,
    signInPrompt,
  };
}
