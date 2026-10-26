import { useEffect, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from "react-native-reanimated";

export interface ConfettiBurst {
  x: number; // 0..1 of screen width
  y: number; // 0..1 of screen height
  count: number;
  spread: number; // degrees
  velocity: number; // canvas-confetti startVelocity (px per frame)
  angle: number; // degrees, 90 = straight up
  colors: string[];
  star?: boolean;
}

type Burst = ConfettiBurst & { id: number; particles: Particle[] };
type Particle = { vx: number; vy: number; color: string; size: number; round: boolean; wobble: number; spin: number };

let listener: ((b: ConfettiBurst) => void) | null = null;
export const emitConfetti = (b: ConfettiBurst) => listener?.(b);

// canvas-confetti defaults: 200 ticks at 60fps, velocity decays 10% a frame, gravity 1 (×3 px per frame).
const TICKS = 200;
const DURATION = (TICKS / 60) * 1000;
const MAX_LIVE = 400;
let nextId = 1;

function makeParticles(b: ConfettiBurst): Particle[] {
  return Array.from({ length: b.count }, () => {
    const a = ((b.angle + b.spread * (0.5 - Math.random())) * Math.PI) / 180;
    const v = b.velocity * 0.5 + Math.random() * b.velocity;
    return {
      vx: Math.cos(a) * v,
      vy: -Math.sin(a) * v,
      color: b.colors[Math.floor(Math.random() * b.colors.length)],
      size: b.star ? 22 : 8 + Math.random() * 4,
      round: Math.random() < 0.5,
      wobble: Math.random() * 10,
      spin: (Math.random() - 0.5) * 20,
    };
  });
}

/** Full-screen, touch-through confetti layer. Mount once at the app root. */
export default function ConfettiHost() {
  const [bursts, setBursts] = useState<Burst[]>([]);

  useEffect(() => {
    listener = (b) => {
      const burst: Burst = { ...b, id: nextId++, particles: makeParticles(b) };
      setBursts((list) => {
        let live = [...list, burst];
        while (live.reduce((n, x) => n + x.particles.length, 0) > MAX_LIVE && live.length > 1) live = live.slice(1);
        return live;
      });
      setTimeout(() => setBursts((list) => list.filter((x) => x.id !== burst.id)), DURATION + 100);
    };
    return () => {
      listener = null;
    };
  }, []);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {bursts.map((b) => (
        <BurstView key={b.id} burst={b} />
      ))}
    </View>
  );
}

function BurstView({ burst }: { burst: Burst }) {
  const { width, height } = useWindowDimensions();
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(1, { duration: DURATION, easing: Easing.linear });
  }, [t]);
  const x0 = burst.x * width;
  const y0 = burst.y * height;
  return (
    <>
      {burst.particles.map((p, i) => (
        <Piece key={i} p={p} t={t} x0={x0} y0={y0} star={!!burst.star} />
      ))}
    </>
  );
}

function Piece({ p, t, x0, y0, star }: { p: Particle; t: SharedValue<number>; x0: number; y0: number; star: boolean }) {
  const style = useAnimatedStyle(() => {
    const f = t.value * TICKS;
    const travel = (1 - Math.pow(0.9, f)) / 0.1;
    const x = x0 + p.vx * travel + Math.sin(p.wobble + f * 0.1) * 6;
    const y = y0 + p.vy * travel + 3 * f;
    return {
      opacity: 1 - t.value,
      transform: [{ translateX: x - p.size / 2 }, { translateY: y - p.size / 2 }, { rotate: `${p.wobble * 36 + f * p.spin}deg` }, { scaleY: star ? 1 : Math.cos(p.wobble + f * 0.15) }],
    };
  });
  return (
    <Animated.View style={[{ position: "absolute", left: 0, top: 0 }, style]}>
      {star ? (
        <Text allowFontScaling={false} style={{ fontSize: p.size, lineHeight: p.size * 1.2 }}>⭐</Text>
      ) : (
        <View style={{ width: p.size, height: p.size * (p.round ? 1 : 0.6), borderRadius: p.round ? p.size / 2 : 1, backgroundColor: p.color }} />
      )}
    </Animated.View>
  );
}
