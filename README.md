# HydroTrack 💧

A premium, offline-first mobile hydration tracking and reminder application built with **React Native 0.86**, **React 19**, and **Expo SDK 57**.

HydroTrack pairs living liquid physics with transactional SQLite persistence, 7-day intake analytics, unit preferences (ml / L), light/dark themes, and an adaptive notification engine designed around platform constraints.

---

## 🌟 Key Features

1. **Dashboard & Living Water Vessel**
   - Interactive SVG vessel featuring real-time water volume fill driven by spring physics (`react-native-reanimated`).
   - Dual-layer sinusoidal wave ripples with subtle celebratory pulses upon logging.
   - 3 Quick-add preset vessels (250 ml Glass, 500 ml Bottle, 750 ml Flask) with haptic touch feedback.
   - Dynamic streak calculation and contextual daily hydration coaching tips.

2. **Intake History & Interactive Calendar**
   - Day-by-day water timeline grouped by local calendar dates (00:00:00 to 23:59:59).
   - Horizontal 14-day quick date picker strip with relative labels ("Today", "Yesterday", weekdays).
   - Full-month calendar modal with active intake indicator dots and future-date protection.
   - Full CRUD support: log, edit amounts and timestamps, and delete entries with aggregate updates.

3. **Hydration Analytics & 7-Day Charts**
   - Interactive 7-day bar chart with dynamic scaling and a dashed daily goal reference line.
   - Color-coded bars distinguishing goal-achieved days, partial in-progress days ("Today"), and zero-intake days.
   - Comprehensive metrics: 7-day daily average (including zero-intake days), days goal achieved, completion percentage, total volume, and best day.
   - Screen-reader accessible textual summary compliant with WCAG accessibility guidelines.

4. **Settings & Customization**
   - **Daily Water Goal**: Validated 500 – 10,000 ml target persisted in SQLite.
   - **Appearance**: Seamless switching between System Default, Soft Neumorphic Light Aqua, and Obsidian Dark.
   - **Display Unit**: Seamless toggle between Millilitres (`ml`) and Litres (`L`) that formats presentation throughout all screens without mutating underlying stored millilitre integers.
   - **Reminder Engine**: Configurable reminder interval (15 to 360 min), active time window (`HH:MM` start to end with 30-min minimum span validation), and weekday schedule selector.
   - **Permission Diagnostics**: Real-time permission status check, recovery instructions, and direct deep-link into system device settings.
   - **Transactional Local Data Reset**: Atomic SQLite reset (`DELETE FROM water_logs; DELETE FROM settings;`) with automatic notification schedule reconciliation.
   - **Sample Data Seeder**: Pre-populates realistic 7-day logs across met, unmet, zero-intake, and partial days to test charts immediately.

---

## 🛠️ Technology Stack

| Component | Technology | Version |
|---|---|---|
| **Framework** | Expo | `~57.0.31` |
| **Runtime** | React Native | `0.86.3` |
| **UI Library** | React | `19.2.3` |
| **Navigation** | Expo Router (File-based) | `~57.0.29` |
| **Local Database** | Expo SQLite (WAL mode) | `~57.0.4` |
| **Reminders** | Expo Notifications | `~57.0.24` |
| **Animations** | React Native Reanimated | `4.5.1` |
| **Graphics** | React Native SVG | `15.15.4` |
| **Charts** | React Native Gifted Charts | `^1.4.81` |
| **Styling** | NativeWind / TailwindCSS | `^4.2.7` / `^3.4.19` |
| **Icons** | Lucide React Native | `^1.61.0` |
| **Fonts** | Plus Jakarta Sans | `@expo-google-fonts` |

---

## 📋 Prerequisites

- **Node.js**: `v18.0.0` or higher (`v20+` or `v24` recommended).
- **npm** or **bun**: For dependency resolution and script execution.
- **Expo CLI**: Bundled with `npx expo`.
- **EAS CLI** (Optional, for cloud builds): `npm install -g eas-cli` or `npx eas-cli@latest`.
- **Mobile Hardware / Emulators**:
  - **Android**: Android Studio emulator (API 31+) or physical Android device with USB debugging / Expo Go.
  - **iOS**: macOS with Xcode 15+ simulator or physical iOS device with Expo Go.

---

## 🚀 Installation & Startup

1. **Clone the repository and install dependencies**:
   ```bash
   git clone https://github.com/TejasKarambe/hydrotrack.git
   cd hydrotrack
   npm install
   ```

2. **Start the development server**:
   ```bash
   npx expo start
   ```

3. **Run on specific target platforms**:
   ```bash
   # Android emulator or connected device
   npx expo start --android

   # iOS simulator (macOS required)
   npx expo start --ios

   # Web browser preview
   npx expo start --web
   ```

---

## 🧪 Automated Testing & Verification

The test suite runs using the built-in Node.js test runner with `--experimental-strip-types`:

```bash
# Run all unit and integration test suites
npm test

# Run TypeScript strict type-check
npx tsc --noEmit

# Run Expo ESLint verification
npm run lint

# Run Expo Doctor environment diagnostic
npx expo-doctor
```

