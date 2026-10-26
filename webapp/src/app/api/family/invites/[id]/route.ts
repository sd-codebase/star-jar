import { cols } from "@/lib/server/db";
import { familyOf, requireParent, snapshot } from "@/lib/server/family";
import { authedRoute } from "@/lib/server/http";

export const DELETE = authedRoute<{ id: string }>(async (req, { user }, { id }) => {
  const fam = await familyOf(user);
  requireParent(req, fam);
  const { invites } = await cols();
  await invites.deleteOne({ _id: id, familyId: fam._id });
  return snapshot(user);
});
