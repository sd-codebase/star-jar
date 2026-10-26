import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { kf, useLoop } from "@/lib/anim";
import { sky } from "@/theme";
import { T } from "./ui";

const ITEMS = ["⭐", "✨", "☁️", "🌟", "💫", "⭐", "☁️", "✨", "🌈", "⭐", "💖", "🌟"];
const FLOATERS = ITEMS.map((emoji, i) => ({
  emoji,
  left: (i * 83) % 100,
  top: (i * 47 + 7) % 95,
  size: 18 + ((i * 13) % 30),
  dur: (5 + (i % 5)) * 1000,
  delay: i * 400,
}));

/** `linear-gradient(160deg, sky-a 0%, sky-b 55%, sky-c 100%)` with floating stars & clouds. */
export default function SkyBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={[sky.a, sky.b, sky.c]} locations={[0, 0.55, 1]} start={{ x: 0.33, y: 0.03 }} end={{ x: 0.67, y: 0.97 }} style={StyleSheet.absoluteFill} />
      {FLOATERS.map((f, i) => (
        <Floater key={i} {...f} />
      ))}
    </View>
  );
}

function Floater({ emoji, left, top, size, dur, delay }: (typeof FLOATERS)[number]) {
  const p = useLoop(dur, delay);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: kf(p.value, [0, -24, 0]) }, { rotate: `${kf(p.value, [0, 12, -12, 0])}deg` }, { scale: kf(p.value, [1, 1.15, 1]) }],
  }));
  return (
    <Animated.View style={[{ position: "absolute", left: `${left}%`, top: `${top}%`, opacity: 0.6 }, style]}>
      <T style={{ fontSize: size, lineHeight: size * 1.25 }}>{emoji}</T>
    </Animated.View>
  );
}
