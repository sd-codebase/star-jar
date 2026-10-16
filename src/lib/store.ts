"use client";

import { useSyncExternalStore } from "react";
import { DEFAULTS_REV, defaultData, upgradeActivities } from "./defaults";
import { checkTap, totalStars, type Check } from "./rules";
import type { AppData, Entry, Milestone } from "./types";

const KEY = "starjar.v1";
let cache: AppData | null = null;
const listeners = new Set<() => void>();

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function migrate(raw: Partial<AppData>): AppData {
  const base = defaultData();
  return {
    ...base,
    ...raw,
    version: 1,
    activities: upgradeActivities(raw.activities ?? base.activities, raw.defaultsRev ?? 1),
    defaultsRev: DEFAULTS_REV,
    kids: (raw.kids ?? []).map((k) => ({ ...k, unlocked: k.unlocked ?? {}, giftsGiven: k.giftsGiven ?? {} })),
    settings: { ...base.settings, ...raw.settings },
  };
}

function read(): AppData {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    cache = parsed ? migrate(parsed) : defaultData();
    if (parsed && parsed.defaultsRev !== DEFAULTS_REV) localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    cache = defaultData();
  }
  return cache;
}

export function getData() {
  return read();
}

export function setData(updater: (d: AppData) => AppData) {
  cache = updater(read());
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // storage full or blocked — keep in-memory state
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** null during server render / before hydration. */
export function useData(): AppData | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export type LogResult =
  | { ok: true; entry: Entry; total: number; unlocked: Milestone[] }
  | { ok: false; check: Exclude<Check, { ok: true }> };

export function logActivity(kidId: string, activityId: string, byParent = false): LogResult | null {
  const data = read();
  const activity = data.activities.find((a) => a.id === activityId);
  const kid = data.kids.find((k) => k.id === kidId);
  if (!activity || !kid || (activity.parentOnly && !byParent)) return null;

  const kidEntries = data.entries.filter((e) => e.kidId === kidId);
  if (!byParent) {
    const check = checkTap(kidEntries, activity, data.settings);
    if (!check.ok) return { ok: false, check };
  }

  return { ok: true, ...addEntry(kidId, { activityId, name: activity.name, emoji: activity.emoji, points: activity.points, kind: activity.kind, byParent: byParent || undefined }) };
}

/** Parent-only bonus of any size; works even if the Bonus activity was deleted or renamed. */
export function giveBonus(kidId: string, points: number) {
  if (!read().kids.some((k) => k.id === kidId)) return null;
  return addEntry(kidId, { activityId: "bonus", name: "Earned a Bonus", emoji: "🎉", points, kind: "good", byParent: true });
}

function addEntry(kidId: string, fields: Omit<Entry, "id" | "kidId" | "at">) {
  const data = read();
  const kid = data.kids.find((k) => k.id === kidId)!;
  const entry: Entry = { id: uid(), kidId, at: Date.now(), ...fields };
  const total = totalStars([...data.entries.filter((e) => e.kidId === kidId), entry]);
  const unlocked = data.milestones
    .filter((m) => m.points <= total && !kid.unlocked[m.id])
    .sort((a, b) => a.points - b.points);

  setData((d) => ({
    ...d,
    entries: [...d.entries, entry],
    kids: d.kids.map((k) =>
      k.id === kidId
        ? { ...k, unlocked: { ...k.unlocked, ...Object.fromEntries(unlocked.map((m) => [m.id, entry.at])) } }
        : k,
    ),
  }));
  return { entry, total, unlocked };
}

/**
 * Remove an accidental entry. Treasures unlocked by that same tap are locked again
 * if the child no longer has enough stars — unless the parent already handed over the gift.
 */
export function removeEntry(entryId: string) {
  setData((d) => {
    const entry = d.entries.find((e) => e.id === entryId);
    if (!entry) return d;
    const entries = d.entries.filter((e) => e.id !== entryId);
    const total = totalStars(entries.filter((e) => e.kidId === entry.kidId));
    const kids = d.kids.map((k) => {
      if (k.id !== entry.kidId) return k;
      const unlocked = { ...k.unlocked };
      for (const m of d.milestones) {
        if (unlocked[m.id] === entry.at && m.points > total && !k.giftsGiven[m.id]) delete unlocked[m.id];
      }
      return { ...k, unlocked };
    });
    return { ...d, entries, kids };
  });
}

export function exportJson() {
  return JSON.stringify(read(), null, 2);
}

export function importJson(text: string) {
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed?.kids) || !Array.isArray(parsed?.entries) || !Array.isArray(parsed?.activities)) {
    throw new Error("This file doesn't look like a Star Jar backup.");
  }
  setData(() => migrate(parsed));
}
