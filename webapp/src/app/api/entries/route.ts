import { familyOf, logActivity, requireParent } from "@/lib/server/family";
import { authedRoute, body } from "@/lib/server/http";
import { entryBody } from "@/lib/server/schemas";

/** Kid tap (tap limits apply, no PIN) or parent award with `byParent` (PIN required, limits skipped). */
export const POST = authedRoute(async (req, { user }) => {
  const fam = await familyOf(user);
  const b = await body(req, entryBody);
  if (b.byParent) requireParent(req, fam);
  return logActivity(fam, user, b.kidId, b.activityId, !!b.byParent);
});
