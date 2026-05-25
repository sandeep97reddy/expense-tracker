/**
 * Divider — horizontal/vertical separator
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/spacing';
import { fontSize } from '@/theme/typography';

interface DividerProps {
  /** Optional label in the center */
  label?: string;
  /** Vertical spacing */
  spacing?: number;
  /** Orientation */
  direction?: 'horizontal' | 'vertical';
}

export function Divider({
  label,
  spacing: customSpacing,
  direction = 'horizontal',
}: DividerProps) {
  const { colors } = useTheme();
  const marginValue = customSpacing ?? spacing.lg;

  if (direction === 'vertical') {
    return (
      <View
        style={[
          styles.vertical,
          { backgroundColor: colors.divider, marginHorizontal: marginValue },
        ]}
      />
    );
  }

  if (label) {
    return (
      <View style={[styles.labelContainer, { marginVertical: marginValue }]}>
        <View style={[styles.line, { backgroundColor: colors.divider }]} />
        <Text style={[styles.label, { color: colors.textTertiary }]}>
          {label}
        </Text>
        <View style={[styles.line, { backgroundColor: colors.divider }]} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.horizontal,
        { backgroundColor: colors.divider, marginVertical: marginValue },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  horizontal: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  vertical: {
    width: StyleSheet.hairlineWidth,
    height: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
