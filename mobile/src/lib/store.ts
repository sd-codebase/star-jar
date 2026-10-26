import { create } from "zustand";
import type { FamilySnapshot, LogResult, MeResponse, VerifyOtpResponse } from "@shared/api-types";
import type { Activity, AppData, Entry, Kid, Milestone, Settings } from "@shared/types";
import { api, getToken, RequestError, setToken, setUnauthenticatedHandler } from "./api";

export { uid } from "@shared/uid";

export type Status = "loading" | "authed" | "anon" | "error";
type FamilyPatch = { name?: string; settings?: Partial<Omit<Settings, "parentPin">>; activities?: Activity[]; milestones?: Milestone[] };

interface State {
  status: Status;
  data: FamilySnapshot | null;
  /** Last failed request, shown as a toast. */
  error: string | null;
  /** The child who entered their PIN on Home; the kid screen only opens for them. */
  activeKidId: string | null;
  /** Parent Zone unlocked: the PIN below is held for parent-only requests. */
  parentUnlocked: boolean;
}

export const useStore = create<State>(() => ({ status: "loading", data: null, error: null, activeKidId: null, parentUnlocked: false }));
export const useData = () => useStore((s) => s.data);
const set = useStore.setState;
const get = useStore.getState;

/** Parent PIN held in memory while the Parent Zone is unlocked; never persisted. */
let parentPin: string | null = null;
function setParentPin(pin: string | null) {
  parentPin = pin;
  set({ parentUnlocked: !!pin });
}

setUnauthenticatedHandler(() => {
  setParentPin(null);
  pending = null;
  set({ status: "anon", data: null, activeKidId: null });
});

let errorTimer: ReturnType<typeof setTimeout> | undefined;
function report(e: unknown) {
  if (e instanceof RequestError && e.status === 401) return;
  const msg = e instanceof RequestError ? e.message : "Something went wrong. Please try again.";
  clearTimeout(errorTimer);
  set({ error: msg });
  errorTimer = setTimeout(() => set({ error: null }), 5000);
}
export const dismissError = () => set({ error: null });
export const setActiveKid = (id: string | null) => set({ activeKidId: id });

/* ---------------- Loading & auth ---------------- */

let loading: Promise<void> | null = null;

export function load() {
  loading ??= (async () => {
    if (!(await getToken())) return set({ status: "anon", data: null });
    try {
      applySnapshot(await api<FamilySnapshot>("/family"));
    } catch (e) {
      if (!(e instanceof RequestError && e.status === 401)) set({ status: "error", error: (e as Error).message });
    }
  })().finally(() => (loading = null));
  return loading;
}

export const sendOtp = (phone: string) => api<{ ok: true }>("/auth/send-otp", { body: { phone } });

export async function verifyOtp(phone: string, otp: string, name?: string) {
  const res = await api<VerifyOtpResponse>("/auth/verify-otp", { body: { phone, otp, name } });
  if (!res.token) throw new Error("Login failed. Please try again.");
  await setToken(res.token);
  await load();
  return res;
}

export async function logout() {
  await api("/auth/logout", { method: "POST" }).catch(() => {});
  await setToken(null);
  setParentPin(null);
  pending = null;
  set({ status: "anon", data: null, activeKidId: null });
}

export const getMe = () => api<MeResponse>("/me");

export function updateMyName(name: string) {
  return run(async () => {
    await api("/me", { method: "PATCH", body: { name } });
    return api<FamilySnapshot>("/family");
  });
}

/* ---------------- Parent PIN ---------------- */

/** Creates the PIN if the family has none yet; otherwise checks it. On success the Parent Zone is unlocked. */
export async function unlockParent(pin: string) {
  try {
    const d = get().data!;
    if (!d.settings.hasParentPin) {
      await api("/family/pin", { method: "PUT", body: { pin } });
      set({ data: { ...d, settings: { ...d.settings, hasParentPin: true } } });
    } else if (!(await checkParentPin(pin))) return false;
    setParentPin(pin);
    return true;
  } catch (e) {
    report(e);
    return false;
  }
}

export const lockParent = () => setParentPin(null);

export async function checkParentPin(pin: string) {
  return (await api<{ ok: boolean }>("/family/pin/verify", { body: { pin } })).ok;
}

export function changeParentPin(pin: string) {
  return run(async () => {
    await api("/family/pin", { method: "PUT", body: { pin }, pin: parentPin });
    setParentPin(pin);
  });
}

/* ---------------- Family edits ---------------- */

/**
 * Inline edits (activity names, settings…) update the screen instantly and are sent
 * after a short pause, so typing doesn't fire a request per keystroke.
 */
let pending: FamilyPatch | null = null;
let flushTimer: ReturnType<typeof setTimeout> | undefined;

function withPending(d: FamilySnapshot): FamilySnapshot {
  if (!pending) return d;
  return {
    ...d,
    family: pending.name ? { ...d.family, name: pending.name } : d.family,
    activities: pending.activities ?? d.activities,
    milestones: pending.milestones ?? d.milestones,
    settings: { ...d.settings, ...pending.settings },
  };
}

