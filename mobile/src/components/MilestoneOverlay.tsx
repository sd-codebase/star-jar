import { useEffect, useState } from "react";
import { BackHandler, Pressable, ScrollView, View } from "react-native";
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { milestoneMessage } from "@shared/messages";
import type { Milestone } from "@shared/types";
import { kf, useEnter, useLoop } from "@/lib/anim";
import { fireworks, sounds, speak } from "@/lib/fx";
import { fs, spring, tw } from "@/theme";
import Rays from "./Rays";
import { Btn3D, OutlineText, T } from "./ui";

/** Full-screen treasure reveal: shaking gift → tap → badge + real gift. */
export default function MilestoneOverlay({ milestone, kidName, onDone }: { milestone: Milestone | null; kidName: string; onDone: () => void }) {
  const [opened, setOpened] = useState(false);
  const [taps, setTaps] = useState(0);
  const insets = useSafeAreaInsets();

  // Like the web overlay, it can only be closed with "Yay!" — swallow Android back while it's up.
  useEffect(() => {
    if (!milestone) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, [milestone]);

  const tapGift = () => {
    sounds.tap();
    if (taps < 2) return setTaps((t) => t + 1);
    setOpened(true);
    sounds.fanfare();
    fireworks();
    if (milestone) void speak(`${milestoneMessage(kidName)} You got the ${milestone.title} badge!${milestone.gift ? ` And your gift is ${milestone.gift}!` : ""}`);
  };

  const done = () => {
    setOpened(false);
    setTaps(0);
    onDone();
  };

  return (
    <>
      {milestone && (
        <Animated.View
          key={milestone.id}
          entering={FadeIn}
          style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 50, backgroundImage: "linear-gradient(to bottom, rgba(49,46,129,0.95), rgba(107,33,168,0.95), rgba(190,24,93,0.95))" }}
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}>
            <Title text={opened ? "TREASURE!" : "You found a treasure!"} />

            <View style={{ marginTop: 16, width: 224, height: 224, alignItems: "center", justifyContent: "center" }}>
              {opened && <OpenRays />}
              {!opened ? <Gift taps={taps} onPress={tapGift} /> : <Badge badge={milestone.badge} />}
            </View>

            {!opened ? (
              <Pulse>
                <T w={700} style={{ marginTop: 24, textAlign: "center", fontSize: fs["2xl"], color: tw.white }}>
                  👆 Tap the gift {3 - taps} {3 - taps === 1 ? "time" : "times"}!
                </T>
              </Pulse>
            ) : (
              <Animated.View entering={FadeInDown.delay(500).springify()} style={{ marginTop: 16, alignItems: "center" }}>
                <T w={700} style={{ fontSize: fs["4xl"], color: tw.white, textAlign: "center" }}>
                  {milestone.title}
                </T>
                <T style={{ fontSize: fs.xl, color: tw.pink100 }}>{milestone.points} stars reached!</T>
                {milestone.gift ? (
                  <Btn3D bg={tw.yellow300} silent style={{ marginTop: 20, paddingHorizontal: 20, paddingVertical: 12 }}>
                    <T style={{ fontSize: fs.xl, color: tw.purple900, textAlign: "center" }}>
                      🎉 Your gift: <T w={700} style={{ fontSize: fs.xl, color: tw.purple900 }}>{milestone.gift}</T>
                    </T>
                    <T w={600} style={{ fontSize: fs.base, color: tw.purple900 }}>
                      Show this to Mom or Dad!
                    </T>
                  </Btn3D>
                ) : null}
                <Btn3D bg={tw.green400} scale={0.9} onPress={done} style={{ marginTop: 20, paddingHorizontal: 40, paddingVertical: 12 }}>
                  <T w={700} style={{ fontSize: fs["3xl"], color: tw.white }}>
                    Yay! 🥳
                  </T>
                </Btn3D>
              </Animated.View>
            )}
          </ScrollView>
        </Animated.View>
      )}
    </>
  );
}

function Title({ text }: { text: string }) {
  const y = useSharedValue(-100);
  useEffect(() => {
    y.value = -100;
    y.value = withSpring(0, spring(0.6));
  }, [y, text]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.View style={style}>
      <OutlineText style={{ textAlign: "center", fontSize: fs["4xl"], lineHeight: fs["4xl"] * 1.15, color: tw.yellow300 }}>{text}</OutlineText>
    </Animated.View>
  );
}

function OpenRays() {
  const s = useEnter(0, 0, 500);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Animated.View style={[{ position: "absolute", width: 403, height: 403, alignItems: "center", justifyContent: "center" }, style]}>
      <Rays size={403} duration={10000} />
    </Animated.View>
  );
}

function Gift({ taps, onPress }: { taps: number; onPress: () => void }) {
  // rotate [0,-12,12,-12,12,0] over 0.6s, then a 0.4s pause.
  const shake = useLoop(1000);
  const grow = useSharedValue(1);
  useEffect(() => {
    grow.value = withSpring(1 + taps * 0.15, spring(0.4, 400));
  }, [grow, taps]);
  const press = useSharedValue(0);
  const style = useAnimatedStyle(() => {
    const t = Math.min(1, shake.value / 0.6);
    return { transform: [{ rotate: `${kf(t, [0, -12, 12, -12, 12, 0])}deg` }, { scale: grow.value + press.value * 0.4 }] };
  });
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => (press.value = withSpring(1, { duration: 200 }))}
      onPressOut={() => (press.value = withSpring(0, { duration: 300 }))}
      hitSlop={30}
    >
      <Animated.View style={style}>
        <T style={{ fontSize: 128, lineHeight: 150 }}>🎁</T>
      </Animated.View>
    </Pressable>
  );
}

function Badge({ badge }: { badge: string }) {
  const s = useEnter(0.6, 0, 1000);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }, { rotate: `${(1 - s.value) * -180}deg` }] }));
  const beat = useLoop(1000);
  const beatStyle = useAnimatedStyle(() => ({ transform: [{ scale: kf(beat.value, [1, 1.15, 1]) }] }));
  return (
    <Animated.View
      style={[
        { width: 176, height: 176, borderRadius: 88, borderWidth: 8, borderColor: tw.yellow300, backgroundColor: tw.white, alignItems: "center", justifyContent: "center", boxShadow: "0 0 80px rgba(255,230,0,0.8)" },
        style,
      ]}
    >
      <Animated.View style={beatStyle}>
        <T style={{ fontSize: 96, lineHeight: 115 }}>{badge}</T>
      </Animated.View>
    </Animated.View>
  );
}

function Pulse({ children }: { children: React.ReactNode }) {
  const p = useLoop(800);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: kf(p.value, [1, 1.1, 1]) }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}
