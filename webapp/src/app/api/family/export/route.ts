import type { AppData } from "@/lib/types";
import { cols } from "@/lib/server/db";
import { familyOf, requireParent } from "@/lib/server/family";
import { authedRoute } from "@/lib/server/http";

/** Same JSON shape as the old webapp's backup file, so it round-trips through Import. */
export const GET = authedRoute(async (req, { user }): Promise<AppData> => {
  const fam = await familyOf(user);
  requireParent(req, fam);
  const c = await cols();
  const [kids, entries] = await Promise.all([
    c.kids.find({ familyId: fam._id }, { projection: { _id: 0, familyId: 0, lastTapAt: 0 } }).sort({ createdAt: 1 }).toArray(),
    c.entries.find({ familyId: fam._id }, { projection: { _id: 0, familyId: 0, byUserId: 0 } }).sort({ at: 1 }).toArray(),
  ]);
  return { version: 1, defaultsRev: fam.defaultsRev, kids, activities: fam.activities, milestones: fam.milestones, entries, settings: fam.settings };
});
