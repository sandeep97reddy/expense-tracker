/**
 * Card — themed card container
 * Variants: elevated, flat
 * Optional: pressable with scale animation
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { spacing, borderRadius } from '@/theme/spacing';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export type CardVariant = 'elevated' | 'flat' | 'outlined';

interface CardProps {
  /** Card content */
  children: React.ReactNode;
  /** Visual variant */
  variant?: CardVariant;
  /** Make the card pressable */
  onPress?: () => void;
  /** Additional container style */
  style?: StyleProp<ViewStyle>;
  /** Test ID */
  testID?: string;
}

export function Card({
  children,
  variant = 'elevated',
  onPress,
  style,
  testID,
}: CardProps) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, { damping: 15 });
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, { damping: 15 });
    }
  };

  const variantStyle = getVariantStyle(variant, colors, isDark);

  if (onPress) {
    return (
      <AnimatedTouchable
        testID={testID}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={[styles.base, variantStyle, animatedStyle, style]}
      >
        {children}
      </AnimatedTouchable>
    );
  }

  return (
    <View testID={testID} style={[styles.base, variantStyle, style]}>
      {children}
    </View>
  );
}

function getVariantStyle(
  variant: CardVariant,
  colors: ReturnType<typeof useTheme>['colors'],
  isDark: boolean,
): ViewStyle {
  switch (variant) {
    case 'elevated':
      return {
        backgroundColor: colors.card,
        ...(isDark
          ? { borderWidth: 1, borderColor: colors.border }
          : {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 3,
            }),
      };
    case 'flat':
      return {
        backgroundColor: colors.surface,
      };
    case 'outlined':
      return {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border,
      };
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
});
