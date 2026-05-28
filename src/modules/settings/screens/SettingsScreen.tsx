/**
 * SettingsScreen — user preferences, theme controls, and shared workspaces management.
 */

import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Modal, FlatList, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/modules/auth/store/useAuthStore';
import { useWorkspaceStore } from '@/modules/workspaces/store/useWorkspaceStore';
import { useAppStore } from '@/store/useAppStore';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, Badge, AppText as Text } from '@/components/ui';
import { fontSize, fontWeight } from '@/theme/typography';
import { spacing, borderRadius } from '@/theme/spacing';
import type { LanguageCode, CurrencyCode } from '@/types/common';

const LANGUAGES: { code: LanguageCode; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: '🇺🇸 English' },
  { code: 'hi', label: 'Hindi', native: '🇮🇳 हिन्दी' },
  { code: 'es', label: 'Spanish', native: '🇪🇸 Español' },
  { code: 'fr', label: 'French', native: '🇫🇷 Français' },
  { code: 'de', label: 'German', native: '🇩🇪 Deutsch' },
  { code: 'pt', label: 'Portuguese', native: '🇵🇹 Português' },
  { code: 'zh', label: 'Chinese', native: '🇨🇳 中文' },
  { code: 'ja', label: 'Japanese', native: '🇯🇵 日本語' },
  { code: 'ar', label: 'Arabic', native: '🇦🇪 العربية' },
  { code: 'ru', label: 'Russian', native: '🇷🇺 Русский' },
];

const CURRENCIES: { code: CurrencyCode; symbol: string; label: string }[] = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', label: 'Chinese Yuan' },
];

