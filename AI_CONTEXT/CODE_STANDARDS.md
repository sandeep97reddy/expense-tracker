# Code Standards & Conventions

This document outlines the strict coding standards enforced in the Paisa Track repository. AI agents must read and adhere to these rules before generating code.

## 1. TypeScript Strictness
- `strict: true` is enabled in `tsconfig.json`.
- **NO `any` Types:** Do not use `any`. Use `unknown` if the type is truly unknowable, or define a proper interface in `src/types/`.
- **Non-null Assertions:** Avoid `!`. Handle undefined states gracefully.

## 2. Folder Conventions (Domain-Driven)
Do not group files by their technical purpose (e.g., placing all contexts in a global `contexts/` folder). Place them inside their specific domain in `src/modules/`.

- Example: `src/modules/transactions/store/useTransactionStore.ts`
- Example: `src/modules/transactions/components/TransactionListItem.tsx`

Global UI components that are reused everywhere (Buttons, Inputs) belong in `src/components/ui/`.

## 3. Styling Standards (NativeWind)
- **Do NOT use `StyleSheet.create`** unless absolutely necessary for complex animations or dynamic values that Tailwind cannot handle.
- Use NativeWind `className` props for all styling.
- **Theme Colors:** Do not hardcode hex colors (e.g., `text-[#FF0000]`). Use the design system classes configured in `tailwind.config.js` or the custom `useTheme()` hook for dynamic styling that adapts to Light/Dark/AMOLED modes.
- Example: `className="text-text-primary bg-background dark:bg-background-dark"`

## 4. State Management (Zustand)
- Stores should be sliced based on their domain.
- Do not put all app state in a single store. We have `useAuthStore`, `useTransactionStore`, etc.
- Always use the custom `zustandMMKVStorage` adapter when persisting a store.

## 5. File Naming Conventions
- React Components and Screens: `PascalCase.tsx` (e.g., `DashboardScreen.tsx`).
- Hooks: `camelCase.ts` prefixed with `use` (e.g., `useThemeStore.ts`).
- Utility functions: `camelCase.ts` (e.g., `analyticsSelectors.ts`).
- Type definitions: `camelCase.ts` (e.g., `transaction.ts`).
