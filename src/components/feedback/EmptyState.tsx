/**
 * EmptyState — reusable empty/placeholder UI
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { fontSize, fontWeight } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface EmptyStateProps {
  /** Icon name */
  icon?: IoniconsName;
  /** Title */
  title: string;
  /** Description */
  description?: string;
  /** CTA button label */
  actionLabel?: string;
  /** CTA button handler */
  onAction?: () => void;
}

export function EmptyState({
  icon = 'folder-open-outline',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={56} color={colors.textTertiary} />
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {description && (
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <View style={styles.action}>
          <Button title={actionLabel} onPress={onAction} variant="outline" size="sm" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['3xl'],
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  description: {
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  action: {
    marginTop: spacing.xl,
  },
});
