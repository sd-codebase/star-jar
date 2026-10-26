import { uid } from "@/lib/uid";
import { cols } from "@/lib/server/db";
import { familyOf, requireParent, snapshot } from "@/lib/server/family";
import { authedRoute, body } from "@/lib/server/http";
import { kidBody } from "@/lib/server/schemas";

export const POST = authedRoute(async (req, { user }) => {
  const fam = await familyOf(user);
  requireParent(req, fam);
  const k = await body(req, kidBody);
  const { kids } = await cols();
  await kids.insertOne({ ...k, id: uid(), unlocked: {}, giftsGiven: {}, createdAt: Date.now(), familyId: fam._id, lastTapAt: null });
  return snapshot(user);
});
