import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View, type GestureResponderEvent } from "react-native";
import Animated, { FadeIn, FadeInLeft, FadeOut, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming, ZoomIn, ZoomOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { badMessage, goodMessage } from "@shared/messages";
import { checkTap, dayKey, formatWait, isToday, nextMilestone, totalStars } from "@shared/rules";
import type { Activity, Entry, Milestone } from "@shared/types";
import ActivityCard from "@/components/ActivityCard";
import FeedbackOverlay, { type Feedback } from "@/components/FeedbackOverlay";
import JourneyMap from "@/components/JourneyMap";
import MilestoneOverlay from "@/components/MilestoneOverlay";
import PinPad from "@/components/PinPad";
import StarJar, { CountUp } from "@/components/StarJar";
import { Btn3D, Card, OutlineText, T } from "@/components/ui";
import { kf, useLoop } from "@/lib/anim";
import { burst, sounds } from "@/lib/fx";
import { checkParentPin, logActivity, removeEntry, uid, useData, useStore } from "@/lib/store";
import { fs, spring, tw } from "@/theme";

function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={{ marginTop: 32 }}>
    <View style={{ marginBottom: 12 }}>
      <OutlineText shadow={4} style={{ fontSize: fs["2xl"], lineHeight: fs["2xl"] * 1.3, color: tw.white }}>
        {title}
      </OutlineText>
    </View>
    {children}
  </View>
);

/** Lays children out in `cols` equal columns with a gap (web: CSS grid). */
function Grid({ cols, gap, children }: { cols: number; gap: number; children: React.ReactNode[] }) {
  const [w, setW] = useState(0);
  const cell = w ? (w - gap * (cols - 1)) / cols : 0;
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ flexDirection: "row", flexWrap: "wrap", gap }}>
      {cell > 0 &&
        children.map((c, i) => (
          <View key={i} style={{ width: cell }}>
            {c}
          </View>
        ))}
    </View>
  );
}

