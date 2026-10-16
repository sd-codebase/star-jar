"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import ActivityCard from "@/components/ActivityCard";
import FeedbackOverlay, { type Feedback } from "@/components/FeedbackOverlay";
import JourneyMap from "@/components/JourneyMap";
import MilestoneOverlay from "@/components/MilestoneOverlay";
import PinPad from "@/components/PinPad";
import SkyBackground from "@/components/SkyBackground";
import StarJar, { CountUp } from "@/components/StarJar";
import { burst, sounds, speak } from "@/lib/fx";
import { badMessage, goodMessage } from "@/lib/messages";
import { checkTap, dayKey, formatWait, isToday, nextMilestone, totalStars } from "@/lib/rules";
import { logActivity, removeEntry, uid, useData } from "@/lib/store";
import type { Activity, Entry, Milestone } from "@/lib/types";

function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-8">
    <h2 className="text-outline mb-3 text-2xl font-bold sm:text-3xl text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.2)]">{title}</h2>
    {children}
  </section>
);

export default function KidPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const data = useData();
  const now = useNow();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [queue, setQueue] = useState<Milestone[]>([]);
  const [showMilestone, setShowMilestone] = useState(false);
  const [removing, setRemoving] = useState<Entry | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem("starjar.kid") !== id) router.replace("/");
  }, [id, router]);

  const closeFeedback = useCallback(() => {
    setFeedback(null);
    setShowMilestone(true);
  }, []);

  const kid = data?.kids.find((k) => k.id === id);
  if (!data || !kid) return <SkyBackground />;

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

  const tap = (activity: Activity, e: React.MouseEvent) => {
    const res = logActivity(kid.id, activity.id);
    if (!res) return;
    if (!res.ok) {
      const c = res.check;
      const text =
        c.reason === "daily"
          ? `${activity.name}: already ${data.settings.maxPerDay} times today! Come back tomorrow.`
          : c.reason === "same"
            ? `Wait ${formatWait(c.waitMs)} to tap ${activity.name} again.`
            : `Take a tiny break! Try again in ${formatWait(c.waitMs)}.`;
      sounds.wrong();
      speak(text);
      setFeedback({ id: uid(), kind: "blocked", emoji: c.reason === "daily" ? "🌙" : "⏳", title: c.reason === "daily" ? "All done!" : "Wait a little!", text });
      return;
    }
    if (activity.kind === "good") {
      const m = goodMessage(kid.name);
      burst(e.clientX / window.innerWidth, e.clientY / window.innerHeight);
      sounds.good();
      speak(`${m.title} ${m.text} Plus ${activity.points} stars!`);
      setFeedback({ id: uid(), kind: "good", emoji: activity.emoji, points: activity.points, ...m });
    } else {
      const m = badMessage(kid.name);
      sounds.bad();
      speak(m.text);
      setFeedback({ id: uid(), kind: "bad", emoji: activity.emoji, points: activity.points, ...m });
    }
    if (res.unlocked.length) {
      setShowMilestone(false);
      setQueue((q) => [...q, ...res.unlocked]);
    }
  };

  const logout = () => {
    sessionStorage.removeItem("starjar.kid");
    router.push("/");
  };

  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-4">
      <SkyBackground />

      <header className="flex items-center gap-3">
        <motion.div
          animate={{ rotate: [0, -8, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-white text-4xl shadow-lg sm:h-16 sm:w-16 sm:text-5xl"
          style={{ background: kid.color }}
        >
          {kid.avatar}
        </motion.div>
        <h1 className="text-outline min-w-0 flex-1 truncate text-3xl font-bold text-white drop-shadow sm:text-4xl">Hi {kid.name}!</h1>
        <motion.button whileTap={{ scale: 0.9 }} onClick={logout} className="btn3d bg-white px-4 py-2 text-2xl">
          🏠
        </motion.button>
      </header>

      {/* Hero: jar + total + next goal */}
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="card mt-4 flex flex-col items-center gap-4 p-5 sm:flex-row sm:gap-8">
        <StarJar progress={progress} color={kid.color} />
        <div className="flex w-full flex-1 flex-col items-center sm:items-start">
          <div className="text-xl font-semibold text-purple-700">My Stars</div>
          <motion.div key={total} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="flex items-center gap-2 text-6xl font-bold text-purple-900 sm:text-7xl">
            <motion.span animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }}>
              ⭐
            </motion.span>
            <CountUp value={total} />
          </motion.div>
          <div className="mt-1 text-lg font-semibold text-purple-600">Today: {todayStars >= 0 ? `+${todayStars}` : todayStars} ⭐</div>
          {next ? (
            <div className="mt-4 w-full">
              <div className="mb-1 flex justify-between text-lg font-bold">
                <span className="min-w-0 truncate">Next treasure: {next.title}</span>
                <span>🎁</span>
              </div>
              <div className="h-8 w-full overflow-hidden rounded-full border-4 border-purple-900 bg-purple-100">
                <motion.div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#ffbe0b,#fb5607,#ff006e,#8338ec)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(4, progress * 100)}%` }}
                  transition={{ type: "spring", bounce: 0.3, duration: 1.2 }}
                />
              </div>
              <div className="mt-1 text-center text-xl font-bold text-pink-600">Only {next.points - total} more stars! 🚀</div>
            </div>
          ) : (
            <div className="mt-4 text-2xl font-bold text-pink-600">👑 You unlocked EVERYTHING!</div>
          )}
        </div>
      </motion.div>

      <Section title="Earn Stars ⭐">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {good.map((a, i) => (
            <ActivityCard
              key={a.id}
              activity={a}
              index={i}
              maxPerDay={data.settings.maxPerDay}
              doneToday={today.filter((e) => e.activityId === a.id).length}
              check={checkTap(entries, a, data.settings, now)}
              onTap={(e) => tap(a, e)}
            />
          ))}
        </div>
      </Section>

      {bad.length > 0 && (
        <Section title="Oops Moments 🙈">
          <p className="-mt-2 mb-3 font-semibold text-white/90">Being honest is brave! Tap if this happened.</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {bad.map((a, i) => (
              <ActivityCard
                key={a.id}
                activity={a}
                index={i}
                maxPerDay={data.settings.maxPerDay}
                doneToday={today.filter((e) => e.activityId === a.id).length}
                check={checkTap(entries, a, data.settings, now)}
                onTap={(e) => tap(a, e)}
              />
            ))}
          </div>
        </Section>
      )}

      <Section title="My Treasure Road 🗺️">
        <JourneyMap kid={kid} milestones={data.milestones} total={total} />
      </Section>

      <Section title="My Badges 🏅">
        <div className="card no-scrollbar flex gap-4 overflow-x-auto p-4">
          {sortedMilestones.map((m, i) => {
            const got = !!kid.unlocked[m.id];
            return (
              <motion.div
                key={m.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.06, type: "spring" }}
                className="flex w-24 shrink-0 flex-col items-center text-center"
              >
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-full text-5xl ${
                    got ? "bg-gradient-to-br from-yellow-200 to-orange-300 shadow-[0_0_20px_rgba(255,190,11,0.8)]" : "bg-purple-100 opacity-40 grayscale"
                  }`}
                >
                  {got ? m.badge : "❓"}
                </div>
                <div className="mt-1 text-sm font-bold leading-tight">{got ? m.title : `${m.points}⭐`}</div>
                {got && m.gift && (
                  <div className={`mt-1 rounded-full px-2 text-xs font-bold ${kid.giftsGiven[m.id] ? "bg-green-200 text-green-800" : "bg-pink-200 text-pink-700"}`}>
                    {kid.giftsGiven[m.id] ? "Gift received ✓" : "Gift waiting 🎁"}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </Section>

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Today's Adventure 📅">
          <div className="card p-4">
            {today.length === 0 ? (
              <p className="py-6 text-center text-xl font-semibold text-purple-500">Nothing yet… tap a card to start! 🌟</p>
            ) : (
              <ol className="relative ml-4 border-l-4 border-dashed border-purple-300">
                {today.map((e, i) => (
                  <motion.li
                    key={e.id}
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative mb-3 ml-6 flex items-center gap-3"
                  >
                    <span className={`absolute -left-[2.35rem] flex h-8 w-8 items-center justify-center rounded-full text-lg ${e.points > 0 ? "bg-yellow-300" : "bg-slate-300"}`}>
                      {e.emoji}
                    </span>
                    <span className="flex-1 text-lg font-semibold">{e.name}</span>
                    <span className="text-sm text-purple-500">{new Date(e.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                    <span className={`rounded-full px-2 font-bold ${e.points > 0 ? "bg-green-200 text-green-800" : "bg-red-200 text-red-700"}`}>
                      {e.points > 0 ? `+${e.points}` : e.points}
                    </span>
                    <button
                      title="Parents: remove this"
                      onClick={() => setRemoving(e)}
                      className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-500 active:bg-purple-200"
                    >
                      🔒✕
                    </button>
                  </motion.li>
                ))}
              </ol>
            )}
          </div>
        </Section>

        <Section title="My Week 📊">
          <div className="card flex h-56 items-end justify-between gap-2 p-4">
            {week.map((w, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end">
                <span className="text-sm font-bold">{w.stars}</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(w.stars / weekMax) * 100}%` }}
                  transition={{ delay: i * 0.07, type: "spring", bounce: 0.4 }}
                  className="w-full min-h-1 rounded-t-xl"
                  style={{ background: w.isToday ? kid.color : "#c77dff" }}
                />
                <span className={`mt-1 text-sm ${w.isToday ? "font-bold text-pink-600" : ""}`}>{w.label}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <AnimatePresence>
        {removing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRemoving(null)}
            className="fixed inset-0 z-40 flex items-center justify-center bg-purple-950/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.4 }}
              onClick={(ev) => ev.stopPropagation()}
              className="card relative flex max-w-full flex-col items-center p-5"
            >
              <button onClick={() => setRemoving(null)} className="absolute right-4 top-3 text-3xl text-purple-400">
                ✕
              </button>
              <div className="text-4xl">🔐</div>
              <h2 className="mt-1 text-center text-2xl font-bold">Grown-ups only</h2>
              <p className="mt-1 text-center font-semibold text-purple-700">
                Remove {removing.emoji} {removing.name} ({removing.points > 0 ? `+${removing.points}` : removing.points})?
              </p>
              <div className="mt-3">
                <PinPad
                  hint="Enter parent PIN"
                  onSubmit={(pin) => {
                    if (!data.settings.parentPin || pin !== data.settings.parentPin) return false;
                    removeEntry(removing.id);
                    setRemoving(null);
                    return true;
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <FeedbackOverlay feedback={feedback} onClose={closeFeedback} />
      <MilestoneOverlay
        milestone={showMilestone && !feedback ? (queue[0] ?? null) : null}
        kidName={kid.name}
        onDone={() => setQueue((q) => q.slice(1))}
      />
    </main>
  );
}
