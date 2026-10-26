import type { ConfigContext, ExpoConfig } from "expo/config";

/** Override with EXPO_PUBLIC_API_URL (e.g. http://192.168.1.5:3000) to run against a local Next.js server. */
const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://star-jar-lovat.vercel.app";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Star Jar",
  slug: "star-jar",
  scheme: "starjar",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  backgroundColor: "#7b2ff7",
  ios: {
    bundleIdentifier: "com.jsleet.starjar",
    buildNumber: "1",
    supportsTablet: true,
    config: { usesNonExemptEncryption: false },
  },
  android: {
    package: "com.jsleet.starjar",
    // Bump for every Play Store upload.
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: "#7b2ff7",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    // Kids app on Play: ask for nothing it doesn't use. These come from Expo/library defaults;
    // the app never records audio, plays in the background, draws overlays or uses biometrics.
    blockedPermissions: [
      "android.permission.RECORD_AUDIO",
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
      "android.permission.SYSTEM_ALERT_WINDOW",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.USE_BIOMETRIC",
      "android.permission.USE_FINGERPRINT",
    ],
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    // Sound effects only: no microphone, no background playback service.
    ["expo-audio", { microphonePermission: false, recordAudioAndroid: false, enableBackgroundPlayback: false }],
    "expo-sharing",
    "@react-native-community/datetimepicker",
    "expo-font",
    ["expo-splash-screen", { image: "./assets/splash-icon.png", imageWidth: 160, backgroundColor: "#7b2ff7" }],
    // Play Store requirement: target Android 16 (API 36).
    ["expo-build-properties", { android: { targetSdkVersion: 36 } }],
    // Release builds are signed locally with the upload key (no EAS).
    "./plugins/withReleaseSigning",
  ],
  experiments: { typedRoutes: true },
  extra: { apiUrl: API_URL },
});
