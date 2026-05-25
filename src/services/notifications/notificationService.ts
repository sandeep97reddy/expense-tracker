import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  /**
   * Request permissions and get an Expo push token if granted.
   */
  async registerForPushNotificationsAsync(): Promise<string | undefined> {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        // Permission not granted
        return undefined;
      }
      try {
        const projectId =
          // @ts-ignore
          global?.expo?.modules?.Constants?.expoConfig?.extra?.eas?.projectId ?? 'expense-tracker';
        const pushTokenString = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
          })
        ).data;
        token = pushTokenString;
      } catch (e) {
        console.warn('Failed to get push token:', e);
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  },

  /**
   * Schedule an immediate local notification (useful for budget alerts)
   */
  async scheduleLocalNotification(title: string, body: string, data: any = {}) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // trigger immediately
    });
  },

  /**
   * Schedule a daily repeating reminder at a specific hour and minute
   */
  async scheduleDailyReminder(hour: number, minute: number, title: string, body: string) {
    // Cancel previous reminders first to avoid duplicates
    await this.cancelAllScheduledNotifications();

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  },

  /**
   * Cancel all locally scheduled notifications
   */
  async cancelAllScheduledNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },
};