export function SettingsScreen() {
  const { colors, mode, cycleTheme } = useTheme();
  const { t, isRTL } = useTranslation();
  const navigation = useNavigation<any>();

  const authUser = useAuthStore((s) => s.user);
  const isGuest = useAuthStore((s) => s.isGuest);
  const signOut = useAuthStore((s) => s.signOut);
  
  const workspaces = useWorkspaceStore((s) => s.workspaces);

  // App-level state store
  const activeLanguage = useAppStore((s) => s.language);
  const activeCurrency = useAppStore((s) => s.currency);
  const isAppLockEnabled = useAppStore((s) => s.isAppLockEnabled);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const setCurrency = useAppStore((s) => s.setCurrency);
  const setAppLockEnabled = useAppStore((s) => s.setAppLockEnabled);

  // Modal Visibility States
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);

  const themeModeLabel = {
    light: `☀️ ${t('settings.themeLight', 'Light')}`,
    dark: `🌙 ${t('settings.themeDark', 'Dark')}`,
    amoled: `🖤 ${t('settings.themeAmoled', 'AMOLED')}`,
  }[mode];

  const currentLanguageLabel = LANGUAGES.find((l) => l.code === activeLanguage)?.native || activeLanguage;
  const currentCurrencyLabel = CURRENCIES.find((c) => c.code === activeCurrency)
    ? `${CURRENCIES.find((c) => c.code === activeCurrency)?.symbol} ${activeCurrency}`
    : activeCurrency;

  const handleSignOut = () => {
    signOut();
  };

  const toggleAppLock = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        Alert.alert(t('common.error', 'Not Available'), 'Biometric authentication is not set up on this device.');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: isAppLockEnabled ? 'Authenticate to disable App Lock' : 'Authenticate to enable App Lock',
        fallbackLabel: 'Use PIN',
      });

      if (result.success) {
        setAppLockEnabled(!isAppLockEnabled);
      }
    } catch (e) {
      console.warn('AppLock toggle error', e);
    }
  };

  const textAlignment = isRTL ? 'right' : 'left';
  const flexDirectionStyle = isRTL ? 'row-reverse' : 'row';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text, textAlign: textAlignment }]}>
          {t('settings.title')}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card Section */}
        <Card style={styles.profileCard}>
          <View style={[styles.profileRow, { flexDirection: flexDirectionStyle }]}>
            <View style={[styles.profileAvatar, { backgroundColor: `${colors.primary}1A` }]}>
              <Ionicons name={isGuest ? 'person-circle-outline' : 'person'} size={32} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileName, { color: colors.text, textAlign: textAlignment }]}>
                {isGuest ? t('settings.offlineMode') : authUser?.name || t('settings.syncedAccount')}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: textAlignment }}>
                {isGuest ? 'Offline local database' : authUser?.email || ''}
              </Text>
            </View>
            <Badge 
              label={isGuest ? 'GUEST' : 'SYNCED'} 
              variant={isGuest ? 'warning' : 'success'} 
            />
          </View>
        </Card>

        {/* Preferences Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, textAlign: textAlignment }]}>
          {t('settings.preferences', 'PREFERENCES')}
        </Text>

        {/* App Language Tile */}
        <TouchableOpacity
          onPress={() => setLangModalVisible(true)}
          style={[
            styles.settingsTile,
            { backgroundColor: colors.card, borderColor: colors.border, flexDirection: flexDirectionStyle },
          ]}
          activeOpacity={0.7}
        >
          <View style={[styles.tileIconBox, { backgroundColor: `${colors.primary}1A` }]}>
            <Ionicons name="language-outline" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
            <Text style={[styles.tileTitle, { color: colors.text }]}>{t('settings.language')}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{t('settings.languageSubtitle')}</Text>
          </View>
          <Text style={[styles.tileValueText, { color: colors.primary }]}>{currentLanguageLabel}</Text>
          <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={colors.textTertiary} />
        </TouchableOpacity>

        {/* Preferred Currency Tile */}
        <TouchableOpacity
          onPress={() => setCurrencyModalVisible(true)}
          style={[
            styles.settingsTile,
            { backgroundColor: colors.card, borderColor: colors.border, flexDirection: flexDirectionStyle },
          ]}
          activeOpacity={0.7}
        >
          <View style={[styles.tileIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
            <Ionicons name="cash-outline" size={20} color="#10B981" />
          </View>
          <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
            <Text style={[styles.tileTitle, { color: colors.text }]}>{t('settings.currency')}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{t('settings.currencySubtitle')}</Text>
          </View>
          <Text style={[styles.tileValueText, { color: '#10B981' }]}>{currentCurrencyLabel}</Text>
          <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={colors.textTertiary} />
        </TouchableOpacity>

        {/* Theme Tile */}
        <TouchableOpacity
          onPress={cycleTheme}
          style={[
            styles.settingsTile,
            { backgroundColor: colors.card, borderColor: colors.border, flexDirection: flexDirectionStyle },
          ]}
          activeOpacity={0.7}
        >
          <View style={[styles.tileIconBox, { backgroundColor: 'rgba(13, 148, 136, 0.1)' }]}>
            <Ionicons name={mode === 'light' ? 'sunny-outline' : 'moon-outline'} size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
            <Text style={[styles.tileTitle, { color: colors.text }]}>{t('settings.displayTheme')}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{t('settings.themeSubtitle')}</Text>
          </View>
          <Text style={[styles.tileValueText, { color: colors.primary }]}>{themeModeLabel}</Text>
          <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={colors.textTertiary} />
        </TouchableOpacity>

        {/* Notifications Tile */}
        <TouchableOpacity
          onPress={() => navigation.navigate('NotificationSettings')}
          style={[
            styles.settingsTile,
            { backgroundColor: colors.card, borderColor: colors.border, flexDirection: flexDirectionStyle },
          ]}
          activeOpacity={0.7}
        >
          <View style={[styles.tileIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
            <Ionicons name="notifications-outline" size={20} color="#3B82F6" />
          </View>
          <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
            <Text style={[styles.tileTitle, { color: colors.text }]}>{t('notifications.title') || 'Notifications'}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{t('notifications.subtitle') || 'Manage alerts and reminders'}</Text>
          </View>
          <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={colors.textTertiary} />
        </TouchableOpacity>

        {/* Configuration Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: spacing.xl, textAlign: textAlignment }]}>
          {t('settings.appSettings')}
        </Text>

        {/* Shared Workspace Tile */}
        <TouchableOpacity
          onPress={() => navigation.navigate('WorkspaceManager')}
          style={[
            styles.settingsTile,
            { backgroundColor: colors.card, borderColor: colors.border, flexDirection: flexDirectionStyle },
          ]}
          activeOpacity={0.7}
        >
          <View style={[styles.tileIconBox, { backgroundColor: 'rgba(124, 58, 237, 0.1)' }]}>
            <Ionicons name="people-outline" size={20} color={colors.transfer} />
          </View>
          <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
            <Text style={[styles.tileTitle, { color: colors.text }]}>{t('settings.familyWorkspaces')}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{t('settings.workspacesSubtitle')}</Text>
          </View>
          {workspaces.length > 0 && (
            <Badge label={t('settings.activeWorkspaces', { count: workspaces.length })} variant="primary" />
          )}
          <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={colors.textTertiary} />
        </TouchableOpacity>

        {/* Authentication Options */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: spacing.xl, textAlign: textAlignment }]}>
          {t('settings.accountSecurity', 'ACCOUNT & SECURITY')}
        </Text>

        {/* App Lock Tile */}
        <TouchableOpacity
          onPress={toggleAppLock}
          style={[
            styles.settingsTile,
            { backgroundColor: colors.card, borderColor: colors.border, flexDirection: flexDirectionStyle },
          ]}
          activeOpacity={0.7}
        >
          <View style={[styles.tileIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
            <Ionicons name="lock-closed-outline" size={20} color="#F59E0B" />
          </View>
          <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
            <Text style={[styles.tileTitle, { color: colors.text }]}>App Lock (Biometrics)</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Require fingerprint/face to open app</Text>
          </View>
          <Badge label={isAppLockEnabled ? 'ON' : 'OFF'} variant={isAppLockEnabled ? 'success' : 'default'} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSignOut}
          style={[
            styles.settingsTile,
            { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 40, flexDirection: flexDirectionStyle },
          ]}
          activeOpacity={0.7}
        >
          <View style={[styles.tileIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
          </View>
          <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
            <Text style={[styles.tileTitle, { color: colors.error }]}>{t('settings.disconnectSession')}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{t('settings.disconnectSubtitle')}</Text>
          </View>
          <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      </ScrollView>

      {/* LANGUAGE SELECTION MODAL */}
      <Modal
        visible={langModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLangModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border, flexDirection: flexDirectionStyle }]}>
              <Text style={[styles.modalTitle, { color: colors.text, flex: 1, textAlign: textAlignment }]}>
                {t('settings.language')}
              </Text>
              <TouchableOpacity onPress={() => setLangModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => {
                const isSelected = item.code === activeLanguage;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      setLanguage(item.code);
                      setLangModalVisible(false);
                    }}
                    style={[
                      styles.modalItem,
                      { borderBottomColor: colors.border, flexDirection: flexDirectionStyle },
                    ]}
                  >
                    <Text style={[styles.modalItemText, { color: isSelected ? colors.primary : colors.text, flex: 1, textAlign: textAlignment }]}>
                      {item.native}
                    </Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* CURRENCY SELECTION MODAL */}
      <Modal
        visible={currencyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border, flexDirection: flexDirectionStyle }]}>
              <Text style={[styles.modalTitle, { color: colors.text, flex: 1, textAlign: textAlignment }]}>
                {t('settings.currency')}
              </Text>
              <TouchableOpacity onPress={() => setCurrencyModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={CURRENCIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => {
                const isSelected = item.code === activeCurrency;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      setCurrency(item.code);
                      setCurrencyModalVisible(false);
                    }}
                    style={[
                      styles.modalItem,
                      { borderBottomColor: colors.border, flexDirection: flexDirectionStyle },
                    ]}
                  >
                    <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                      <Text style={[styles.modalItemText, { color: isSelected ? '#10B981' : colors.text }]}>
                        {item.symbol} {item.code}
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{item.label}</Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color="#10B981" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  profileCard: {
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  profileRow: {
    alignItems: 'center',
    gap: spacing.md,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  settingsTile: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginBottom: 12,
  },
  tileIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTitle: {
    fontSize: fontSize.base - 1,
    fontWeight: fontWeight.bold,
  },
  tileValueText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '75%',
    paddingBottom: 30,
  },
  modalHeader: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  modalItem: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});
