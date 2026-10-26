import type { Activity, Entry, Milestone, Settings } from "./types";

export const MIN = 60_000;

export function dayKey(ms: number) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export const isToday = (ms: number, now = Date.now()) => dayKey(ms) === dayKey(now);

export function pinFor(birthdate: string) {
  const [, m, d] = birthdate.split("-");
  return `${d ?? ""}${m ?? ""}`;
}

/** Running total that never drops below zero, so little ones never see negative stars. */
export function totalStars(entries: Entry[]) {
  return [...entries].sort((a, b) => a.at - b.at).reduce((t, e) => Math.max(0, t + e.points), 0);
}

export type Check =
  | { ok: true }
  | { ok: false; reason: "daily" }
  | { ok: false; reason: "same" | "any"; waitMs: number };

/** Kid-tap limits: max N per day per activity, gap between same activity, gap between any activity. */
export function checkTap(kidEntries: Entry[], activity: Activity, settings: Pick<Settings, "maxPerDay" | "sameGapMin" | "anyGapMin">, now = Date.now()): Check {
  const same = kidEntries.filter((e) => e.activityId === activity.id);
  if (same.filter((e) => isToday(e.at, now)).length >= settings.maxPerDay) return { ok: false, reason: "daily" };

  const lastSame = Math.max(0, ...same.map((e) => e.at));
  const sameWait = lastSame + settings.sameGapMin * MIN - now;
  if (sameWait > 0) return { ok: false, reason: "same", waitMs: sameWait };

  const lastAny = Math.max(0, ...kidEntries.map((e) => e.at));
  const anyWait = lastAny + settings.anyGapMin * MIN - now;
  if (anyWait > 0) return { ok: false, reason: "any", waitMs: anyWait };

  return { ok: true };
}

export function formatWait(ms: number) {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}:${String(s % 60).padStart(2, "0")}` : `${s}s`;
}

/** Next treasure still to unlock (already-unlocked ones stay unlocked even if stars drop). */
export function nextMilestone(milestones: Milestone[], total: number, unlocked: Record<string, number>) {
  const next = [...milestones].sort((a, b) => a.points - b.points).find((m) => m.points > total && !unlocked[m.id]) ?? null;
  return { next };
}
