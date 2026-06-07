# Development Setup Guide

This guide outlines how to get the Paisa Track project running locally on your machine.

## Prerequisites
- **Node.js**: `v20.0.0` or higher.
- **npm**: `v10.0.0` or higher.
- **Android Studio** (for local Android emulation/building).
- **Git**

## 1. Local Setup
Clone the repository and install dependencies. Because this project uses `react-native-mmkv` v4 (which relies on Nitro Modules), ensure you use npm and avoid legacy package managers that hoist improperly.

```bash
git clone <repo-url>
cd expense-tracker
npm install
```

## 2. Environment Variables
Copy the sample environment file and fill in your specific keys.
```bash
cp .env.example .env
```
Ensure the following variables are set:
- `EXPO_PUBLIC_APP_ENV`: e.g., `development` or `production`.
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

## 3. Expo Setup & Running Locally

Because this app utilizes custom native code (MMKV, Vision Camera, Biometrics), **it cannot be run in standard Expo Go**. You must use a Development Build.

### Starting the Metro Bundler
Clear the cache aggressively if you change Babel configs:
```bash
npm start -- --clear
# or
npx expo start -c
```

### Running on Android Emulator/Device
To compile the native Android project and launch it on your connected device/emulator:
```bash
npm run android
# which triggers: npx expo run:android
```

## 4. Android Build Troubleshooting (Windows)

React Native projects with deep dependency trees often hit the Windows 260-character path limit, resulting in errors like:
`ninja: error: manifest 'build.ninja' still dirty after 100 tries`

**Fixes:**
1. Move the project folder as close to the root drive as possible (e.g., `C:\expense-tracker`).
2. Run `.\gradlew clean` from inside the `android/` directory to clear corrupted `.cxx` caches.
3. Enable Long Paths in the Windows Registry.

If native modules become out of sync, regenerate the native directories:
```bash
npx expo prebuild --clean --platform android
```

## 5. Build Instructions (EAS)

For cloud builds, use Expo Application Services (EAS). Ensure you are logged in via `eas login`.

**To build a testable APK (Preview Profile):**
```bash
npm run build:preview
# Runs: eas build --platform android --profile preview
```

**To build an App Bundle for Play Store (Production):**
```bash
npm run build:prod
# Runs: eas build --platform all --profile production
```
