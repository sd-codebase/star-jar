import "server-only";
import type { NextRequest } from "next/server";
import { PARENT_PIN_HEADER, type FamilySnapshot, type LogResult, type Person } from "../api-types";
import { DEFAULTS_REV, defaultData, upgradeActivities } from "../defaults";
import { checkTap, totalStars } from "../rules";
import type { Entry, Kid } from "../types";
import { uid } from "../uid";
import { cols, type EntryDoc, type FamilyDoc, type KidDoc, type UserDoc } from "./db";
import { HttpError } from "./http";

export const person = (u: UserDoc): Person => ({ id: u._id, name: u.name, phone: u.phone });

export async function createFamily(user: UserDoc) {
  const { families, users } = await cols();
  const d = defaultData();
  const fam: FamilyDoc = {
    _id: uid(),
    name: user.name ? `${user.name}'s family` : "My family",
    activities: d.activities,
    milestones: d.milestones,
    settings: d.settings,
    defaultsRev: DEFAULTS_REV,
    createdBy: user._id,
    createdAt: new Date(),
  };
  await families.insertOne(fam);
  await users.updateOne({ _id: user._id }, { $set: { familyId: fam._id } });
  user.familyId = fam._id;
  return fam;
}

/** The caller's family, creating one if they have none (new parent, or removed from a co-parent family). */
export async function familyOf(user: UserDoc): Promise<FamilyDoc> {
  const { families } = await cols();
  const fam = user.familyId ? await families.findOne({ _id: user.familyId }) : null;
  if (!fam) return createFamily(user);
  if ((fam.defaultsRev ?? 1) < DEFAULTS_REV) {
    fam.activities = upgradeActivities(fam.activities, fam.defaultsRev ?? 1);
    fam.defaultsRev = DEFAULTS_REV;
    await families.updateOne({ _id: fam._id }, { $set: { activities: fam.activities, defaultsRev: DEFAULTS_REV } });
  }
  return fam;
}

/** Parent-only actions must carry the family PIN (once one has been created). */
export function requireParent(req: NextRequest, fam: FamilyDoc) {
  const pin = fam.settings.parentPin;
  if (pin && req.headers.get(PARENT_PIN_HEADER) !== pin) throw new HttpError(403, "Parent PIN required.", "parent_pin");
}

const stripKid = ({ _id, familyId, lastTapAt, ...k }: KidDoc): Kid => (void _id, void familyId, void lastTapAt, k);
const stripEntry = ({ _id, familyId, byUserId, ...e }: EntryDoc): Entry => (void _id, void familyId, void byUserId, e);

export async function snapshot(user: UserDoc): Promise<FamilySnapshot> {
  const fam = await familyOf(user);
  const c = await cols();
  const [kids, entries, members, invites] = await Promise.all([
    c.kids.find({ familyId: fam._id }).sort({ createdAt: 1 }).toArray(),
    c.entries.find({ familyId: fam._id }).sort({ at: 1 }).toArray(),
    c.users.find({ familyId: fam._id }).sort({ createdAt: 1 }).toArray(),
    c.invites.find({ familyId: fam._id, expiresAt: { $gt: new Date() } }).toArray(),
  ]);
  const { parentPin, ...settings } = fam.settings;
  return {
    family: { id: fam._id, name: fam.name },
    me: person(user),
    members: members.map(person),
    invites: invites.map((i) => ({ id: i._id, phone: i.phone, expiresAt: i.expiresAt.toISOString() })),
    kids: kids.map(stripKid),
    activities: fam.activities,
    milestones: fam.milestones,
    entries: entries.map(stripEntry),
    settings: { ...settings, hasParentPin: !!parentPin },
  };
}

export async function findKid(familyId: string, kidId: string) {
  const { kids } = await cols();
  const kid = await kids.findOne({ familyId, id: kidId });
  if (!kid) throw new HttpError(404, "Child not found.", "not_found");
  return kid;
}

