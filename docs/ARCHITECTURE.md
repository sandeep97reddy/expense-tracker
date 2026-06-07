# System Architecture

Paisa Track is a local-first personal finance application built using the modern React Native ecosystem. The architecture prioritizes offline-first availability, high-performance data storage, and type-safe module domains.

## Core Stack
- **Framework:** Expo SDK 56 & React Native 0.85 (New Architecture / Fabric enabled).
- **Language:** TypeScript (Strict mode).
- **State Management:** Zustand.
- **Persistence Layer:** MMKV (via `react-native-mmkv` Nitro Modules implementation).
- **Styling:** NativeWind v4 (Tailwind CSS mapped to React Native via `react-native-css-interop`).
- **Navigation:** React Navigation v7 (Native Stack + Bottom Tabs).
- **Form Validation:** React Hook Form + Zod.

---

## Folder Structure

The project follows a **Domain-Driven Module Structure**. Instead of grouping by technical type (e.g., all screens together, all components together), files are grouped by their business domain (`src/modules/*`).

```text
src/
├── components/          # Global, dumb UI components (Buttons, Inputs, Spinners)
├── hooks/               # Global custom hooks (useTheme, useTranslation)
├── modules/             # Domain-specific logic
│   ├── analytics/       # Charting, budget calculations
│   ├── auth/            # Google OAuth, Guest mode login
│   ├── dashboard/       # Main overview screen and recent items
│   ├── settings/        # Preferences and notification settings
│   ├── transactions/    # CRUD logic, categories, forms
│   ├── upi/             # QR scanning, Intent launcher, UPI parsing
│   └── workspaces/      # Multi-ledger management
├── navigation/          # React Navigation routers and types
├── services/            # Third-party integrations (Logger, MMKV setup, SecureStore)
├── store/               # Global stores (App UI state, Global Theme)
├── theme/               # Design tokens and ThemeProvider implementation
├── types/               # Global TypeScript definitions
└── utils/               # Helper functions
```

---

## Data Flow

Paisa Track operates on a **Local-First Architecture**.

1. **User Input:** User interacts with UI components (e.g., adds a transaction).
2. **Form Validation:** `Zod` validates the input via `react-hook-form`.
3. **Zustand Action:** The component dispatches a state change to the relevant domain store (e.g., `useTransactionStore`).
4. **Persistence:** The Zustand store uses a custom `zustandMMKVStorage` adapter. The state is synchronously written to disk using JSI/Nitro Modules via MMKV.
5. **Rehydration:** On app boot, `useStoreHydration` blocks the UI until all critical stores have loaded from MMKV into memory.

---

## Navigation Flow

The navigation is split into an Authenticated vs. Unauthenticated stack.

- **RootNavigator (`RootNavigator.tsx`)**
  - **Auth Stack:** If `status === 'unauthenticated'`, shows `LoginScreen`.
  - **Main Stack:** If `status === 'authenticated' | 'guest'`, shows the `TabNavigator`.
  - **Global Modals:** Screens like `AddTransaction`, `Scanner`, and `Payment` are presented as full-screen modals overlaying the entire app.

---

## Backend Architecture

Currently, there is **no dedicated cloud backend**. 

- **Storage:** All transactions, categories, and settings are stored locally on the device via MMKV.
- **Authentication:** `expo-auth-session` is used for Google OAuth. The resulting access tokens are stored in `expo-secure-store`.
- **Identity:** Auth tokens are currently used primarily to verify identity and allow entry into the app, with the potential to sync to Google Drive or a remote backend in future roadmap phases.