export default function KidScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const data = useData()!;
  const activeKidId = useStore((s) => s.activeKidId);
  const now = useNow();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [queue, setQueue] = useState<Milestone[]>([]);
  const [showMilestone, setShowMilestone] = useState(false);
  const [removing, setRemoving] = useState<Entry | null>(null);
  // One tap at a time: the server decides, so a second tap must wait for the first answer.
  const tapping = useRef(false);

  const closeRemove = () => {
    sounds.close();
    setRemoving(null);
  };

  const closeFeedback = useCallback(() => {
    setFeedback(null);
    setShowMilestone(true);
  }, []);

  const kid = data.kids.find((k) => k.id === id);
  // Only the child who just entered their PIN on Home may be here.
  if (!kid || activeKidId !== id) return <Redirect href="/" />;

  const entries = data.entries.filter((e) => e.kidId === kid.id);
  const total = totalStars(entries);
  const { next } = nextMilestone(data.milestones, total, kid.unlocked);
  const progress = next ? total / next.points : 1;
  const today = entries.filter((e) => isToday(e.at, now)).sort((a, b) => b.at - a.at);
  const todayStars = today.reduce((s, e) => s + e.points, 0);
  const kidActivities = data.activities.filter((a) => !a.parentOnly);
  const good = kidActivities.filter((a) => a.kind === "good");
  const bad = kidActivities.filter((a) => a.kind === "bad");
  const sortedMilestones = [...data.milestones].sort((a, b) => a.points - b.points);

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const key = dayKey(d.getTime());
    const stars = entries.filter((e) => dayKey(e.at) === key && e.points > 0).reduce((s, e) => s + e.points, 0);
    return { label: d.toLocaleDateString(undefined, { weekday: "short" }), stars, isToday: i === 6 };
  });
  const weekMax = Math.max(20, ...week.map((w) => w.stars));

  const tap = async (activity: Activity, e: GestureResponderEvent) => {
    if (tapping.current) return;
    tapping.current = true;
    const at = { x: e.nativeEvent.pageX / width, y: e.nativeEvent.pageY / height };
    const res = await logActivity(kid.id, activity.id).finally(() => (tapping.current = false));
    if (!res) return;
    if (!res.ok) {
      const c = res.check;
      const text =
        c.reason === "daily"
          ? `${activity.name}: already ${data.settings.maxPerDay} times today! Come back tomorrow.`
          : c.reason === "same"
            ? `Wait ${formatWait(c.waitMs)} to tap ${activity.name} again.`
            : `Take a tiny break! Try again in ${formatWait(c.waitMs)}.`;
      sounds.notYet();
      setFeedback({ id: uid(), kind: "blocked", emoji: c.reason === "daily" ? "🌙" : "⏳", title: c.reason === "daily" ? "All done!" : "Wait a little!", text });
      return;
    }
    if (activity.kind === "good") {
      const m = goodMessage(kid.name);
      burst(at.x, at.y);
      sounds.good();
      setFeedback({ id: uid(), kind: "good", emoji: activity.emoji, points: activity.points, ...m });
    } else {
      const m = badMessage(kid.name);
      sounds.bad();
      setFeedback({ id: uid(), kind: "bad", emoji: activity.emoji, points: activity.points, ...m });
    }
    if (res.unlocked.length) {
      setShowMilestone(false);
      setQueue((q) => [...q, ...res.unlocked]);
    }
  };

  const goodCols = width >= 768 ? 4 : width >= 640 ? 3 : 2;
  const badCols = width >= 640 ? 5 : 3;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ width: "100%", maxWidth: 1024, alignSelf: "center", paddingHorizontal: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 80 }}>
        <Header avatar={kid.avatar} color={kid.color} name={kid.name} onHome={() => {
            sounds.close();
            router.back();
          }} />

        {/* Hero: jar + total + next goal */}
        <Hero>
          <StarJar progress={progress} color={kid.color} />
          <View style={{ width: "100%", alignItems: "center" }}>
            <T w={600} style={{ fontSize: fs.xl, color: tw.purple700 }}>
              My Stars
            </T>
            <TotalStars total={total} />
            <T w={600} style={{ marginTop: 4, fontSize: fs.lg, color: tw.purple600 }}>
              Today: {todayStars >= 0 ? `+${todayStars}` : todayStars} ⭐
            </T>
            {next ? (
              <View style={{ marginTop: 16, width: "100%" }}>
                <View style={{ marginBottom: 4, flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                  <T w={700} numberOfLines={1} style={{ flex: 1, fontSize: fs.lg }}>
                    Next treasure: {next.title}
                  </T>
                  <T w={700} style={{ fontSize: fs.lg }}>
                    🎁
                  </T>
                </View>
                <ProgressBar progress={progress} />
                <T w={700} style={{ marginTop: 4, textAlign: "center", fontSize: fs.xl, color: tw.pink600 }}>
                  Only {next.points - total} more stars! 🚀
                </T>
              </View>
            ) : (
              <T w={700} style={{ marginTop: 16, fontSize: fs["2xl"], color: tw.pink600 }}>
                👑 You unlocked EVERYTHING!
              </T>
            )}
          </View>
        </Hero>

        <Section title="Earn Stars ⭐">
          <Grid cols={goodCols} gap={16}>
            {good.map((a, i) => (
              <ActivityCard
                key={a.id}
                activity={a}
                index={i}
                maxPerDay={data.settings.maxPerDay}
                doneToday={today.filter((e) => e.activityId === a.id).length}
                check={checkTap(entries, a, data.settings, now)}
                onTap={(e) => void tap(a, e)}
              />
            ))}
          </Grid>
        </Section>

        {bad.length > 0 && (
          <Section title="Oops Moments 🙈">
            <T w={600} style={{ marginTop: -8, marginBottom: 12, color: "rgba(255,255,255,0.9)" }}>
              Being honest is brave! Tap if this happened.
            </T>
            <Grid cols={badCols} gap={12}>
              {bad.map((a, i) => (
                <ActivityCard
                  key={a.id}
                  activity={a}
                  index={i}
                  maxPerDay={data.settings.maxPerDay}
                  doneToday={today.filter((e) => e.activityId === a.id).length}
                  check={checkTap(entries, a, data.settings, now)}
                  onTap={(e) => void tap(a, e)}
                />
              ))}
            </Grid>
          </Section>
        )}

        <Section title="My Treasure Road 🗺️">
          <JourneyMap kid={kid} milestones={data.milestones} total={total} />
        </Section>

        <Section title="My Badges 🏅">
          <Card style={{ padding: 0 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, padding: 16 }}>
              {sortedMilestones.map((m, i) => {
                const got = !!kid.unlocked[m.id];
                return (
                  <Animated.View key={m.id} entering={ZoomIn.delay(i * 60).springify()} style={{ width: 96, alignItems: "center" }}>
                    <View
                      style={[
                        { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
                        got ? { backgroundImage: "linear-gradient(to bottom right, #fef08a, #fdba74)", boxShadow: "0 0 20px rgba(255,190,11,0.8)" } : { backgroundColor: tw.purple100, opacity: 0.4 },
                      ]}
                    >
                      <T style={{ fontSize: fs["5xl"], lineHeight: fs["5xl"] * 1.2 }}>{got ? m.badge : "❓"}</T>
                    </View>
                    <T w={700} style={{ marginTop: 4, textAlign: "center", fontSize: fs.sm, lineHeight: fs.sm * 1.25 }}>
                      {got ? m.title : `${m.points}⭐`}
                    </T>
                    {got && !!m.gift && (
                      <View style={{ marginTop: 4, borderRadius: 999, paddingHorizontal: 8, backgroundColor: kid.giftsGiven[m.id] ? tw.green200 : tw.pink200 }}>
                        <T w={700} style={{ fontSize: fs.xs, color: kid.giftsGiven[m.id] ? tw.green800 : tw.pink700 }}>
                          {kid.giftsGiven[m.id] ? "Gift received ✓" : "Gift waiting 🎁"}
                        </T>
                      </View>
                    )}
                  </Animated.View>
                );
              })}
            </ScrollView>
          </Card>
        </Section>

        <Section title="Today's Adventure 📅">
          <Card style={{ padding: 16 }}>
            {today.length === 0 ? (
              <T w={600} style={{ paddingVertical: 24, textAlign: "center", fontSize: fs.xl, color: tw.purple500 }}>
                Nothing yet… tap a card to start! 🌟
              </T>
            ) : (
              <View style={{ marginLeft: 16, borderLeftWidth: 4, borderStyle: "dashed", borderColor: tw.purple300 }}>
                {today.map((e, i) => (
                  <Animated.View key={e.id} entering={FadeInLeft.delay(i * 50)} style={{ marginBottom: 12, marginLeft: 24, flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={{ position: "absolute", left: -42, width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: e.points > 0 ? tw.yellow300 : tw.slate300 }}>
                      <T style={{ fontSize: fs.lg }}>{e.emoji}</T>
                    </View>
                    <T w={600} style={{ flex: 1, fontSize: fs.lg }}>
                      {e.name}
                    </T>
                    <T style={{ fontSize: fs.sm, color: tw.purple500 }}>{new Date(e.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</T>
                    <View style={{ borderRadius: 999, paddingHorizontal: 8, backgroundColor: e.points > 0 ? tw.green200 : tw.red200 }}>
                      <T w={700} style={{ color: e.points > 0 ? tw.green800 : tw.red700 }}>
                        {e.points > 0 ? `+${e.points}` : e.points}
                      </T>
                    </View>
                    <Pressable onPress={() => setRemoving(e)} hitSlop={8} style={{ borderRadius: 999, backgroundColor: tw.purple100, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <T w={700} style={{ fontSize: fs.xs, color: tw.purple500 }}>
                        🔒✕
                      </T>
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            )}
          </Card>
        </Section>

        <Section title="My Week 📊">
          <Card style={{ height: 224, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 8, padding: 16 }}>
            {week.map((w, i) => (
              <View key={i} style={{ flex: 1, height: "100%", alignItems: "center", justifyContent: "flex-end" }}>
                <T w={700} style={{ fontSize: fs.sm }}>
                  {w.stars}
                </T>
                <WeekBar pct={w.stars / weekMax} i={i} color={w.isToday ? kid.color : "#c77dff"} />
                <T w={w.isToday ? 700 : 400} style={{ marginTop: 4, fontSize: fs.sm, color: w.isToday ? tw.pink600 : undefined }}>
                  {w.label}
                </T>
              </View>
            ))}
          </Card>
        </Section>
      </ScrollView>

      {removing && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={[StyleSheet.absoluteFill, { zIndex: 40 }]}>
          <Pressable onPress={closeRemove} style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", padding: 16, backgroundColor: "rgba(59,7,100,0.6)" }]}>
            <Animated.View entering={ZoomIn.springify().damping(14)} exiting={ZoomOut}>
              <Pressable onPress={() => {}}>
                <Card style={{ alignItems: "center", padding: 20 }}>
                  <Pressable onPress={closeRemove} hitSlop={12} style={{ position: "absolute", right: 16, top: 12 }}>
                    <T style={{ fontSize: fs["3xl"], color: tw.purple400 }}>✕</T>
                  </Pressable>
                  <T style={{ fontSize: fs["4xl"], lineHeight: fs["4xl"] * 1.2 }}>🔐</T>
                  <T w={700} style={{ marginTop: 4, textAlign: "center", fontSize: fs["2xl"] }}>
                    Grown-ups only
                  </T>
                  <T w={600} style={{ marginTop: 4, textAlign: "center", color: tw.purple700 }}>
                    Remove {removing.emoji} {removing.name} ({removing.points > 0 ? `+${removing.points}` : removing.points})?
                  </T>
                  <View style={{ marginTop: 12 }}>
                    <PinPad
                      hint="Enter parent PIN"
                      onSubmit={async (pin) => {
                        if (!(await checkParentPin(pin).catch(() => false))) return false;
                        if (await removeEntry(removing.id, pin)) setRemoving(null);
                        return true;
                      }}
                    />
                  </View>
                </Card>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Animated.View>
      )}

      <FeedbackOverlay feedback={feedback} onClose={closeFeedback} />
      <MilestoneOverlay milestone={showMilestone && !feedback ? (queue[0] ?? null) : null} kidName={kid.name} onDone={() => setQueue((q) => q.slice(1))} />
    </View>
  );
}

function Header({ avatar, color, name, onHome }: { avatar: string; color: string; name: string; onHome: () => void }) {
  const p = useLoop(2000);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${kf(p.value, [0, -8, 8, 0])}deg` }] }));
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <Animated.View
        style={[
          { width: 56, height: 56, borderRadius: 28, borderWidth: 4, borderColor: tw.white, alignItems: "center", justifyContent: "center", backgroundColor: color, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" },
          style,
        ]}
      >
        <T style={{ fontSize: fs["4xl"], lineHeight: fs["4xl"] * 1.2 }}>{avatar}</T>
      </Animated.View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <OutlineText numberOfLines={1} style={{ fontSize: fs["3xl"], lineHeight: fs["3xl"] * 1.3, color: tw.white }}>
          Hi {name}!
        </OutlineText>
      </View>
      <Btn3D bg={tw.white} scale={0.9} silent onPress={onHome} style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        <T style={{ fontSize: fs["2xl"] }}>🏠</T>
      </Btn3D>
    </View>
  );
}

function Hero({ children }: { children: React.ReactNode }) {
  const y = useSharedValue(40);
  useEffect(() => {
    y.value = withSpring(0, spring(0.25));
  }, [y]);
  const style = useAnimatedStyle(() => ({ opacity: 1 - y.value / 40, transform: [{ translateY: y.value }] }));
  return (
    <Animated.View style={[{ marginTop: 16 }, style]}>
      <Card style={{ alignItems: "center", gap: 16, padding: 20 }}>{children}</Card>
    </Animated.View>
  );
}

function TotalStars({ total }: { total: number }) {
  const pop = useSharedValue(1);
  useEffect(() => {
    pop.value = withSequence(withTiming(1.4, { duration: 0 }), withSpring(1, spring(0.25)));
  }, [pop, total]);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const spin = useLoop(6000);
  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));
  return (
    <Animated.View style={[{ flexDirection: "row", alignItems: "center", gap: 8 }, popStyle]}>
      <Animated.View style={spinStyle}>
        <T style={{ fontSize: fs["6xl"], lineHeight: fs["6xl"] * 1.2 }}>⭐</T>
      </Animated.View>
      <CountUp value={total} style={{ fontSize: fs["6xl"], lineHeight: fs["6xl"] * 1.15, color: tw.purple900 }} />
    </Animated.View>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withSpring(Math.max(4, progress * 100), spring(0.3, 1200));
  }, [w, progress]);
  const style = useAnimatedStyle(() => ({ width: `${w.value}%` }));
  return (
    <View style={{ height: 32, width: "100%", overflow: "hidden", borderRadius: 999, borderWidth: 4, borderColor: tw.purple900, backgroundColor: tw.purple100 }}>
      <Animated.View style={[{ height: "100%", borderRadius: 999, backgroundImage: "linear-gradient(90deg,#ffbe0b,#fb5607,#ff006e,#8338ec)" }, style]} />
    </View>
  );
}

function WeekBar({ pct, i, color }: { pct: number; i: number; color: string }) {
  const h = useSharedValue(0);
  useEffect(() => {
    h.value = withDelay(i * 70, withSpring(pct * 100, spring(0.4)));
  }, [h, pct, i]);
  const style = useAnimatedStyle(() => ({ height: `${h.value}%` }));
  return (
    <View style={{ width: "100%", flex: 1, justifyContent: "flex-end" }}>
      <Animated.View style={[{ width: "100%", minHeight: 4, borderTopLeftRadius: 12, borderTopRightRadius: 12, backgroundColor: color }, style]} />
    </View>
  );
}
