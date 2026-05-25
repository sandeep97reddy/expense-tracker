/**
 * Button — reusable button component
 * Variants: primary, secondary, outline, ghost, danger
 * Sizes: sm, md, lg
 * Features: loading state, disabled state, press animation
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { fontSize, fontWeight } from '@/theme/typography';
import { spacing, borderRadius } from '@/theme/spacing';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  /** Button label */
  title: string;
  /** Press handler */
  onPress: () => void;
  /** Visual variant */
  variant?: ButtonVariant;
  /** Size */
  size?: ButtonSize;
  /** Show loading spinner instead of title */
  loading?: boolean;
  /** Disable interaction */
  disabled?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Left icon (render prop) */
  leftIcon?: React.ReactNode;
  /** Right icon (render prop) */
  rightIcon?: React.ReactNode;
  /** Additional container style */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  testID,
}: ButtonProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const isDisabled = disabled || loading;

  // Variant-based styles
  const variantStyles = getVariantStyles(variant, colors);
  const sizeStyles = getSizeStyles(size);

  return (
    <AnimatedTouchable
      testID={testID}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        variantStyles.container,
        sizeStyles.container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyles.textColor}
        />
      ) : (
        <>
          {leftIcon}
          <Text
            style={[
              styles.text,
              sizeStyles.text,
              { color: variantStyles.textColor },
            ]}
          >
            {title}
          </Text>
          {rightIcon}
        </>
      )}
    </AnimatedTouchable>
  );
}

function getVariantStyles(
  variant: ButtonVariant,
  colors: ReturnType<typeof useTheme>['colors'],
): { container: ViewStyle; textColor: string } {
  switch (variant) {
    case 'primary':
      return {
        container: { backgroundColor: colors.primary },
        textColor: colors.textInverse,
      };
    case 'secondary':
      return {
        container: { backgroundColor: colors.surface },
        textColor: colors.text,
      };
    case 'outline':
      return {
        container: {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.primary,
        },
        textColor: colors.primary,
      };
    case 'ghost':
      return {
        container: { backgroundColor: 'transparent' },
        textColor: colors.primary,
      };
    case 'danger':
      return {
        container: { backgroundColor: colors.error },
        textColor: '#FFFFFF',
      };
  }
}

function getSizeStyles(size: ButtonSize): {
  container: ViewStyle;
  text: TextStyle;
} {
  switch (size) {
    case 'sm':
      return {
        container: {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.sm,
        },
        text: { fontSize: fontSize.sm },
      };
    case 'md':
      return {
        container: {
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md,
          borderRadius: borderRadius.md,
        },
        text: { fontSize: fontSize.base },
      };
    case 'lg':
      return {
        container: {
          paddingHorizontal: spacing['2xl'],
          paddingVertical: spacing.lg,
          borderRadius: borderRadius.lg,
        },
        text: { fontSize: fontSize.lg },
      };
  }
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  text: {
    fontWeight: fontWeight.semibold,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});
