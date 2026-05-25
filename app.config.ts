import { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * app.config.ts — Dynamic Expo configuration
 * Injects environment variables at build time for each EAS profile.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'ExpenseTracker',
  slug: 'expense-tracker',
  scheme: 'expensetracker',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',

  // Runtime version for EAS Update compatibility
  runtimeVersion: {
    policy: 'appVersion',
  },

  // iOS
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.sandeep.expensetracker',
    infoPlist: {
      NSCameraUsageDescription:
        'ExpenseTracker needs camera access to scan UPI QR codes for payments.',
      NSPhotoLibraryUsageDescription:
        'ExpenseTracker needs photo library access to attach receipts to transactions.',
    },
  },

  // Android
  android: {
    adaptiveIcon: {
      backgroundColor: '#0D9488',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    package: 'com.sandeep.expensetracker',
    permissions: [
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.USE_BIOMETRIC',
      'android.permission.USE_FINGERPRINT',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.VIBRATE',
      'android.permission.SCHEDULE_EXACT_ALARM',
    ],
  },

  // Web
  web: {
    favicon: './assets/favicon.png',
  },

  // Expo plugins
  plugins: [
    'expo-secure-store',
    'expo-web-browser',
    '@react-native-community/datetimepicker',
    'expo-sharing',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#0D9488',
        defaultChannel: 'default',
        sounds: [],
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission:
          'Allow ExpenseTracker to access your camera to scan UPI QR codes.',
        microphonePermission: false,
        recordAudioAndroid: false,
      },
    ],
  ],

  // Extra config injected into Constants.expoConfig.extra
  extra: {
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? '',
    },
    appEnv: process.env.EXPO_PUBLIC_APP_ENV ?? 'development',
  },
});
