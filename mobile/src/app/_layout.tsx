import { Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold, useFonts } from "@expo-google-fonts/fredoka";
import { DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import ConfettiHost from "@/components/Confetti";
import SkyBackground from "@/components/SkyBackground";
import { Btn, Card, T } from "@/components/ui";
import { dismissError, load, useStore } from "@/lib/store";
import { fs, tw } from "@/theme";

void SplashScreen.preventAutoHideAsync();

// iOS paints the native stack container with the theme background, which would cover SkyBackground.
const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: "transparent" } };

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Fredoka_400Regular, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold });
  const status = useStore((s) => s.status);
  const hasName = useStore((s) => !!s.data?.me.name);
  const ready = fontsLoaded && status !== "loading";

  useEffect(() => void load(), []);
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  // Logged in *and* named → the app; otherwise the login flow (which also asks a new parent's name).
  const inApp = status === "authed" && hasName;

  return (
    <SafeAreaProvider>
      <ThemeProvider value={theme}>
        <StatusBar style="light" />
        <View style={{ flex: 1 }}>
          <SkyBackground />
          {ready &&
            (status === "error" ? (
              <LoadError />
            ) : (
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "transparent" }, animation: "fade" }}>
                <Stack.Protected guard={inApp}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="kid/[id]" />
                  <Stack.Screen name="parent" />
                </Stack.Protected>
                <Stack.Protected guard={!inApp}>
                  <Stack.Screen name="login" />
                </Stack.Protected>
              </Stack>
            ))}
          <ConfettiHost />
          <Toast />
        </View>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function LoadError() {
  const error = useStore((s) => s.error);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>
      <Card style={{ maxWidth: 384, padding: 24, alignItems: "center" }}>
        <T style={{ fontSize: fs["5xl"], lineHeight: fs["5xl"] * 1.2 }}>🌧️</T>
        <T w={600} style={{ marginTop: 8, fontSize: fs.xl, textAlign: "center" }}>
          {error ?? "Couldn't load Star Jar."}
        </T>
        <Btn bg={tw.purple600} label="Try again" onPress={() => void load()} style={{ marginTop: 16, paddingHorizontal: 24 }} />
      </Card>
    </View>
  );
}

function Toast() {
  const error = useStore((s) => s.error);
  const status = useStore((s) => s.status);
  const insets = useSafeAreaInsets();
  if (!error || status === "error") return null;
  return (
    <Animated.View entering={FadeInDown} exiting={FadeOutDown} style={{ position: "absolute", left: 16, right: 16, bottom: insets.bottom + 16, alignItems: "center", zIndex: 100 }}>
      <Pressable onPress={dismissError} style={{ width: "100%", maxWidth: 448, borderRadius: 16, backgroundColor: tw.red600, paddingHorizontal: 16, paddingVertical: 12, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
        <T w={600} style={{ color: tw.white }}>
          ⚠️ {error}
        </T>
      </Pressable>
    </Animated.View>
  );
}
