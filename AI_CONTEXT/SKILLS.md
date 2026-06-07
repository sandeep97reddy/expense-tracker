# Skills Context

This document provides context on the specific development skills, patterns, and library nuances used in the Paisa Track project.

## 1. NativeWind v4 (CSS Interop)
- We use `react-native-css-interop` alongside NativeWind v4.
- **Config:** The metro bundler is specifically configured in `metro.config.js` with `withNativeWind` pointing to `./global.css`.
- **Global CSS:** `global.css` MUST be imported at the very top of `App.tsx` for styles to load correctly.

## 2. Zustand + MMKV Persistence
- We persist Zustand stores securely and synchronously using `react-native-mmkv`.
- Because MMKV does not use `Promise` based APIs like `AsyncStorage`, the custom `zustandMMKVStorage` adapter inside `src/services/storage/mmkv.ts` returns values synchronously. 
- However, Zustand's rehydration can still cause a flash of empty UI. We handle this using `useStoreHydration.ts`, which listens to `persist.onFinishHydration` for all stores and blocks the `RootNavigator` rendering until complete.

## 3. Expo Router vs React Navigation
- **Note:** We are using `@react-navigation/native-stack` explicitly. We are **NOT** using `expo-router`.
- File-based routing is not used. Routes are manually configured in `src/navigation/RootNavigator.tsx` and `TabNavigator.tsx`. Deep linking is handled in `linking.ts`.

## 4. Worklets & JSI Bridging
- We use the New Architecture (Fabric).
- Reanimated v4 and MMKV v4 both use **Nitro Modules** (JSI) rather than the old React Native bridge. 
- When building ProGuard rules for release, always ensure `com.margelo.nitro.**` and `com.reactnativemmkv.**` are kept, or the app will crash in production builds with missing class definitions.
