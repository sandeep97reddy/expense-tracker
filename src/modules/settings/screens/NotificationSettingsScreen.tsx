import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/store/useAppStore';
import { useTranslation } from '@/hooks/useTranslation';
import { AppText as Text } from '@/components/ui';
import { fontSize, fontWeight } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { notificationService } from '@/services/notifications/notificationService';

export function NotificationSettingsScreen() {
  const { colors } = useTheme();
  const { t, isRTL } = useTranslation();
  const navigation = useNavigation();

  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled);
  const dailyReminderEnabled = useAppStore((s) => s.dailyReminderEnabled);
  const budgetAlertsEnabled = useAppStore((s) => s.budgetAlertsEnabled);

  const setNotificationsEnabled = useAppStore((s) => s.setNotificationsEnabled);
  const setDailyReminderEnabled = useAppStore((s) => s.setDailyReminderEnabled);
  const setBudgetAlertsEnabled = useAppStore((s) => s.setBudgetAlertsEnabled);

  const textAlignment = isRTL ? 'right' : 'left';
  const flexDirectionStyle = isRTL ? 'row-reverse' : 'row';

  const handleMasterToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    
    if (value) {
      // Request permissions
      const token = await notificationService.registerForPushNotificationsAsync();
      if (!token) {
        // If permission denied, revert toggle
        setNotificationsEnabled(false);
        setDailyReminderEnabled(false);
        setBudgetAlertsEnabled(false);
        return;
      }
    } else {
      // Cancel all if disabled
      await notificationService.cancelAllScheduledNotifications();
      setDailyReminderEnabled(false);
      setBudgetAlertsEnabled(false);
    }
  };

  const handleDailyReminderToggle = async (value: boolean) => {
    if (!notificationsEnabled) return;
    setDailyReminderEnabled(value);
    if (value) {
      // Schedule for 8:00 PM everyday as default
      await notificationService.scheduleDailyReminder(
        20,
        0,
        t('notifications.reminderTitle'),
        t('notifications.reminderBody')
      );
    } else {
      await notificationService.cancelAllScheduledNotifications();
    }
  };

  const handleBudgetAlertsToggle = (value: boolean) => {
    if (!notificationsEnabled) return;
    setBudgetAlertsEnabled(value);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, flexDirection: flexDirectionStyle }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, textAlign: textAlignment }]}>
          {t('notifications.title')}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, textAlign: textAlignment }]}>
          {t('notifications.subtitle')}
        </Text>

        {/* Master Toggle */}
        <View style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: flexDirectionStyle }]}>
          <View style={[styles.iconBox, { backgroundColor: `${colors.primary}1A` }]}>
            <Ionicons name="notifications-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.settingTitle, { color: colors.text, textAlign: textAlignment }]}>
              {t('notifications.masterToggle')}
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleMasterToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        {/* Daily Reminder */}
        <View style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: flexDirectionStyle, opacity: notificationsEnabled ? 1 : 0.5 }]}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
            <Ionicons name="alarm-outline" size={20} color="#10B981" />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.settingTitle, { color: colors.text, textAlign: textAlignment }]}>
              {t('notifications.dailyReminder')}
            </Text>
            <Text style={[styles.settingSubtitle, { color: colors.textSecondary, textAlign: textAlignment }]}>
              {t('notifications.dailyReminderSubtitle')}
            </Text>
          </View>
          <Switch
            value={dailyReminderEnabled}
            onValueChange={handleDailyReminderToggle}
            disabled={!notificationsEnabled}
            trackColor={{ false: colors.border, true: '#10B981' }}
          />
        </View>

        {/* Budget Alerts */}
        <View style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: flexDirectionStyle, opacity: notificationsEnabled ? 1 : 0.5 }]}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
            <Ionicons name="warning-outline" size={20} color="#F59E0B" />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.settingTitle, { color: colors.text, textAlign: textAlignment }]}>
              {t('notifications.budgetAlerts')}
            </Text>
            <Text style={[styles.settingSubtitle, { color: colors.textSecondary, textAlign: textAlignment }]}>
              {t('notifications.budgetAlertsSubtitle')}
            </Text>
          </View>
          <Switch
            value={budgetAlertsEnabled}
            onValueChange={handleBudgetAlertsToggle}
            disabled={!notificationsEnabled}
            trackColor={{ false: colors.border, true: '#F59E0B' }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    padding: 4,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    flex: 1,
  },
  content: { padding: spacing.lg },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },
  settingRow: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginBottom: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: { flex: 1 },
  settingTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  settingSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});
