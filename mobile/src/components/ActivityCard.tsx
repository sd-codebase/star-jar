import { StyleSheet, View, type GestureResponderEvent, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { formatWait, type Check } from "@shared/rules";
import type { Activity } from "@shared/types";
import { kf, useEnter, useLoop } from "@/lib/anim";
import { fs, tw } from "@/theme";
import { Btn3D, T } from "./ui";

const GOOD_COLORS = ["#ff006e", "#fb5607", "#ffbe0b", "#06d6a0", "#3a86ff", "#8338ec", "#00b4d8", "#ff4d6d"];

export default function ActivityCard({
  activity,
  index,
  doneToday,
  maxPerDay,
  check,
  onTap,
  style,
}: {
  activity: Activity;
  index: number;
  doneToday: number;
  maxPerDay: number;
  check: Check;
  onTap: (e: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const good = activity.kind === "good";
  const bg = good ? GOOD_COLORS[index % GOOD_COLORS.length] : "#6c757d";
  const locked = !check.ok;

  const enter = useEnter(0.55, index * 50);
  const enterStyle = useAnimatedStyle(() => ({ transform: [{ scale: enter.value }, { rotate: `${(1 - enter.value) * -10}deg` }] }));
  const bob = useLoop(2000, index * 150, !locked);
  const emojiStyle = useAnimatedStyle(() => ({
    opacity: locked ? 0.45 : 1,
    transform: [{ translateY: kf(bob.value, [0, -6, 0]) }, { rotate: `${kf(bob.value, [0, -6, 6, 0])}deg` }],
  }));
  const spin = useLoop(2000, 0, locked && check.reason !== "daily");
  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));

  return (
    <Animated.View style={[style, enterStyle]}>
        <Btn3D
          bg={bg}
          silent
          scale={0.88}
          onPress={onTap}
          style={[
            { overflow: "hidden", padding: 12, backgroundImage: good ? `linear-gradient(160deg, ${bg}, ${bg}cc)` : "linear-gradient(160deg,#8d99ae,#5c677d)" },
            good && { aspectRatio: 1 },
          ]}
        >
          <Animated.View style={emojiStyle}>
            <T style={{ fontSize: good ? fs["6xl"] : fs["4xl"], lineHeight: (good ? fs["6xl"] : fs["4xl"]) * 1.2 }}>{activity.emoji}</T>
          </Animated.View>
          <T
            w={700}
            numberOfLines={2}
            style={{ marginTop: 4, alignSelf: "stretch", textAlign: "center", color: tw.white, fontSize: good ? fs.lg : fs.sm, lineHeight: (good ? fs.lg : fs.sm) * 1.25, textShadowColor: "rgba(0,0,0,0.1)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}
          >
            {activity.name}
          </T>
          <View style={{ marginTop: 4, borderRadius: 999, paddingHorizontal: 8, backgroundColor: good ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)" }}>
            <T w={700} style={{ fontSize: fs.sm, color: tw.white }}>
              {activity.points > 0 ? `+${activity.points}` : activity.points} ⭐
            </T>
          </View>

          {good && (
            <View style={{ position: "absolute", left: 8, top: 8, flexDirection: "row", gap: 4 }}>
              {Array.from({ length: maxPerDay }).map((_, i) => (
                <View key={i} style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: tw.white, backgroundColor: i < doneToday ? tw.yellow300 : "rgba(255,255,255,0.2)" }} />
              ))}
            </View>
          )}

          {locked && (
            <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", backgroundColor: "rgba(59,7,100,0.55)" }]}>
              {check.reason === "daily" ? (
                <>
                  <T style={{ fontSize: fs["4xl"], lineHeight: fs["4xl"] * 1.2 }}>✅</T>
                  <T w={700} style={{ fontSize: fs.sm, color: tw.white }}>
                    Done for today!
                  </T>
                </>
              ) : (
                <>
                  <Animated.View style={spinStyle}>
                    <T style={{ fontSize: fs["3xl"], lineHeight: fs["3xl"] * 1.2 }}>⏳</T>
                  </Animated.View>
                  <T w={700} style={{ fontSize: fs.xl, color: tw.white, fontVariant: ["tabular-nums"] }}>
                    {formatWait(check.waitMs)}
                  </T>
                </>
              )}
            </View>
          )}
        </Btn3D>
    </Animated.View>
  );
}