function applySnapshot(data: FamilySnapshot) {
  set({ status: "authed", data: withPending(data) });
}

export function patchFamily(patch: FamilyPatch) {
  pending = { ...pending, ...patch, settings: patch.settings || pending?.settings ? { ...pending?.settings, ...patch.settings } : undefined };
  set({ data: withPending(get().data!) });
  clearTimeout(flushTimer);
  flushTimer = setTimeout(() => void flushFamily(), 500);
}

/** Sends unsaved inline edits now (also called when the Parent Zone closes). */
export async function flushFamily() {
  clearTimeout(flushTimer);
  const body = pending;
  if (!body) return;
  try {
    // The response isn't applied: local state already reflects these edits (and possibly newer ones).
    await api("/family", { method: "PATCH", body, pin: parentPin });
    if (pending === body) pending = null;
  } catch (e) {
    pending = null;
    report(e);
    void load();
  }
}

/** Runs a request that returns the whole family; failures become a toast. Resolves true on success. */
async function run(fn: () => Promise<FamilySnapshot | void>) {
  try {
    const data = await fn();
    if (data) applySnapshot(data);
    return true;
  } catch (e) {
    report(e);
    return false;
  }
}

const parent = (path: string, method: string, body?: unknown) => () => api<FamilySnapshot>(path, { method, body, pin: parentPin });

export function saveKid(k: Pick<Kid, "id" | "name" | "avatar" | "color" | "birthdate">, isNew: boolean) {
  const body = { name: k.name, avatar: k.avatar, color: k.color, birthdate: k.birthdate };
  return run(isNew ? parent("/kids", "POST", body) : parent(`/kids/${k.id}`, "PATCH", body));
}

export const deleteKid = (id: string) => run(parent(`/kids/${id}`, "DELETE"));
export const setGiftGiven = (kidId: string, milestoneId: string, given: boolean) =>
  run(parent(`/kids/${kidId}/gifts/${encodeURIComponent(milestoneId)}`, "PUT", { given }));
export const resetFamily = (scope: "stars" | "everything") => run(parent("/family/reset", "POST", { scope }));
export const inviteParent = (phone: string) => run(parent("/family/invites", "POST", { phone }));
export const revokeInvite = (id: string) => run(parent(`/family/invites/${id}`, "DELETE"));
export const removeMember = (id: string) => run(parent(`/family/members/${id}`, "DELETE"));
export const acceptInvite = (id: string) => run(() => api<FamilySnapshot>(`/invites/${id}/accept`, { method: "POST" }));

/** Remove an accidental entry. The kid screen passes the PIN it just asked for; the Parent Zone uses the unlocked one. */
export const removeEntry = (entryId: string, pin = parentPin) => run(() => api<FamilySnapshot>(`/entries/${entryId}`, { method: "DELETE", pin }));

/* ---------------- Stars ---------------- */

function addLocalEntry(entry: Entry, unlocked: Milestone[]) {
  const d = get().data!;
  set({
    data: {
      ...d,
      entries: [...d.entries, entry],
      kids: d.kids.map((k) =>
        k.id === entry.kidId && unlocked.length ? { ...k, unlocked: { ...k.unlocked, ...Object.fromEntries(unlocked.map((m) => [m.id, entry.at])) } } : k,
      ),
    },
  });
}

/** Kid tap (limits enforced by the server) or parent award. Null when the request failed. */
export async function logActivity(kidId: string, activityId: string, byParent = false): Promise<LogResult | null> {
  try {
    const res = await api<LogResult>("/entries", { body: { kidId, activityId, byParent: byParent || undefined }, pin: byParent ? parentPin : undefined });
    if (res.ok) addLocalEntry(res.entry, res.unlocked);
    return res;
  } catch (e) {
    report(e);
    return null;
  }
}

/** Parent-only bonus of any size; works even if the Bonus activity was deleted or renamed. */
export async function giveBonus(kidId: string, points: number) {
  try {
    const res = await api<Extract<LogResult, { ok: true }>>("/entries/bonus", { body: { kidId, points }, pin: parentPin });
    addLocalEntry(res.entry, res.unlocked);
    return res;
  } catch (e) {
    report(e);
    return null;
  }
}

/* ---------------- Backup ---------------- */

export async function exportJson() {
  const data = await api<AppData>("/family/export", { pin: parentPin });
  return JSON.stringify(data, null, 2);
}

export async function importJson(text: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("This file doesn't look like a Star Jar backup.");
  }
  const p = parsed as Partial<AppData> | null;
  if (!Array.isArray(p?.kids) || !Array.isArray(p?.entries) || !Array.isArray(p?.activities)) {
    throw new Error("This file doesn't look like a Star Jar backup.");
  }
  applySnapshot(await api<FamilySnapshot>("/family/import", { body: parsed, pin: parentPin }));
}
