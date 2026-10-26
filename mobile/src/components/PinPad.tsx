import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { sounds } from "@/lib/fx";
import { fs, tw } from "@/theme";
import { Btn3D, T } from "./ui";

const KEY_COLORS = ["#ff006e", "#fb5607", "#ffbe0b", "#06d6a0", "#3a86ff", "#8338ec", "#ff4d6d", "#2ec4b6", "#ff8c00", "#00b4d8"];
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", ""];

export default function PinPad({
  length = 4,
  onSubmit,
  hint,
}: {
  length?: number;
  /** Return (or resolve) true if PIN accepted. */
  onSubmit: (pin: string) => boolean | Promise<boolean>;
  hint?: string;
}) {
  const [pin, setPin] = useState("");
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const press = (d: string) => {
    // Full means it's being checked; extra taps would resubmit the same PIN.
    if (pin.length >= length) return;
    sounds.tap();
    const next = (pin + d).slice(0, length);
    setPin(next);
    if (next.length === length) {
      setTimeout(async () => {
        if (!(await onSubmit(next))) {
          sounds.wrong();
          const step = (x: number) => withTiming(x, { duration: 60 });
          shake.value = withSequence(step(-18), step(18), step(-12), step(12), step(-6), step(6), step(0));
          setPin("");
        }
      }, 150);
    }
  };

  return (
    <View style={{ alignItems: "center", gap: 20 }}>
      {hint && <T w={600} style={{ textAlign: "center", fontSize: fs.lg, color: "rgba(88,28,135,0.7)" }}>{hint}</T>}
      <Animated.View style={[{ flexDirection: "row", gap: 12 }, shakeStyle]}>
        {Array.from({ length }).map((_, i) => (
          <Dot key={i} filled={i < pin.length} />
        ))}
      </Animated.View>
      <View style={{ width: 72 * 3 + 12 * 2, flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {KEYS.map((k, i) =>
          k === "" ? (
            <View key={i} style={{ width: 72, height: 72 }} />
          ) : (
              <Btn3D
                key={k}
                silent
                scale={0.85}
                bg={k === "⌫" ? "#adb5bd" : KEY_COLORS[Number(k)]}
                style={{ width: 72, height: 72 }}
                onPress={() => (k === "⌫" ? setPin((p) => (p.length >= length ? p : p.slice(0, -1))) : press(k))}
              >
                <T w={700} style={{ fontSize: fs["3xl"], color: tw.white }}>
                  {k}
                </T>
              </Btn3D>
          ),
        )}
      </View>
    </View>
  );
}

function Dot({ filled }: { filled: boolean }) {
  const s = useSharedValue(1);
  useEffect(() => {
    if (filled) s.value = withSequence(withSpring(1.4, { duration: 150 }), withSpring(1, { duration: 200 }));
  }, [filled, s]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Animated.View
      style={[
        { width: 48, height: 48, borderRadius: 24, borderWidth: 4, borderColor: tw.purple300, backgroundColor: tw.white, alignItems: "center", justifyContent: "center" },
        style,
      ]}
    >
      {filled && <T style={{ fontSize: fs["2xl"] }}>⭐</T>}
    </Animated.View>
  );
}
