import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, AppState, AppStateStatus, TouchableOpacity } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/store/useAppStore';
import { AppText as Text } from '@/components/ui';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function AppLockOverlay() {
  const { colors } = useTheme();
  const isAppLockEnabled = useAppStore((state) => state.isAppLockEnabled);

  const [isLocked, setIsLocked] = useState(isAppLockEnabled);
  const [authFailed, setAuthFailed] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const authenticate = useCallback(async () => {
    setIsAuthenticating(true);
    setAuthFailed(false);

    try {
      // Safely check if biometric hardware/enrollment exists
      let hasHardware = false;
      let isEnrolled = false;
      try {
        hasHardware = await LocalAuthentication.hasHardwareAsync();
        isEnrolled = await LocalAuthentication.isEnrolledAsync();
      } catch {
        // Native module not available — skip lock entirely
        setIsLocked(false);
        setIsAuthenticating(false);
        return;
      }

      if (!hasHardware || !isEnrolled) {
        setIsLocked(false);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock PaisaTrack',
        fallbackLabel: 'Use PIN',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        setIsLocked(false);
        setAuthFailed(false);
      } else {
        setAuthFailed(true);
      }
    } catch {
      // Any unhandled error — don't crash, just show retry
      setAuthFailed(true);
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  useEffect(() => {
    if (isAppLockEnabled && isLocked) {
      authenticate();
    }
  }, [isAppLockEnabled]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (!isAppLockEnabled) return;

      if (nextAppState === 'background') {
        setIsLocked(true);
        setAuthFailed(false);
      } else if (nextAppState === 'active' && isLocked) {
        authenticate();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isAppLockEnabled, isLocked, authenticate]);

  if (!isAppLockEnabled || !isLocked) {
    return null;
  }

  return (
    <View style={[styles.overlay, { backgroundColor: colors.background }]}>
      <Ionicons name="lock-closed" size={64} color={colors.primary} style={styles.icon} />
      <Text variant="heading" bold style={[styles.title, { color: colors.text }]}>
        PaisaTrack is Locked
      </Text>

      {isAuthenticating ? (
        <LoadingSpinner message="Authenticating..." />
      ) : (
        <>
          {authFailed && (
            <Text style={[styles.error, { color: colors.error }]}>
              Authentication failed. Please try again.
            </Text>
          )}

          <TouchableOpacity
            onPress={authenticate}
            style={[styles.button, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Unlock</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 999999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
  },
  error: {
    marginBottom: 24,
    fontWeight: '500',
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
