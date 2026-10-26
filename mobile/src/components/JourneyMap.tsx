import { useEffect, useRef } from "react";
import { ScrollView, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import type { Kid, Milestone } from "@shared/types";
import { kf, useLoop } from "@/lib/anim";
import { fs, tw } from "@/theme";
import { T } from "./ui";

const GAP = 150;
const H = 230;
const yAt = (i: number) => H / 2 + Math.sin(i * 1.3) * 55;

/** Game-style winding road: home → treasure chests at each milestone, avatar walks along it. */
export default function JourneyMap({ kid, milestones, total }: { kid: Kid; milestones: Milestone[]; total: number }) {
  const scroller = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const viewW = useRef(0);
  const sorted = [...milestones].sort((a, b) => a.points - b.points);
  const nodes = [{ points: 0, x: 60, y: yAt(0) }, ...sorted.map((m, i) => ({ points: m.points, x: 60 + (i + 1) * GAP, y: yAt(i + 1) }))];
  const width = nodes[nodes.length - 1].x + 80;

  // Where the avatar stands: between the last reached node and the next one.
  let seg = nodes.findIndex((n) => n.points > total);
  if (seg === -1) seg = nodes.length;
  const a = nodes[Math.max(0, seg - 1)];
  const b = nodes[Math.min(nodes.length - 1, seg)];
  const f = b.points === a.points ? 0 : (total - a.points) / (b.points - a.points);
  const pos = { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };

  const path = nodes.reduce((d, n, i) => {
    if (i === 0) return `M${n.x} ${n.y}`;
    const p = nodes[i - 1];
    const mx = (p.x + n.x) / 2;
    return `${d} C${mx} ${p.y} ${mx} ${n.y} ${n.x} ${n.y}`;
  }, "");

  const scrollToAvatar = () => scroller.current?.scrollTo({ x: Math.max(0, pos.x - viewW.current / 2), animated: true });
  useEffect(scrollToAvatar, [pos.x]);

  return (
    <ScrollView
      ref={scroller}
      horizontal
      showsHorizontalScrollIndicator={false}
      onLayout={(e) => {
        viewW.current = e.nativeEvent.layout.width;
        scrollToAvatar();
      }}
      style={{ borderRadius: 24, backgroundImage: `linear-gradient(to bottom, ${tw.sky300}, ${tw.green300})` }}
    >
      <View style={{ width, height: H }}>
        <Svg width={width} height={H} style={{ position: "absolute" }}>
          <Path d={path} fill="none" stroke="#c08552" strokeWidth={30} strokeLinecap="round" />
          <Path d={path} fill="none" stroke="#fff3b0" strokeWidth={6} strokeDasharray="14 14" strokeLinecap="round" />
        </Svg>

        <T style={{ position: "absolute", left: nodes[0].x - 28, top: nodes[0].y - 34, fontSize: fs["5xl"], lineHeight: fs["5xl"] * 1.2 }}>🏠</T>

        {sorted.map((m, i) => (
          <Chest key={m.id} m={m} i={i} x={nodes[i + 1].x} y={nodes[i + 1].y} got={!!kid.unlocked[m.id]} />
        ))}

        <Walker kid={kid} x={pos.x} y={pos.y} startY={nodes[0].y} />
      </View>
    </ScrollView>
  );
}

function Chest({ m, i, x, y, got }: { m: Milestone; i: number; x: number; y: number; got: boolean }) {
  const p = useLoop(got ? 1500 : 2500, i * 200);
  const style = useAnimatedStyle(() => (got ? { transform: [{ translateY: kf(p.value, [0, -6, 0]) }] } : { transform: [{ rotate: `${kf(p.value, [0, -5, 5, 0])}deg` }] }));
  return (
    <View style={{ position: "absolute", left: x - 56, top: y - 46, width: 112, alignItems: "center" }}>
      <Animated.View
        style={[
          {
            width: 64,
            height: 64,
            borderRadius: 32,
            borderWidth: 4,
            alignItems: "center",
            justifyContent: "center",
            borderColor: got ? tw.yellow300 : "rgba(255,255,255,0.7)",
            backgroundColor: got ? tw.white : "rgba(88,28,135,0.4)",
            boxShadow: got ? "0 10px 15px -3px rgba(253,224,71,0.8), 0 4px 6px -4px rgba(253,224,71,0.8)" : "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
          },
          style,
        ]}
      >
        <T style={{ fontSize: fs["4xl"], lineHeight: fs["4xl"] * 1.2, opacity: got ? 1 : 0.85 }}>{got ? m.badge : "🎁"}</T>
      </Animated.View>
      <View style={{ marginTop: 4, borderRadius: 999, paddingHorizontal: 8, backgroundColor: got ? tw.yellow300 : "rgba(255,255,255,0.8)" }}>
        <T w={700} style={{ fontSize: fs.sm, color: got ? tw.purple900 : tw.purple800 }}>
          {got ? "✔ " : "🔒 "}
          {m.points}⭐
        </T>
      </View>
    </View>
  );
}

function Walker({ kid, x, y, startY }: { kid: Kid; x: number; y: number; startY: number }) {
  const left = useSharedValue(32);
  const top = useSharedValue(startY - 60);
  useEffect(() => {
    left.value = withTiming(x - 28, { duration: 1500 });
    top.value = withTiming(y - 60, { duration: 1500 });
  }, [left, top, x, y]);
  const hop = useLoop(900);
  const style = useAnimatedStyle(() => ({ left: left.value, top: top.value, transform: [{ translateY: kf(hop.value, [0, -10, 0]) }] }));
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          zIndex: 10,
          width: 56,
          height: 56,
          borderRadius: 28,
          borderWidth: 4,
          borderColor: tw.white,
          backgroundColor: kid.color,
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
        },
        style,
      ]}
    >
      <T style={{ fontSize: fs["4xl"], lineHeight: fs["4xl"] * 1.2 }}>{kid.avatar}</T>
    </Animated.View>
  );
}
