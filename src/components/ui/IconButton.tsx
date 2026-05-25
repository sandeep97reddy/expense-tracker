/**
 * IconButton — circular icon button
 */

import React from 'react';
import { TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { spacing, borderRadius } from '@/theme/spacing';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps {
  /** Icon name from Ionicons */
  icon: IoniconsName;
  /** Press handler */
  onPress: () => void;
  /** Size variant */
  size?: IconButtonSize;
  /** Icon color override */
  color?: string;
  /** Background color override */
  backgroundColor?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Additional style */
  style?: ViewStyle;
  /** Test ID */
  testID?: string;
}

const SIZE_MAP: Record<IconButtonSize, { container: number; icon: number }> = {
  sm: { container: 32, icon: 16 },
  md: { container: 44, icon: 22 },
  lg: { container: 56, icon: 28 },
};

export function IconButton({
  icon,
  onPress,
  size = 'md',
  color,
  backgroundColor,
  disabled = false,
  style,
  testID,
}: IconButtonProps) {
  const { colors } = useTheme();
  const sizeConfig = SIZE_MAP[size];

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        {
          width: sizeConfig.container,
          height: sizeConfig.container,
          borderRadius: sizeConfig.container / 2,
          backgroundColor: backgroundColor ?? colors.surface,
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      <Ionicons
        name={icon}
        size={sizeConfig.icon}
        color={color ?? colors.text}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
