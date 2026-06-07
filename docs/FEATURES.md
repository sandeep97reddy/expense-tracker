# Implemented Features

Paisa Track is a full-featured personal finance application. Below is the documentation of the currently implemented features, user flows, and screens.

## 1. Authentication & Security
- **OAuth Integration:** Users can log in using their Google account via `expo-auth-session`.
- **Guest Mode:** Users can bypass authentication to use the app in a fully offline "Guest" mode.
- **Biometric App Lock:** Uses `expo-local-authentication` to display an overlay (`AppLockOverlay.tsx`) requiring FaceID/Fingerprint/PIN before the app reveals any financial data.

## 2. Main User Flows & Screens

### Dashboard (`DashboardScreen.tsx`)
- Displays a high-level overview of the current financial state.
- Shows total balance, recent transactions list, and quick-action buttons.
- Pull-to-refresh syncs data and recalculates balances.

### Transactions Management (`TransactionsScreen.tsx` / `AddTransactionScreen.tsx`)
- **CRUD Operations:** Users can add, edit, or delete transactions.
- **Form Validation:** Input forms use `react-hook-form` + `Zod` to ensure required fields (amount, category, date) are correctly formatted.
- **Categorization:** Built-in category lists for tracking where money is spent (e.g., Food, Travel, Utility).
- **Detail View:** A modal (`TransactionDetailScreen.tsx`) displays the full receipt or note attached to the ledger entry.

### Analytics & Budgeting (`AnalyticsScreen.tsx`)
- **Visual Insights:** Uses `react-native-gifted-charts` to plot Donut charts of spending by category.
- **Time Filtering:** Users can filter reports by week, month, or custom date ranges.
- **Budget Tracking:** Integrates with `useBudgetStore` to calculate remaining safe-to-spend limits based on user-defined monthly caps.

### Workspaces (`WorkspaceManagerScreen.tsx`)
- **Multi-Ledger Support:** Users can create isolated "Workspaces" to separate personal finances from business expenses or joint family tracking.

---

## 3. UPI Scanner Flow

A core feature for the Indian context is the built-in UPI QR scanner and intent launcher.

- **Scanning (`ScannerScreen.tsx`):**
  Uses `expo-camera` to scan QR codes. The `upi-parser.ts` service decodes standard `upi://pay` deep links to extract the payee name, VPA (UPI ID), amount, and transaction notes.
- **Payment Gateway (`PaymentScreen.tsx`):**
  Presents the extracted data to the user for confirmation. If the QR code omitted the amount, the user is prompted to enter it.
- **App Launcher (`upi-launcher.ts`):**
  Uses native Intent schemes to launch specific banking apps (e.g., GPay, PhonePe, Paytm) installed on the device, passing the structured transaction data to them.

---

## 4. Settings & Preferences
- **Themes:** Supports Light, Dark, and AMOLED modes (`ThemeProvider.tsx`), persisted securely via MMKV.
- **Notifications:** Configurable daily reminders using `expo-notifications`.
