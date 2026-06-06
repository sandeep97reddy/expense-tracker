import { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * app.config.ts — Dynamic Expo configuration
 * Injects environment variables at build time for each EAS profile.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Paisa Track',
  slug: 'expense-tracker',
  scheme: 'paisatrack',
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
    bundleIdentifier: 'com.sandeep.paisatrack',
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
    package: 'com.sandeep.paisatrack',
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
      'android.permission.POST_NOTIFICATIONS',
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
    'expo-font',
    '@react-native-community/datetimepicker',
    'expo-sharing',
    [
      'expo-local-authentication',
      {
        faceIDPermission:
          'Allow Paisa Track to use Face ID for securing your app.',
      },
    ],
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
          'Allow Paisa Track to access your camera to scan UPI QR codes.',
        microphonePermission: false,
        recordAudioAndroid: false,
      },
    ],
  ],

  // Extra config injected into Constants.expoConfig.extra
  extra: {
    eas: {
      projectId: '68a432ca-fcde-46e8-9150-2935c8bbaba1',
    },
    appEnv: process.env.EXPO_PUBLIC_APP_ENV ?? 'development',
  },
});
