/**
 * UPIAppPicker
 * A bottom-sheet style modal that lets the user select a UPI app
 * to complete their payment. Built with core React Native primitives
 * (Modal + Animated) — no additional dependencies required.
 */

import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  ImageSourcePropType,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { spacing, borderRadius } from '@/theme/spacing';
import { fontSize, fontWeight } from '@/theme/typography';
import { UPI_APPS, UPIApp } from '../constants/upi-apps';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = Math.min(520, SCREEN_HEIGHT * 0.65);
const ANIMATION_DURATION = 280;

interface UPIAppPickerProps {
  visible: boolean;
  onSelectApp: (app: UPIApp) => void;
  onClose: () => void;
}

export function UPIAppPicker({ visible, onSelectApp, onClose }: UPIAppPickerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Animate in / out when visibility changes
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: ANIMATION_DURATION - 50,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: SHEET_HEIGHT,
          duration: ANIMATION_DURATION - 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, backdropOpacity, translateY]);

  const handleSelect = useCallback(
    (app: UPIApp) => {
      onSelectApp(app);
      // Note: onClose is called by the parent after the intent fires
    },
    [onSelectApp],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop — tap to dismiss */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            styles.backdrop,
            { opacity: backdropOpacity },
          ]}
        />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.card,
            paddingBottom: insets.bottom + spacing.lg,
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Handle bar */}
        <View style={[styles.handleBar, { backgroundColor: colors.border }]} />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>
              Pay with UPI
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Select an app to complete payment
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeButton, { backgroundColor: colors.surface }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* App list */}
        <View style={styles.appList}>
          {UPI_APPS.map((app, index) => (
            <TouchableOpacity
              key={app.packageName}
              style={[
                styles.appRow,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
                index === 0 && styles.firstRow,
              ]}
              onPress={() => handleSelect(app)}
              activeOpacity={0.7}
            >
              {/* Icon */}
              <View
                style={[
                  styles.iconWrapper,
                  { backgroundColor: colors.background },
                ]}
              >
                <Image
                  source={app.icon as ImageSourcePropType}
                  style={styles.appIcon}
                  resizeMode="contain"
                />
              </View>

              {/* Name */}
              <Text style={[styles.appName, { color: colors.text }]}>
                {app.name}
              </Text>

              {/* Arrow */}
              <View
                style={[
                  styles.arrowWrapper,
                  { backgroundColor: `${colors.primary}15` },
                ]}
              >
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={colors.primary}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer note */}
        <Text style={[styles.footerNote, { color: colors.textTertiary }]}>
          App will open with payment details pre-filled
        </Text>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill as object,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    paddingTop: spacing.sm,
    // Subtle shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: borderRadius.full,
    alignSelf: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: fontSize.sm,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  appList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  firstRow: {
    // no extra styling — just a named anchor for future use
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  iconWrapper: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appIcon: {
    width: 34,
    height: 34,
  },
  appName: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  arrowWrapper: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerNote: {
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
});
