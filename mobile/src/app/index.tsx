import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withDelay, withSpring, ZoomIn, ZoomOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { pinFor, totalStars } from "@shared/rules";
import type { Kid } from "@shared/types";
import PinPad from "@/components/PinPad";
import { Btn3D, BtnText, Card, OutlineText, T } from "@/components/ui";
import { kf, useEnter, useLoop } from "@/lib/anim";
import { burst, sounds, speak } from "@/lib/fx";
import { setActiveKid, useData } from "@/lib/store";
import { fs, spring, tw } from "@/theme";

export default function Home() {
  const data = useData()!;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [picked, setPicked] = useState<Kid | null>(null);

  // Coming back home (🏠, back button, reopening the app) logs the child out, so the PIN is always asked.
  useFocusEffect(useCallback(() => setActiveKid(null), []));

  const pick = (kid: Kid) => {
    sounds.tap();
    void speak(`Hi ${kid.name}! Enter your secret code.`);
    setPicked(kid);
  };

  const submit = (pin: string) => {
    if (!picked || pin !== pinFor(picked.birthdate)) return false;
    setActiveKid(picked.id);
    sounds.good();
    burst();
    setPicked(null);
    router.push({ pathname: "/kid/[id]", params: { id: picked.id } });
    return true;
  };

  const logo = useEnter(0.6);
  const logoStyle = useAnimatedStyle(() => ({ transform: [{ scale: logo.value }, { rotate: `${(1 - logo.value) * -20}deg` }] }));
  const jar = useLoop(2500);
  const jarStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${kf(jar.value, [0, -10, 10, 0])}deg` }, { translateY: kf(jar.value, [0, -10, 0]) }] }));
  // Two per row on phones, three on wider screens (web: w-1/2, sm:w-1/3).
  const cols = width >= 640 ? 3 : 2;
  const cardW = (Math.min(width, 896) - 32 - 16 * (cols - 1)) / cols;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ alignItems: "center", paddingHorizontal: 16, paddingTop: insets.top + 32, paddingBottom: insets.bottom + 64 }}>
        <Animated.View style={[{ marginTop: 48, alignItems: "center" }, logoStyle]}>
          <Animated.View style={jarStyle}>
            <T style={{ fontSize: fs["8xl"], lineHeight: fs["8xl"] * 1.2, textShadowColor: "rgba(0,0,0,0.15)", textShadowOffset: { width: 0, height: 10 }, textShadowRadius: 10 }}>🫙</T>
          </Animated.View>
          <View style={{ marginTop: 8 }}>
            <OutlineText shadow={6} style={{ fontSize: fs["5xl"], lineHeight: fs["5xl"] * 1.15, color: tw.yellow300, letterSpacing: 0.5 }}>
              Star Jar
            </OutlineText>
          </View>
          <T w={600} style={{ marginTop: 12, fontSize: fs["2xl"], color: tw.white, textShadowColor: "rgba(0,0,0,0.1)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>
            Who&apos;s playing today?
          </T>
        </Animated.View>

        {data.kids.length === 0 ? (
          <Card style={{ marginTop: 40, maxWidth: 448, padding: 32, alignItems: "center" }}>
            <T style={{ fontSize: fs["6xl"], lineHeight: fs["6xl"] * 1.2 }}>👋</T>
            <T w={600} style={{ marginTop: 12, fontSize: fs.xl, textAlign: "center" }}>
              Welcome! Ask a grown-up to add players first.
            </T>
            <Btn3D bg={tw.yellow400} onPress={() => router.push("/parent")} style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12 }}>
              <BtnText color="#2b1055" style={{ fontSize: fs.xl }}>
                Set up Star Jar →
              </BtnText>
            </Btn3D>
          </Card>
        ) : (
          <View style={{ marginTop: 40, width: "100%", maxWidth: 896, flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 16 }}>
            {data.kids.map((kid, i) => (
              <KidButton key={kid.id} kid={kid} i={i} width={cardW} stars={totalStars(data.entries.filter((e) => e.kidId === kid.id))} onPress={() => pick(kid)} />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={{ position: "absolute", right: 16, top: insets.top + 16 }}>
        <Btn3D bg="rgba(255,255,255,0.9)" onPress={() => router.push("/parent")} style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
          <BtnText color={tw.purple800} style={{ fontSize: fs.sm }}>
            👨‍👩‍👧 Parents
          </BtnText>
        </Btn3D>
      </View>

      {picked && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={[StyleSheet.absoluteFill, { zIndex: 40 }]}>
          <Pressable onPress={() => setPicked(null)} style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", padding: 16, backgroundColor: "rgba(59,7,100,0.6)" }]}>
            <Animated.View entering={ZoomIn.springify().damping(12)} exiting={ZoomOut}>
              <Pressable onPress={() => {}}>
                <Card style={{ alignItems: "center", padding: 20 }}>
                  <Pressable onPress={() => setPicked(null)} hitSlop={12} style={{ position: "absolute", right: 16, top: 12 }}>
                    <T style={{ fontSize: fs["3xl"], color: tw.purple400 }}>✕</T>
                  </Pressable>
                  <View style={{ width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", backgroundColor: picked.color }}>
                    <T style={{ fontSize: fs["6xl"], lineHeight: fs["6xl"] * 1.2 }}>{picked.avatar}</T>
                  </View>
                  <T w={700} numberOfLines={1} style={{ marginTop: 8, fontSize: fs["3xl"] }}>
                    Hi {picked.name}!
                  </T>
                  <View style={{ marginTop: 16 }}>
                    <PinPad onSubmit={submit} hint="Your secret code: birthday day + month 🎂" />
                  </View>
                </Card>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

function KidButton({ kid, i, width, stars, onPress }: { kid: Kid; i: number; width: number; stars: number; onPress: () => void }) {
  const y = useSharedValue(80);
  const o = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(200 + i * 120, withSpring(0, spring(0.5)));
    o.value = withDelay(200 + i * 120, withSpring(1, spring(0)));
  }, [y, o, i]);
  const enter = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateY: y.value }] }));
  const bob = useLoop(1600, i * 300);
  const bobStyle = useAnimatedStyle(() => ({ transform: [{ translateY: kf(bob.value, [0, -8, 0]) }] }));

  return (
    <Animated.View style={[{ width }, enter]}>
      <Btn3D bg={kid.color} scale={0.9} onPress={onPress} silent style={{ padding: 16 }}>
        <Animated.View style={[{ width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.9)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)" }, bobStyle]}>
          <T style={{ fontSize: fs["6xl"], lineHeight: fs["6xl"] * 1.2 }}>{kid.avatar}</T>
        </Animated.View>
        <T w={700} numberOfLines={1} style={{ marginTop: 12, width: "100%", textAlign: "center", fontSize: fs["2xl"], color: tw.white, textShadowColor: "rgba(0,0,0,0.1)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>
          {kid.name}
        </T>
        <View style={{ marginTop: 4, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.2)", paddingHorizontal: 12, paddingVertical: 2 }}>
          <T style={{ fontSize: fs.lg, color: tw.white }}>⭐ {stars}</T>
        </View>
      </Btn3D>
    </Animated.View>
  );
}
