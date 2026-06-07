# Architecture Decisions Record (ADR)

This document tracks the major technical decisions, tradeoffs, and library choices made during the development of Paisa Track.

## 1. Local-First Storage Strategy
**Decision:** Store all transactional and settings data locally on the device rather than relying on a remote cloud database.
**Tradeoffs:**
- *Pros:* Instant load times, full offline capability, zero cloud infrastructure costs, inherently better privacy for sensitive financial data.
- *Cons:* Data is tied to the physical device. Loss of device means loss of data unless an export/backup mechanism is used.
**Libraries Selected:** `react-native-mmkv`.

## 2. State Management: Zustand vs Redux
**Decision:** Use Zustand for global state management.
**Why Chosen:**
- Redux requires heavy boilerplate (reducers, actions, dispatchers).
- Zustand provides a minimal hooks-based API.
- Zustand integrates seamlessly with MMKV via the `persist` middleware, allowing us to automatically serialize state to disk with zero manual mapping.

## 3. High-Performance Persistence (MMKV)
**Decision:** Use MMKV over AsyncStorage.
**Why Chosen:**
- `AsyncStorage` relies on SQLite/JSON and crosses the asynchronous React Native bridge, making it too slow for loading thousands of transactions synchronously on boot.
- `react-native-mmkv` uses JSI/Nitro Modules to read/write synchronously from C++ memory buffers. It allows the app to boot instantly without loading spinners.

## 4. UI Framework: NativeWind v4
**Decision:** Use NativeWind for styling.
**Why Chosen:**
- It allows using Tailwind CSS utility classes directly in React Native components.
- Version 4 leverages `react-native-css-interop`, avoiding runtime style generation overhead and allowing complex styles (like hover states or responsive breakpoints) to map natively to StyleSheet.

## 5. Navigation: React Navigation Native Stack
**Decision:** Use `@react-navigation/native-stack`.
**Why Chosen:**
- Unlike the older JS-based stack, native-stack uses the native iOS `UINavigationController` and Android `Fragment` APIs, ensuring the app feels 100% native with smooth 60fps gesture transitions.

## 6. Form Handling: React Hook Form + Zod
**Decision:** Manage forms using `react-hook-form` paired with `zod` for validation.
**Why Chosen:**
- Zod provides a strict TypeScript schema definition.
- React Hook Form avoids unnecessary re-renders when typing into text inputs, preventing lag on older Android devices when entering complex transaction details.
