import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { kf, useEnter, useLoop } from "@/lib/anim";
import { fs, spring, tw } from "@/theme";
import Rays from "./Rays";
import { Btn3D, Card, OutlineText, T } from "./ui";

export type Feedback = {
  id: string;
  kind: "good" | "bad" | "blocked";
  emoji: string;
  title: string;
  text: string;
  points?: number;
};

const RING = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2);

export default function FeedbackOverlay({ feedback, onClose }: { feedback: Feedback | null; onClose: () => void }) {
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(onClose, feedback.kind === "blocked" ? 2500 : 4000);
    return () => clearTimeout(t);
  }, [feedback, onClose]);

  return (
    <>
      {feedback && (
        <Animated.View key={feedback.id} entering={FadeIn} exiting={FadeOut} style={[StyleSheet.absoluteFill, { zIndex: 40 }]}>
          <Pressable
            onPress={onClose}
            style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", overflow: "hidden", padding: 16, backgroundColor: feedback.kind === "bad" ? "rgba(15,23,42,0.7)" : "rgba(59,7,100,0.5)" }]}
          >
            {feedback.kind === "good" && <Good f={feedback} />}
            {feedback.kind === "bad" && <Bad f={feedback} />}
            {feedback.kind === "blocked" && <Blocked f={feedback} />}
          </Pressable>
        </Animated.View>
      )}
    </>
  );
}

function Good({ f }: { f: Feedback }) {
  const enter = useEnter(0.6);
  const enterStyle = useAnimatedStyle(() => ({ transform: [{ scale: enter.value }, { rotate: `${(1 - enter.value) * -30}deg` }] }));
  const pulse = useLoop(800);
  const emojiStyle = useAnimatedStyle(() => ({ transform: [{ scale: kf(pulse.value, [1, 1.25, 1]) }, { rotate: `${kf(pulse.value, [0, -12, 12, 0])}deg` }] }));
  const title = useEnter(0.7, 200);
  const titleStyle = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - title.value) * 40 }, { scale: 0.5 + title.value * 0.5 }] }));
  const pts = useSharedValue(0);
  useEffect(() => {
    pts.value = withDelay(400, withSequence(withTiming(1.5, { duration: 250 }), withTiming(1, { duration: 250 })));
  }, [pts]);
  const ptsStyle = useAnimatedStyle(() => ({ transform: [{ scale: pts.value }] }));

  return (
    <Animated.View style={[{ alignItems: "center" }, enterStyle]}>
      <Rays size={320} style={{ top: -64 }} />
      <View style={{ width: 192, height: 192, alignItems: "center", justifyContent: "center" }}>
        {RING.map((a, i) => (
          <RingStar key={i} angle={a} emoji={i % 2 ? "⭐" : "✨"} />
        ))}
        <Animated.View style={emojiStyle}>
          <T style={{ fontSize: 104, lineHeight: 125 }}>{f.emoji}</T>
        </Animated.View>
      </View>
      <Animated.View style={[{ marginTop: 8 }, titleStyle]}>
        <OutlineText shadow={6} style={{ fontSize: fs["5xl"], lineHeight: fs["5xl"] * 1.15, color: tw.yellow300, textAlign: "center" }}>
          {f.title}
        </OutlineText>
      </Animated.View>
      <Animated.View style={[{ marginTop: 16 }, ptsStyle]}>
        <Btn3D bg={tw.yellow300} silent style={{ paddingHorizontal: 24, paddingVertical: 8 }}>
          <T w={700} style={{ fontSize: fs["3xl"], color: tw.purple900 }}>
            +{f.points} ⭐
          </T>
        </Btn3D>
      </Animated.View>
      <T w={600} style={{ marginTop: 20, maxWidth: 384, textAlign: "center", fontSize: fs.xl, color: tw.white, textShadowColor: "rgba(0,0,0,0.25)", textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 6 }}>
        {f.text}
      </T>
    </Animated.View>
  );
}

function RingStar({ angle, emoji }: { angle: number; emoji: string }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(150, withTiming(1, { duration: 1000 }));
  }, [p]);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: Math.cos(angle) * 120 * p.value },
      { translateY: Math.sin(angle) * 120 * p.value },
      { scale: kf(p.value, [0, 1.4, 0.8]) },
      { rotate: `${p.value * 360}deg` },
    ],
  }));
  return (
    <Animated.View style={[{ position: "absolute" }, style]}>
      <T style={{ fontSize: fs["3xl"], lineHeight: fs["3xl"] * 1.2 }}>{emoji}</T>
    </Animated.View>
  );
}

