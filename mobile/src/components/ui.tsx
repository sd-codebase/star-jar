import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View, type PressableProps, type StyleProp, type TextInputProps, type TextProps, type TextStyle, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { sounds } from "@/lib/fx";
import { btn3dShadow, btn3dShadowPressed, cardShadow, font, fs, ink, tw, type Weight } from "@/theme";

/** Text in Fredoka (the web font) with Tailwind-like weight. */
export function T({ w = 400, style, ...p }: TextProps & { w?: Weight }) {
  return <Text {...p} allowFontScaling={false} style={[{ fontFamily: font[w], color: ink, fontSize: fs.base }, style]} />;
}

const OUTLINE = [
  [-1.5, 0], [1.5, 0], [0, -1.5], [0, 1.5], [-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1],
];

/**
 * `.text-outline`: a 2px ink stroke behind the fill, plus an optional hard drop shadow
 * (`drop-shadow-[0_6px_0_rgba(0,0,0,0.25)]`). React Native has no text stroke, so
 * offset copies draw it.
 */
export function OutlineText({ children, style, shadow = 0, numberOfLines }: { children: React.ReactNode; style?: StyleProp<TextStyle>; shadow?: number; numberOfLines?: number }) {
  const flat = StyleSheet.flatten(style) ?? {};
  const base: TextStyle = { ...flat, color: ink, position: "absolute", left: 0, right: 0, top: 0 };
  return (
    <View>
      {shadow > 0 && (
        <T w={700} numberOfLines={numberOfLines} style={[base, { color: "rgba(0,0,0,0.25)", transform: [{ translateY: shadow }] }]}>
          {children}
        </T>
      )}
      {OUTLINE.map(([x, y], i) => (
        <T key={i} w={700} numberOfLines={numberOfLines} style={[base, { transform: [{ translateX: x }, { translateY: y }] }]}>
          {children}
        </T>
      ))}
      <T w={700} numberOfLines={numberOfLines} style={style}>
        {children}
      </T>
    </View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** framer `whileTap={{ scale }}` for anything pressable. */
export function PressScale({ to = 0.9, style, children, onPressIn, onPressOut, ...p }: PressableProps & { to?: number; style?: StyleProp<ViewStyle>; children?: React.ReactNode }) {
  const s = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <AnimatedPressable
      {...p}
      onPressIn={(e) => {
        s.set(withSpring(to, { dampingRatio: 0.6, duration: 250 }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        s.set(withSpring(1, { dampingRatio: 0.5, duration: 400 }));
        onPressOut?.(e);
      }}
      style={[style, a]}
    >
      {children}
    </AnimatedPressable>
  );
}

/**
 * `.btn3d` chunky candy button: sinks 5px and its shadow shrinks while pressed.
 * `scale` adds framer's `whileTap={{ scale }}` on top.
 */
export function Btn3D({
  bg,
  style,
  children,
  disabled,
  onPress,
  silent,
  scale = 1,
  ...p
}: Omit<PressableProps, "style" | "children"> & { bg: string; style?: StyleProp<ViewStyle>; children: React.ReactNode; silent?: boolean; scale?: number }) {
  const [pressed, setPressed] = useState(false);
  const sc = useSharedValue(1);
  const sink = useSharedValue(0);
  const down = pressed && !disabled;
  const a = useAnimatedStyle(() => ({ transform: [{ translateY: sink.value }, { scale: sc.value }] }));
  return (
    <AnimatedPressable
      {...p}
      disabled={disabled}
      onPressIn={(e) => {
        setPressed(true);
        sink.set(5);
        if (scale !== 1) sc.set(withSpring(scale, { dampingRatio: 0.6, duration: 250 }));
        p.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        sink.set(0);
        if (scale !== 1) sc.set(withSpring(1, { dampingRatio: 0.5, duration: 400 }));
        p.onPressOut?.(e);
      }}
      onPress={(e) => {
        if (!silent) void Haptics.selectionAsync();
        onPress?.(e);
      }}
      style={[s.btn, { backgroundColor: bg, boxShadow: down ? btn3dShadowPressed : btn3dShadow }, disabled && { opacity: 0.4 }, style, a]}
    >
      {children}
    </AnimatedPressable>
  );
}

/** White label used inside the coloured `btn3d` buttons (`px-4 py-2 text-white font-bold`). */
export function BtnText({ children, style, color = tw.white }: { children: React.ReactNode; style?: StyleProp<TextStyle>; color?: string }) {
  return (
    <T w={700} style={[{ color, textAlign: "center" }, style]}>
      {children}
    </T>
  );
}

/** Simple coloured button: `${btn} bg-…` on the web. */
export function Btn({ bg, label, onPress, disabled, style, textStyle }: { bg: string; label: string; onPress?: () => void; disabled?: boolean; style?: StyleProp<ViewStyle>; textStyle?: StyleProp<TextStyle> }) {
  return (
    <Btn3D bg={bg} onPress={onPress} disabled={disabled} style={[{ paddingHorizontal: 16, paddingVertical: 8 }, style]}>
      <BtnText style={textStyle}>{label}</BtnText>
    </Btn3D>
  );
}

export function Card({ style, children }: { style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  return <View style={[s.card, style]}>{children}</View>;
}

/** `rounded-xl border-2 border-purple-200 bg-white px-3 py-2 focus:border-purple-500` */
export function Input({ style, onFocus, onBlur, ...p }: TextInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      placeholderTextColor={tw.slate400}
      allowFontScaling={false}
      // Android scrolls an unfocused long value to its end; keep the start in view like the web.
      selection={focused || Platform.OS !== "android" ? undefined : { start: 0 }}
      {...p}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={[s.input, focused && { borderColor: tw.purple500 }, style]}
    />
  );
}

export function Checkbox({ checked, onChange, label, size = 20 }: { checked: boolean; onChange: (v: boolean) => void; label: React.ReactNode; size?: number }) {
  return (
    <Pressable
      onPress={() => {
        sounds.tap();
        onChange(!checked);
      }}
      style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
      hitSlop={6}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: 4,
          borderWidth: 2,
          borderColor: checked ? tw.purple600 : tw.slate400,
          backgroundColor: checked ? tw.purple600 : tw.white,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {checked && <T style={{ color: tw.white, fontSize: size * 0.7, lineHeight: size * 0.9 }}>✓</T>}
      </View>
      <View style={{ flexShrink: 1 }}>{typeof label === "string" ? <T>{label}</T> : label}</View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: { borderRadius: 24, alignItems: "center", justifyContent: "center" },
  card: { backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 32, boxShadow: cardShadow },
  input: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: tw.purple200,
    backgroundColor: tw.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: font[400],
    fontSize: fs.base,
    color: ink,
  },
});
