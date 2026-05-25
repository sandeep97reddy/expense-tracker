/**
 * Input — themed text input
 * Features: label, error state, left/right icons, react-hook-form compatible.
 */

import React, { forwardRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { fontSize, fontWeight } from '@/theme/typography';
import { spacing, borderRadius } from '@/theme/spacing';

interface InputProps extends TextInputProps {
  /** Label above the input */
  label?: string;
  /** Error message below the input */
  error?: string;
  /** Helper text below the input */
  helperText?: string;
  /** Left icon (render prop) */
  leftIcon?: React.ReactNode;
  /** Right icon (render prop) */
  rightIcon?: React.ReactNode;
  /** Container style override */
  containerStyle?: ViewStyle;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      containerStyle,
      style,
      ...rest
    },
    ref,
  ) => {
    const { colors } = useTheme();
    const hasError = !!error;

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {label}
          </Text>
        )}

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.surface,
              borderColor: hasError ? colors.error : colors.border,
            },
          ]}
        >
          {leftIcon && <View style={styles.icon}>{leftIcon}</View>}

          <TextInput
            ref={ref}
            style={[
              styles.input,
              { color: colors.text },
              leftIcon ? styles.inputWithLeftIcon : null,
              rightIcon ? styles.inputWithRightIcon : null,
              style,
            ]}
            placeholderTextColor={colors.textTertiary}
            selectionColor={colors.primary}
            {...rest}
          />

          {rightIcon && <View style={styles.icon}>{rightIcon}</View>}
        </View>

        {(error || helperText) && (
          <Text
            style={[
              styles.helperText,
              { color: hasError ? colors.error : colors.textTertiary },
            ]}
          >
            {error || helperText}
          </Text>
        )}
      </View>
    );
  },
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: fontSize.base,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  inputWithLeftIcon: {
    paddingLeft: spacing.xs,
  },
  inputWithRightIcon: {
    paddingRight: spacing.xs,
  },
  icon: {
    paddingHorizontal: spacing.md,
  },
  helperText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});
