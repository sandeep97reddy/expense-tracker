import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, AppState, AppStateStatus, TouchableOpacity } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/store/useAppStore';
import { AppText as Text } from '@/components/ui';

export function AppLockOverlay() {
  const { colors } = useTheme();
  const isAppLockEnabled = useAppStore(state => state.isAppLockEnabled);
  
  // Start locked if lock is enabled
  const [isLocked, setIsLocked] = useState(isAppLockEnabled);
  const [authFailed, setAuthFailed] = useState(false);

  const authenticate = useCallback(async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // Fallback if hardware isn't available but setting is enabled somehow
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
    } catch (e) {
      console.warn('App Lock Auth Error', e);
      setAuthFailed(true);
    }
  }, []);

  useEffect(() => {
    // Initial check on mount
    if (isAppLockEnabled && isLocked) {
      authenticate();
    }
  }, [isAppLockEnabled]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (!isAppLockEnabled) return;

      // Lock when going to background
      if (nextAppState === 'background') {
        setIsLocked(true);
        setAuthFailed(false);
      } 
      // Prompt when coming back to active
      else if (nextAppState === 'active' && isLocked) {
        authenticate();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isAppLockEnabled, isLocked, authenticate]);

  if (!isAppLockEnabled || !isLocked) {
    return null; // Do not render anything, let the app show
  }

  return (
    <View style={[styles.overlay, { backgroundColor: colors.background }]}>
      <Ionicons name="lock-closed" size={64} color={colors.primary} style={styles.icon} />
      <Text variant="heading" bold style={[styles.title, { color: colors.text }]}>
        PaisaTrack is Locked
      </Text>
      
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
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999999, // High z-index to overlay everything
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
  }
});
