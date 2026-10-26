import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import Animated, { useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withSpring } from "react-native-reanimated";
import Svg, { ClipPath, Defs, G, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { kf, useLoop } from "@/lib/anim";
import { spring } from "@/theme";
import { T } from "./ui";

/** Animates a number toward `value` over 1.2s with ease-out, like the web's CountUp. */
export function CountUp({ value, style }: { value: number; style?: React.ComponentProps<typeof T>["style"] }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = Date.now();
    const a = from.current;
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / 1200);
      const v = Math.round(a + (value - a) * (1 - Math.pow(1 - t, 3)));
      from.current = v;
      setShown(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <T w={700} style={style}>
      {shown}
    </T>
  );
}

const STAR_SPOTS = [
  [70, 205], [105, 212], [135, 200], [85, 180], [120, 178], [65, 155], [100, 150], [135, 158],
  [80, 128], [118, 122], [70, 100], [102, 95], [135, 105], [88, 72],
];
const JAR = "M45 60 Q40 60 40 75 L35 215 Q35 240 60 240 L140 240 Q165 240 165 215 L160 75 Q160 60 155 60 Z";
const WAVE = "M-200 50 Q-175 38 -150 50 T-100 50 T-50 50 T0 50 T50 50 T100 50 T150 50 T200 50 T250 50 T300 50 V300 H-200 Z";

const AnimatedG = Animated.createAnimatedComponent(G);

/** A glass jar that fills toward the next milestone (web: h-48 w-40). */
export default function StarJar({ progress, color, width = 160 }: { progress: number; color: string; width?: number }) {
  const k = width / 200;
  const height = 250 * k;
  const pct = Math.max(0, Math.min(1, progress));
  const top = 230 - pct * 170; // liquid surface y (60..230)

  const level = useSharedValue(200);
  useEffect(() => {
    level.value = withSpring(top - 50, spring(0.35, 1400));
  }, [level, top]);
  const wave = useLoop(3000);
  const liquid = useAnimatedProps(() => ({ translateX: wave.value * 100, translateY: level.value }));

  return (
    <View style={{ width, height, filter: "drop-shadow(0 20px 13px rgba(0,0,0,0.03)) drop-shadow(0 8px 5px rgba(0,0,0,0.08))" }}>
      <Svg width={width} height={height} viewBox="0 0 200 250">
        <Defs>
          <ClipPath id="jar-clip">
            <Path d={JAR} />
          </ClipPath>
          <LinearGradient id="liquid" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#fff176" />
            <Stop offset="1" stopColor={color} />
          </LinearGradient>
        </Defs>
        <Path d={JAR} fill="rgba(255,255,255,0.55)" stroke="#2b1055" strokeWidth={6} />
        <G clipPath="url(#jar-clip)">
          <AnimatedG animatedProps={liquid}>
            <Path d={WAVE} fill="url(#liquid)" />
          </AnimatedG>
        </G>
        <Rect x={38} y={38} width={124} height={26} rx={10} fill="#ff9f1c" stroke="#2b1055" strokeWidth={6} />
        <Path d="M55 85 L52 200" stroke="white" strokeWidth={8} strokeLinecap="round" opacity={0.7} />
      </Svg>
      {STAR_SPOTS.map(([x, y], i) => (y > top + 8 ? <JarStar key={i} x={x * k} y={y * k} size={22 * k} i={i} /> : null))}
    </View>
  );
}

function JarStar({ x, y, size, i }: { x: number; y: number; size: number; i: number }) {
  const s = useSharedValue(0);
  useEffect(() => {
    s.value = withDelay(i * 50, withSpring(1, spring(0.25, 600)));
  }, [s, i]);
  const wobble = useLoop(3000, i * 200);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }, { rotate: `${kf(wobble.value, [0, 15, -15, 0])}deg` }] }));
  // SVG text sits on its baseline at (x, y); centre the emoji box on the same spot.
  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", left: x - size * 0.7, top: y - size * 1.05, width: size * 1.4, alignItems: "center" }, style]}>
      <T style={{ fontSize: size, lineHeight: size * 1.3 }}>⭐</T>
    </Animated.View>
  );
}
