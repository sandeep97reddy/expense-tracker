# Instructions for Future AI Agents

Hello, AI Agent! If you are reading this, you have been tasked with modifying the Paisa Track repository. Please adhere strictly to the following rules:

## 1. Do Not Hallucinate Features
- Read `docs/FEATURES.md` and `docs/ARCHITECTURE.md` before making assumptions.
- This is a Local-First app. Do not write code to fetch from REST APIs or GraphQL endpoints for transaction data unless explicitly instructed to migrate to the cloud.

## 2. Aesthetics & UI Guidelines
- **Premium Aesthetics:** Never create simple "Minimum Viable Product" UI. The UI must feel dynamic, premium, and use modern typography/micro-animations.
- **Theme-Aware:** All components MUST support Light, Dark, and AMOLED themes. Do not hardcode a black background; use `colors.background` from `useTheme()` or the nativewind `dark:` variant.

## 3. Dealing with Windows Limitations
- If the USER asks you to build the Android app (`gradlew assembleRelease` or `expo run:android`), be aware that the USER is on Windows.
- If the build crashes with `ninja: error: manifest 'build.ninja' still dirty after 100 tries`, it is because the Windows 260-character path limit has been hit. Do NOT try to modify code to fix this. Instruct the user to move their project directory closer to the `C:\` root.

## 4. Dependencies & Bridging
- We use React Native 0.85 (New Architecture / Fabric enabled) and Expo SDK 56.
- We use `react-native-mmkv` v4 which uses **Nitro Modules**. 
- Do **NOT** install `react-native-worklets-core`. It conflicts with the new `react-native-worklets` package required by MMKV and will crash the release APK instantly.

## 5. Artifacts and Planning
- When given a complex task, always create an `implementation_plan.md` artifact to present your architectural approach.
- Once approved, track your execution via `task.md`.
- Keep changes atomic and do not delete existing docstrings.
