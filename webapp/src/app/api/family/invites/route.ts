import { uid } from "@/lib/uid";
import { cols } from "@/lib/server/db";
import { familyOf, requireParent, snapshot } from "@/lib/server/family";
import { authedRoute, body, HttpError } from "@/lib/server/http";
import { normalizePhone } from "@/lib/server/otp";
import { inviteBody } from "@/lib/server/schemas";

const INVITE_DAYS = 7;

/** Invite a co-parent by WhatsApp number. They join on first login, or accept from their account if they already have one. */
export const POST = authedRoute(async (req, { user }) => {
  const fam = await familyOf(user);
  requireParent(req, fam);
  const phone = normalizePhone((await body(req, inviteBody)).phone);
  const c = await cols();
  if (await c.users.findOne({ phone, familyId: fam._id })) throw new HttpError(409, "That parent is already in your family.", "already_member");
  const now = new Date();
  await c.invites.updateOne(
    { familyId: fam._id, phone },
    { $set: { invitedBy: user._id, createdAt: now, expiresAt: new Date(now.getTime() + INVITE_DAYS * 86_400_000) }, $setOnInsert: { _id: uid() } },
    { upsert: true },
  );
  return snapshot(user);
});
