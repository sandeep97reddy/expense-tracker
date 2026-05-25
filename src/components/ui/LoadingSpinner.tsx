/**
 * LoadingSpinner — themed activity indicator
 */

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { fontSize } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'small' | 'large';
  /** Optional message below the spinner */
  message?: string;
  /** Full screen overlay */
  fullScreen?: boolean;
}

export function LoadingSpinner({
  size = 'large',
  message,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const { colors } = useTheme();

  const content = (
    <View style={styles.content}>
      <ActivityIndicator size={size} color={colors.primary} />
      {message && (
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </Text>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: colors.background }]}>
        {content}
      </View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
  },
  message: {
    marginTop: spacing.md,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
