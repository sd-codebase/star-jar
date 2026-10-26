import { DEFAULTS_REV, defaultData, upgradeActivities } from "@/lib/defaults";
import { cols } from "@/lib/server/db";
import { familyOf, requireParent, snapshot } from "@/lib/server/family";
import { authedRoute, body } from "@/lib/server/http";
import { backup } from "@/lib/server/schemas";

/** Replaces this family's kids, stars, activities, treasures and settings with a backup file. */
export const POST = authedRoute(async (req, { user }) => {
  const fam = await familyOf(user);
  requireParent(req, fam);
  const b = await body(req, backup);
  const d = defaultData();
  const kidIds = new Set(b.kids.map((k) => k.id));
  const now = Date.now();
  const c = await cols();

  await c.entries.deleteMany({ familyId: fam._id });
  await c.kids.deleteMany({ familyId: fam._id });
  if (b.kids.length) {
    await c.kids.insertMany(
      b.kids.map((k, i) => ({ ...k, unlocked: k.unlocked ?? {}, giftsGiven: k.giftsGiven ?? {}, createdAt: k.createdAt ?? now + i, familyId: fam._id, lastTapAt: null })),
    );
  }
  const entries = b.entries.filter((e) => kidIds.has(e.kidId));
  if (entries.length) await c.entries.insertMany(entries.map((e) => ({ ...e, familyId: fam._id, byUserId: null })));

  await c.families.updateOne(
    { _id: fam._id },
    {
      $set: {
        activities: upgradeActivities(b.activities, b.defaultsRev ?? 1),
        milestones: b.milestones ?? d.milestones,
        settings: { ...d.settings, ...b.settings, parentPin: b.settings?.parentPin ?? fam.settings.parentPin },
        defaultsRev: DEFAULTS_REV,
      },
    },
  );
  return snapshot(user);
});