function Bad({ f }: { f: Feedback }) {
  const drop = useSharedValue(-200);
  useEffect(() => {
    drop.value = withSpring(0, spring(0.3));
  }, [drop]);
  const dropStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, 1 + drop.value / 200), transform: [{ translateY: drop.value }] }));
  const sway = useLoop(3000);
  const cloudStyle = useAnimatedStyle(() => ({ transform: [{ translateX: kf(sway.value, [-10, 10, -10]) }] }));
  const rock = useLoop(1500);
  const emojiStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${kf(rock.value, [0, -8, 8, 0])}deg` }] }));
  const fall = useSharedValue(0);
  useEffect(() => {
    fall.value = withDelay(500, withTiming(1, { duration: 1200 }));
  }, [fall]);
  const ptsStyle = useAnimatedStyle(() => ({ opacity: 1 - fall.value * 0.4, transform: [{ translateY: fall.value * 60 }] }));

  return (
    <Animated.View
      style={[
        { width: "100%", maxWidth: 384, alignItems: "center", borderRadius: 32, padding: 24, backgroundImage: `linear-gradient(to bottom, ${tw.sky400}, ${tw.indigo600})`, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" },
        dropStyle,
      ]}
    >
      <Animated.View style={cloudStyle}>
        <T style={{ fontSize: fs["8xl"], lineHeight: fs["8xl"] * 1.15 }}>🌧️</T>
        {[0, 1, 2, 3, 4].map((i) => (
          <Drop key={i} i={i} />
        ))}
      </Animated.View>
      <Animated.View style={[{ marginTop: 24 }, emojiStyle]}>
        <T style={{ fontSize: fs["7xl"], lineHeight: fs["7xl"] * 1.15 }}>{f.emoji}</T>
      </Animated.View>
      <T w={700} style={{ marginTop: 12, fontSize: fs["5xl"], color: tw.white }}>
        {f.title}
      </T>
      <Animated.View style={[{ marginTop: 12, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.25)", paddingHorizontal: 20, paddingVertical: 4 }, ptsStyle]}>
        <T w={700} style={{ fontSize: fs["3xl"], color: tw.white }}>
          {f.points} ⭐
        </T>
      </Animated.View>
      <T w={600} style={{ marginTop: 16, textAlign: "center", fontSize: fs.xl, color: tw.white }}>
        {f.text}
      </T>
      <T style={{ marginTop: 12, fontSize: fs.lg, color: tw.sky100 }}>You can do it! 💪💙</T>
    </Animated.View>
  );
}

function Drop({ i }: { i: number }) {
  const p = useLoop(1000, i * 200);
  const style = useAnimatedStyle(() => ({ opacity: 1 - p.value, transform: [{ translateY: p.value * 90 }] }));
  return (
    <Animated.View style={[{ position: "absolute", top: 80, left: 10 + i * 18 }, style]}>
      <T style={{ fontSize: fs["2xl"] }}>💧</T>
    </Animated.View>
  );
}

function Blocked({ f }: { f: Feedback }) {
  const enter = useEnter(0.6);
  const wiggle = useSharedValue(0);
  useEffect(() => {
    const st = (x: number) => withTiming(x, { duration: 120 });
    wiggle.value = withSequence(st(-4), st(4), st(-4), st(0));
  }, [wiggle]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: enter.value }, { rotate: `${wiggle.value}deg` }] }));
  const spin = useLoop(1500);
  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));
  return (
    <Animated.View style={[{ maxWidth: 384 }, style]}>
      <Card style={{ alignItems: "center", padding: 24 }}>
        <Animated.View style={spinStyle}>
          <T style={{ fontSize: fs["7xl"], lineHeight: fs["7xl"] * 1.15 }}>{f.emoji}</T>
        </Animated.View>
        <T w={700} style={{ marginTop: 12, fontSize: fs["4xl"], color: tw.purple700, textAlign: "center" }}>
          {f.title}
        </T>
        <T w={600} style={{ marginTop: 8, fontSize: fs.xl, textAlign: "center" }}>
          {f.text}
        </T>
      </Card>
    </Animated.View>
  );
}