async function kidEntries(familyId: string, kidId: string) {
  const { entries } = await cols();
  return (await entries.find({ familyId, kidId }).toArray()).map(stripEntry);
}

/**
 * Kid tap (rules enforced) or parent award (rules skipped). Kid taps claim the child's
 * `lastTapAt` slot atomically, so two devices tapping at once can't both get through.
 */
export async function logActivity(fam: FamilyDoc, user: UserDoc, kidId: string, activityId: string, byParent: boolean): Promise<LogResult> {
  const activity = fam.activities.find((a) => a.id === activityId);
  if (!activity || (activity.parentOnly && !byParent)) throw new HttpError(404, "Activity not found.", "not_found");
  const kid = await findKid(fam._id, kidId);
  const existing = await kidEntries(fam._id, kidId);

  if (!byParent) {
    const check = checkTap(existing, activity, fam.settings);
    if (!check.ok) return { ok: false, check };
    const { kids } = await cols();
    const claimed = await kids.updateOne(
      { familyId: fam._id, id: kidId, lastTapAt: kid.lastTapAt ?? null },
      { $set: { lastTapAt: Date.now() } },
    );
    if (!claimed.modifiedCount) {
      return { ok: false, check: { ok: false, reason: "any", waitMs: fam.settings.anyGapMin * 60_000 } };
    }
  }

  return {
    ok: true,
    ...(await addEntry(fam, user, kid, existing, {
      activityId,
      name: activity.name,
      emoji: activity.emoji,
      points: activity.points,
      kind: activity.kind,
      byParent: byParent || undefined,
    })),
  };
}

/** Parent-only bonus of any size; works even if the Bonus activity was deleted or renamed. */
export async function giveBonus(fam: FamilyDoc, user: UserDoc, kidId: string, points: number) {
  const kid = await findKid(fam._id, kidId);
  const existing = await kidEntries(fam._id, kidId);
  return addEntry(fam, user, kid, existing, { activityId: "bonus", name: "Earned a Bonus", emoji: "🎉", points, kind: "good", byParent: true });
}

async function addEntry(fam: FamilyDoc, user: UserDoc, kid: KidDoc, existing: Entry[], fields: Omit<Entry, "id" | "kidId" | "at">) {
  const c = await cols();
  const entry: Entry = { id: uid(), kidId: kid.id, at: Date.now(), ...fields };
  if (!entry.byParent) delete entry.byParent;
  const total = totalStars([...existing, entry]);
  const unlocked = fam.milestones.filter((m) => m.points <= total && !kid.unlocked[m.id]).sort((a, b) => a.points - b.points);

  await c.entries.insertOne({ ...entry, familyId: fam._id, byUserId: user._id });
  if (unlocked.length) {
    await c.kids.updateOne(
      { familyId: fam._id, id: kid.id },
      { $set: Object.fromEntries(unlocked.map((m) => [`unlocked.${m.id}`, entry.at])) },
    );
  }
  return { entry, total, unlocked };
}

/**
 * Remove an accidental entry. Treasures unlocked by that same tap are locked again
 * if the child no longer has enough stars — unless the parent already handed over the gift.
 */
export async function removeEntry(fam: FamilyDoc, entryId: string) {
  const c = await cols();
  const entry = await c.entries.findOneAndDelete({ familyId: fam._id, id: entryId });
  if (!entry) throw new HttpError(404, "Entry not found.", "not_found");
  const kid = await c.kids.findOne({ familyId: fam._id, id: entry.kidId });
  if (!kid) return;
  const total = totalStars(await kidEntries(fam._id, entry.kidId));
  const relock = fam.milestones.filter((m) => kid.unlocked[m.id] === entry.at && m.points > total && !kid.giftsGiven[m.id]);
  if (relock.length) {
    await c.kids.updateOne({ _id: kid._id }, { $unset: Object.fromEntries(relock.map((m) => [`unlocked.${m.id}`, ""])) });
  }
}
