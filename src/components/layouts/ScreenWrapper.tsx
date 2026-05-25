/**
 * ScreenWrapper — standard screen container
 * Provides SafeAreaView, StatusBar, optional scroll, and keyboard avoidance.
 */

import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/spacing';

interface ScreenWrapperProps {
  /** Screen content */
  children: React.ReactNode;
  /** Enable scroll */
  scroll?: boolean;
  /** Add horizontal padding */
  padded?: boolean;
  /** Custom background color */
  backgroundColor?: string;
  /** Additional container style */
  style?: ViewStyle;
  /** SafeArea edges to apply */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function ScreenWrapper({
  children,
  scroll = false,
  padded = true,
  backgroundColor,
  style,
  edges = ['top'],
}: ScreenWrapperProps) {
  const { colors } = useTheme();
  const bg = backgroundColor ?? colors.background;

  const content = (
    <View
      style={[
        styles.content,
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={edges}>
      {scroll ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
