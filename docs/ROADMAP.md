# Project Roadmap

This document outlines the planned future enhancements and architectural evolutions for Paisa Track.

## Phase 1: AI & Automation (Upcoming)

### 1. AI Categorization
- **Goal:** Automatically suggest the correct category (e.g., "Food", "Transport") based on the transaction payee name or note.
- **Implementation:** Integrate a lightweight local ML model or a minimal API call to an LLM provider to parse raw transaction strings.

### 2. OCR Receipt Scanning
- **Goal:** Allow users to take a photo of a physical receipt and automatically extract the total amount, date, and merchant name.
- **Implementation:** Utilize `react-native-vision-camera` in conjunction with an OCR text-recognition frame processor, feeding the extracted text into the `AddTransactionScreen`.

## Phase 2: Cloud & Web Convergence

### 1. Web Dashboard
- **Goal:** Provide a desktop-friendly interface for heavy financial analysis and bulk transaction editing.
- **Implementation:** Leverage Expo's universal web support. Since we use `NativeWind` and `Zustand`, much of the UI and state logic will translate directly to the web. The missing piece is replacing MMKV with `IndexedDB` for the web persistence adapter.

### 2. Cloud Sync (Opt-in)
- **Goal:** Allow users to sync their MMKV local data across multiple devices.
- **Implementation:** Implement a "Sync Engine" that backs up the serialized Zustand JSON string to Google Drive (via the user's existing OAuth token) or a dedicated Supabase/Firebase backend.

## Phase 3: Advanced Financial Tools

### 1. Investment Tracking
- **Goal:** Expand beyond simple expense tracking to track net worth, mutual funds, and stock portfolios.
- **Implementation:** Create a new Workspace type specifically for "Investments", integrating with open finance APIs to pull real-time asset valuations.

### 2. Shared Workspaces
- **Goal:** Allow spouses or business partners to contribute to the same ledger.
- **Implementation:** Requires shifting the architecture from local-first to local-first-with-CRDTs (Conflict-free Replicated Data Types) to merge offline edits asynchronously.
