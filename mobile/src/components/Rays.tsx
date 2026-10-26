import type { StyleProp, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useLoop } from "@/lib/anim";

const WEDGES = Array.from({ length: 15 }, (_, i) => i * 24);

/** `.rays`: repeating-conic-gradient(rgba(255,230,0,0.55) 0–12deg, transparent 12–24deg), spinning. */
export default function Rays({ size, duration = 8000, style }: { size: number; duration?: number; style?: StyleProp<ViewStyle> }) {
  const p = useLoop(duration);
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${p.value * 360}deg` }] }));
  const r = size / 2;
  const pt = (deg: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return `${r + r * Math.cos(a)} ${r + r * Math.sin(a)}`;
  };
  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", width: size, height: size }, style, spin]}>
      <Svg width={size} height={size}>
        {WEDGES.map((d) => (
          <Path key={d} d={`M${r} ${r} L${pt(d)} A${r} ${r} 0 0 1 ${pt(d + 12)} Z`} fill="rgba(255,230,0,0.55)" />
        ))}
      </Svg>
    </Animated.View>
  );
}
