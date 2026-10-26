import { defaultData } from "@/lib/defaults";
import { cols } from "@/lib/server/db";
import { familyOf, requireParent, snapshot } from "@/lib/server/family";
import { authedRoute, body } from "@/lib/server/http";
import { resetBody } from "@/lib/server/schemas";

/** "stars" clears entries and badges; "everything" also removes kids and restores default activities and settings. */
export const POST = authedRoute(async (req, { user }) => {
  const fam = await familyOf(user);
  requireParent(req, fam);
  const { scope } = await body(req, resetBody);
  const c = await cols();
  await c.entries.deleteMany({ familyId: fam._id });
  if (scope === "stars") {
    await c.kids.updateMany({ familyId: fam._id }, { $set: { unlocked: {}, giftsGiven: {}, lastTapAt: null } });
  } else {
    const d = defaultData();
    await c.kids.deleteMany({ familyId: fam._id });
    await c.families.updateOne({ _id: fam._id }, { $set: { activities: d.activities, milestones: d.milestones, settings: d.settings, defaultsRev: d.defaultsRev } });
  }
  return snapshot(user);
});
