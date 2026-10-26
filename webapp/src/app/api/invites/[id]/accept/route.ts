import { cols } from "@/lib/server/db";
import { snapshot } from "@/lib/server/family";
import { authedRoute, HttpError } from "@/lib/server/http";

/**
 * Join another family. Refused while the parent's current family still has kids,
 * so accepting an invite can never silently orphan a child's stars.
 */
export const POST = authedRoute<{ id: string }>(async (_req, { user }, { id }) => {
  const c = await cols();
  const invite = await c.invites.findOne({ _id: id, phone: user.phone, expiresAt: { $gt: new Date() } });
  if (!invite) throw new HttpError(404, "This invite has expired.", "not_found");

  if (user.familyId) {
    const kids = await c.kids.countDocuments({ familyId: user.familyId });
    const others = await c.users.countDocuments({ familyId: user.familyId, _id: { $ne: user._id } });
    if (kids && !others) throw new HttpError(409, "Your current family still has children. Export a backup and remove them first.", "family_not_empty");
    if (!others) await c.families.deleteOne({ _id: user.familyId });
  }

  await c.users.updateOne({ _id: user._id }, { $set: { familyId: invite.familyId } });
  await c.invites.deleteOne({ _id: invite._id });
  return snapshot({ ...user, familyId: invite.familyId });
});
