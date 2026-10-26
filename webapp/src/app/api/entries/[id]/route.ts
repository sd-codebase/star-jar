import { familyOf, removeEntry, requireParent, snapshot } from "@/lib/server/family";
import { authedRoute } from "@/lib/server/http";

export const DELETE = authedRoute<{ id: string }>(async (req, { user }, { id }) => {
  const fam = await familyOf(user);
  requireParent(req, fam);
  await removeEntry(fam, id);
  return snapshot(user);
});