### Test Suite Coverage (73 Unit & Integration Tests)
- `tests/hydration.test.ts`: Water amount validation, total sums, remaining volume, progress capping, streak calculation, local day boundaries, and midnight safety.
- `tests/reminders.test.ts`: Time window string parsing (`HH:MM`), window span validation, interval boundaries, rolling occurrence generator, past-date filtering, inactive weekday filtering, iOS 64-limit compliance, and notification deduplication.
- `tests/analytics.test.ts`: 7-day range generation, month transitions, midnight timezone partitioning, zero-intake averages, dynamic goal change adaptations, and calendar grid matrix generation.
- `tests/settings_and_units.test.ts`: Display unit formatting (`ml` vs `L`), token contrast and palette integrity, settings key-value serialization/deserialization, and transactional reset invariants.

---

## 📱 Platform Testing (Hardware vs. Simulator vs. Code Inference)

| Feature | Verified on Real Hardware | Verified in Simulator / Emulator | Inferred from Code & Unit Tests |
|---|---|---|---|
| **SQLite WAL Operations & Migrations** | Tested on Android Device | Tested in Node / Expo Go | Invariants verified in `tests/settings_and_units.test.ts` |
| **Reanimated Wave Physics & Spring** | 60 FPS verified on Device | Verified on Emulator | Animation interpolations tested |
| **Notification Scheduling (`DATE` trigger)** | Tested on Android 14 Hardware | Tested on Android Emulator | Tested in `tests/reminders.test.ts` |
| **Notification Response / Tap Navigation** | Verified (opens `/log-water`) | Verified on Emulator | Verified with deduplicator logic |
| **Theme Switching (Light / Dark / System)** | Verified across restarts | Verified | Verified in token tests |
| **Exact Alarm Permissions (Android 12+)** | Verified permission flow | Verified on API 34 | Handled via `Platform.OS === 'android'` checks |
| **iOS 64-Notification Ceiling Safeguard** | - | - | Enforced by 48-slot cap in `generateReminderOccurrences` |

---

## 🔔 Notifications & Permissions Guide

### Architecture
HydroTrack implements a **rolling local reminder window**:
1. When reminders are configured, HydroTrack calculates future occurrences adhering to active hours (`reminder_start_time` to `reminder_end_time`), reminder interval, and selected weekdays.
2. It caps upcoming scheduled occurrences at **48 slots**, well below the iOS hard system ceiling of 64 scheduled notifications.
3. Upon app launch or return from background (`AppState === 'active'`), reminders are automatically reconciled to purge expired slots and schedule fresh future occurrences.

### Platform Considerations & Limitations
- **Android Notification Channels**: HydroTrack registers high-priority channels (`water-reminders` and `water-reminders-test`). In Expo Go on Android, custom channel creation is restricted by the client wrapper; custom channels take full effect in Development Client or Production standalone builds.
- **Android Exact Alarms (`SCHEDULE_EXACT_ALARM`)**: On Android 12+ (API 31+), exact alarms require permission. HydroTrack includes `SCHEDULE_EXACT_ALARM` in `app.json` and gracefully handles permission denial with non-blocking recovery prompts.
- **Battery Optimization / Doze Mode**: Aggressive OEM battery savers (Xiaomi, Samsung, Huawei) may defer background alerts when the screen is off for extended periods. Users are guided to exclude HydroTrack from aggressive battery savers.
- **iOS Rolling Limits**: iOS restricts apps to a maximum of 64 local notifications. HydroTrack schedules up to 48 rolling slots, guaranteeing that slots are never dropped by iOS.
- **Device Reboot & Timezone Changes**: Local notifications survive standard restarts on modern iOS and Android. If the user crosses timezones, opening the app triggers `reconcileScheduledReminders()` to align future occurrences to the new local time.

---

## 🎨 NativeWind Setup Notes

- **Tailwind Config**: `tailwind.config.js` scans `./app/**/*.{js,jsx,ts,tsx}` and `./src/**/*.{js,jsx,ts,tsx}`.
- **Metro Bundler**: Wrapped with `withNativeWind(config, { input: './global.css' })` in `metro.config.js`.
- **Babel**: Uses `babel-preset-expo` with `nativewind/babel` preset.
- **TypeScript**: Includes `nativewind-env.d.ts` reference for typed class names.

---

## 📦 Building with EAS (Expo Application Services)

EAS configuration is provided in `eas.json` for development clients, internal distribution previews, and store builds.

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Log in to your Expo account
eas login

# 3. Build a Development Client (Recommended for custom native modules & notification channels)
eas build --profile development --platform android
eas build --profile development --platform ios

# 4. Build an internal preview APK (Android)
eas build --profile preview --platform android

# 5. Production store build
eas build --profile production --platform all
```

---

## ⚠️ Known Limitations

1. **Expo Go Android Push Notifications**: Push (remote) notifications in Expo Go for Android are unsupported since SDK 53. HydroTrack utilizes **100% local notifications**, which remain supported. For full custom notification channels on Android, a development build (`eas build --profile development` or `npx expo run:android`) is recommended.
2. **Strict Background Wakeups**: On Android devices with aggressive power-saving policies, alerts scheduled during deep sleep may trigger when the device next turns on its screen.
3. **Data Portability**: HydroTrack is 100% offline-first. There is no cloud sync or account registration. Uninstalling the app removes the local SQLite database unless a device backup is restored.

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
