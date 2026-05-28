/**
 * LoginScreen
 * The main authentication entry point for the app.
 */

import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { ScreenWrapper } from '@/components/layouts';
import { AppText } from '@/components/ui';
import { Button } from '@/components/ui';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { useAuthStore } from '../store/useAuthStore';
import { useGoogleAuth } from '../services/googleAuth';
import { spacing } from '@/theme/spacing';

export function LoginScreen() {
  const { colors } = useTheme();
  const { status, continueAsGuest } = useAuthStore();
  const { isReady, promptAsync } = useGoogleAuth();

  const isLoading = status === 'loading';

  const handleGoogleSignIn = () => {
    if (isReady) {
      promptAsync();
    }
  };

  return (
    <ScreenWrapper style={styles.container} padded backgroundColor={colors.background}>
      <View style={styles.content}>
        
        {/* Branding / Header */}
        <View style={styles.header}>
          <View style={[styles.logoPlaceholder, { backgroundColor: colors.primary }]}>
            <AppText variant="heading" color="#FFFFFF" bold>P</AppText>
          </View>
          <AppText variant="heading" bold style={styles.title}>
            Paisa Track
          </AppText>
          <AppText variant="body" color={colors.textSecondary} center style={styles.subtitle}>
            Take control of your finances locally, securely, and seamlessly.
          </AppText>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <GoogleSignInButton 
            onPress={handleGoogleSignIn} 
            loading={isLoading} 
          />
          
          <View style={styles.divider}>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
            <AppText variant="caption" color={colors.textTertiary} style={styles.dividerText}>
              OR
            </AppText>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
          </View>

          <Button
            title="Continue without Sign In"
            variant="secondary"
            onPress={continueAsGuest}
            disabled={isLoading}
            fullWidth
          />
          
          <AppText variant="caption" center style={styles.termsText}>
            By continuing, you agree to our Terms of Service and Privacy Policy. Data is stored locally on your device in offline mode.
          </AppText>
        </View>
        
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: spacing['3xl'],
  },
  header: {
    alignItems: 'center',
    marginTop: spacing['3xl'],
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    marginBottom: spacing.sm,
  },
  subtitle: {
    paddingHorizontal: spacing.xl,
  },
  actions: {
    width: '100%',
    gap: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  line: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: spacing.md,
  },
  termsText: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    lineHeight: 18,
  },
});
