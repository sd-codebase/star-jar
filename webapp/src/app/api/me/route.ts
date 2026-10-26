import { NextResponse } from "next/server";
import type { MeResponse } from "@/lib/api-types";
import { cols } from "@/lib/server/db";
import { familyOf, person, requireParent } from "@/lib/server/family";
import { authedRoute, body, HttpError } from "@/lib/server/http";
import { isDemo } from "@/lib/server/otp";
import { meBody } from "@/lib/server/schemas";
import { clearSessionCookie } from "@/lib/server/session";

export const GET = authedRoute(async (_req, { user }): Promise<MeResponse> => {
  const { invites, families, users } = await cols();
  const pending = await invites.find({ phone: user.phone, familyId: { $ne: user.familyId ?? "" }, expiresAt: { $gt: new Date() } }).toArray();
  const [fams, inviters] = await Promise.all([
    families.find({ _id: { $in: pending.map((i) => i.familyId) } }).toArray(),
    users.find({ _id: { $in: pending.map((i) => i.invitedBy) } }).toArray(),
  ]);
  return {
    user: person(user),
    pendingInvites: pending.map((i) => ({
      id: i._id,
      familyName: fams.find((f) => f._id === i.familyId)?.name ?? "A family",
      invitedBy: inviters.find((u) => u._id === i.invitedBy)?.name ?? "",
    })),
  };
});

export const PATCH = authedRoute(async (req, { user }) => {
  const { name } = await body(req, meBody);
  const { users, families } = await cols();
  await users.updateOne({ _id: user._id }, { $set: { name } });
  // A family created before the parent told us their name gets a friendlier one.
  if (user.familyId) await families.updateOne({ _id: user.familyId, createdBy: user._id, name: "My family" }, { $set: { name: `${name}'s family` } });
  return { user: person({ ...user, name }) };
});

/**
 * Deletes the account (Play Store requirement). A parent alone in their family takes the
 * whole family with them: kids, history and invites. With co-parents, the family stays and
 * only this parent's account and sessions go.
 */
export const DELETE = authedRoute(async (req, auth) => {
  const { user } = auth;
  if (isDemo(user.phone)) throw new HttpError(403, "The demo account can't be deleted.", "forbidden");
  const fam = await familyOf(user);
  requireParent(req, fam);
  const c = await cols();
  const others = await c.users.countDocuments({ familyId: fam._id, _id: { $ne: user._id } });
  if (others === 0) {
    await Promise.all([
      c.kids.deleteMany({ familyId: fam._id }),
      c.entries.deleteMany({ familyId: fam._id }),
      c.invites.deleteMany({ familyId: fam._id }),
      c.families.deleteOne({ _id: fam._id }),
    ]);
  } else {
    await Promise.all([
      c.entries.updateMany({ familyId: fam._id, byUserId: user._id }, { $set: { byUserId: null } }),
      c.invites.deleteMany({ invitedBy: user._id }),
    ]);
  }
  await Promise.all([
    c.invites.deleteMany({ phone: user.phone }),
    c.otps.deleteOne({ _id: user.phone }),
    c.sessions.deleteMany({ userId: user._id }),
    c.users.deleteOne({ _id: user._id }),
  ]);
  // The session is gone, so don't let authedRoute renew its cookie.
  auth.renewCookie = false;
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res);
  return res;
});
