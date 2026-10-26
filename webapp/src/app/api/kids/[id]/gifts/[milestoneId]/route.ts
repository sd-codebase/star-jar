import { cols } from "@/lib/server/db";
import { familyOf, findKid, requireParent, snapshot } from "@/lib/server/family";
import { authedRoute, body } from "@/lib/server/http";
import { giftBody } from "@/lib/server/schemas";

/** Mark a treasure's real-world gift as handed over (or undo). */
export const PUT = authedRoute<{ id: string; milestoneId: string }>(async (req, { user }, { id, milestoneId }) => {
  const fam = await familyOf(user);
  requireParent(req, fam);
  const { given } = await body(req, giftBody);
  await findKid(fam._id, id);
  const { kids } = await cols();
  const field = `giftsGiven.${milestoneId.replace(/[.$]/g, "")}`;
  await kids.updateOne({ familyId: fam._id, id }, given ? { $set: { [field]: Date.now() } } : { $unset: { [field]: "" } });
  return snapshot(user);
});
