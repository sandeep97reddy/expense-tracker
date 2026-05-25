/**
 * AppText — themed text component
 * Variants: heading, subheading, body, caption, label
 * Automatically applies theme colors.
 */

import React from 'react';
import {
  Text as RNText,
  type TextProps as RNTextProps,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { fontSize, fontWeight as fw, lineHeight } from '@/theme/typography';

export type TextVariant = 'heading' | 'subheading' | 'body' | 'bodySmall' | 'caption' | 'label';

interface AppTextProps extends RNTextProps {
  /** Typography variant */
  variant?: TextVariant;
  /** Override color */
  color?: string;
  /** Center text */
  center?: boolean;
  /** Bold override */
  bold?: boolean;
  children: React.ReactNode;
}

export function AppText({
  variant = 'body',
  color,
  center = false,
  bold = false,
  style,
  children,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();

  const variantStyle = variantStyles[variant];
  const resolvedColor = color ?? variantStyle.color(colors);

  return (
    <RNText
      style={[
        variantStyle.style,
        { color: resolvedColor },
        center && styles.center,
        bold && styles.bold,
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
}

type Colors = ReturnType<typeof useTheme>['colors'];

const variantStyles: Record<TextVariant, {
  style: object;
  color: (c: Colors) => string;
}> = {
  heading: {
    style: {
      fontSize: fontSize['2xl'],
      fontWeight: fw.bold,
      lineHeight: fontSize['2xl'] * lineHeight.tight,
    },
    color: (c) => c.text,
  },
  subheading: {
    style: {
      fontSize: fontSize.lg,
      fontWeight: fw.semibold,
      lineHeight: fontSize.lg * lineHeight.tight,
    },
    color: (c) => c.text,
  },
  body: {
    style: {
      fontSize: fontSize.base,
      fontWeight: fw.regular,
      lineHeight: fontSize.base * lineHeight.normal,
    },
    color: (c) => c.text,
  },
  bodySmall: {
    style: {
      fontSize: fontSize.sm,
      fontWeight: fw.regular,
      lineHeight: fontSize.sm * lineHeight.normal,
    },
    color: (c) => c.textSecondary,
  },
  caption: {
    style: {
      fontSize: fontSize.xs,
      fontWeight: fw.regular,
      lineHeight: fontSize.xs * lineHeight.normal,
    },
    color: (c) => c.textTertiary,
  },
  label: {
    style: {
      fontSize: fontSize.sm,
      fontWeight: fw.medium,
      lineHeight: fontSize.sm * lineHeight.normal,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
    },
    color: (c) => c.textSecondary,
  },
};

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  bold: { fontWeight: fw.bold },
});
