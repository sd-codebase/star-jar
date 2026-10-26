import { useEffect } from "react";
import { cancelAnimation, Easing, useSharedValue, withDelay, withRepeat, withSpring, withTiming } from "react-native-reanimated";
import { spring } from "@/theme";

/** 0→1 progress repeating forever (framer `repeat: Infinity`). */
export function useLoop(duration: number, delay = 0, enabled = true) {
  const p = useSharedValue(0);
  useEffect(() => {
    if (!enabled) {
      cancelAnimation(p);
      p.value = withTiming(0, { duration: 200 });
      return;
    }
    p.value = 0;
    p.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(p);
  }, [p, duration, delay, enabled]);
  return p;
}

/** Spring from 0 to 1 on mount (framer `initial` → `animate` with `type: "spring"`). */
export function useEnter(bounce = 0.5, delay = 0, duration = 800) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withSpring(1, spring(bounce, duration)));
  }, [p, bounce, delay, duration]);
  return p;
}

/**
 * Framer-style keyframes: evenly spaced values with ease-in-out between each pair.
 * `p` is 0..1 across the whole sequence.
 */
export function kf(p: number, values: number[]) {
  "worklet";
  const n = values.length - 1;
  if (n <= 0) return values[0] ?? 0;
  const x = Math.min(Math.max(p, 0), 1) * n;
  const i = Math.min(Math.floor(x), n - 1);
  const t = x - i;
  const e = t * t * (3 - 2 * t);
  return values[i] + (values[i + 1] - values[i]) * e;
}
