# Security Practices

Because Paisa Track manages sensitive financial data, security is treated as a first-class citizen at the application level.

## 1. Authentication Mechanisms
- **OAuth 2.0:** The app uses Google OAuth (`expo-auth-session`) to authenticate users securely without ever handling or seeing the user's Google password.
- **Guest Mode:** If a user chooses not to authenticate, the app functions entirely offline, ensuring no data ever leaves the device.

## 2. Token Storage
Authentication tokens (Access Tokens, Refresh Tokens) are **never** stored in plain text or standard `AsyncStorage`.

- We utilize `expo-secure-store` (`src/services/storage/secureStore.ts`).
- On iOS, this utilizes the native encrypted **Keychain services**.
- On Android, this uses **EncryptedSharedPreferences** backed by Android Keystore.
- This ensures that even if a device is rooted or physically compromised, the session tokens remain encrypted at rest.

## 3. Biometric App Lock Validation
Financial data is protected from unauthorized physical access using the `AppLockOverlay` component.

- **Hardware Check:** On boot and upon returning from the background, the app checks for biometric hardware (`expo-local-authentication`).
- **Authentication Overlay:** If enabled by the user in Settings, the app obscures the UI and requires Face ID, Touch ID, or the device PIN to proceed.
- **Background Privacy:** The overlay automatically triggers via `AppState` listeners the moment the app is backgrounded, preventing sensitive data from leaking in the iOS/Android app switcher screenshots.

## 4. Input Validation & Injection Prevention
- All user inputs (Adding transactions, editing categories) are strictly validated using `Zod` schemas.
- Because there is no SQL database directly handling raw inputs (we use MMKV key-value JSON serialization), the app is immune to traditional SQL injection attacks.

## 5. Local Data Privacy
- **MMKV Storage:** Currently, MMKV storage is unencrypted at rest for performance reasons. Since the OS encrypts the entire filesystem on modern iOS and Android devices natively, additional app-level encryption was deemed unnecessary overhead for the current phase. (Note: MMKV *does* support encryption if required for a stricter security compliance in the future).
