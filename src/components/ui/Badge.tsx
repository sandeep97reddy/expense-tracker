/**
 * Badge — colored label/tag
 */

import React from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { fontSize, fontWeight } from '@/theme/typography';
import { spacing, borderRadius } from '@/theme/spacing';

export type BadgeVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'
  | 'secondary';

interface BadgeProps {
  /** Label text */
  label: string;
  /** Color variant */
  variant?: BadgeVariant;
  /** Small size */
  small?: boolean;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
  /** Right icon (render prop) */
  rightIcon?: React.ReactNode;
}

export function Badge({
  label,
  variant = 'primary',
  small = false,
  style,
  rightIcon,
}: BadgeProps) {
  const { colors } = useTheme();

  const variantColors = getVariantColors(variant, colors);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: variantColors.bg },
        small && styles.small,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: variantColors.text },
          small && styles.smallLabel,
        ]}
      >
        {label}
      </Text>
      {rightIcon}
    </View>
  );
}

function getVariantColors(
  variant: BadgeVariant,
  colors: ReturnType<typeof useTheme>['colors'],
): { bg: string; text: string } {
  switch (variant) {
    case 'primary':
      return { bg: `${colors.primary}20`, text: colors.primary };
    case 'success':
      return { bg: `${colors.success}20`, text: colors.success };
    case 'warning':
      return { bg: `${colors.warning}20`, text: colors.warning };
    case 'error':
      return { bg: `${colors.error}20`, text: colors.error };
    case 'info':
      return { bg: `${colors.info}20`, text: colors.info };
    case 'secondary':
    case 'neutral':
      return { bg: colors.surface, text: colors.textSecondary };
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing['2xs'],
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  smallLabel: {
    fontSize: fontSize['2xs'],
  },
});
