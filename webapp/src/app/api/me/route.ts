import type { MeResponse } from "@/lib/api-types";
import { cols } from "@/lib/server/db";
import { person } from "@/lib/server/family";
import { authedRoute, body } from "@/lib/server/http";
import { meBody } from "@/lib/server/schemas";

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
  const { users } = await cols();
  await users.updateOne({ _id: user._id }, { $set: { name } });
  return { user: person({ ...user, name }) };
});
