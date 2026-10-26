import { familyOf, giveBonus, requireParent } from "@/lib/server/family";
import { authedRoute, body } from "@/lib/server/http";
import { bonusBody } from "@/lib/server/schemas";

export const POST = authedRoute(async (req, { user }) => {
  const fam = await familyOf(user);
  requireParent(req, fam);
  const b = await body(req, bonusBody);
  return { ok: true, ...(await giveBonus(fam, user, b.kidId, b.points)) };
});
