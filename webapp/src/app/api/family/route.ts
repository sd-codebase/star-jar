import { isBuiltIn, normalizeActivities } from "@/lib/defaults";
import { cols } from "@/lib/server/db";
import { familyOf, requireParent, snapshot } from "@/lib/server/family";
import { authedRoute, body, HttpError } from "@/lib/server/http";
import { familyPatch } from "@/lib/server/schemas";

export const GET = authedRoute(async (_req, { user }) => snapshot(user));

/** Parent edits: family name, tap limits & toggles, and the full activity / milestone lists. */
export const PATCH = authedRoute(async (req, { user }) => {
  const fam = await familyOf(user);
  requireParent(req, fam);
  const p = await body(req, familyPatch);
  const $set: Record<string, unknown> = {};
  if (p.name) $set.name = p.name;
  if (p.activities) {
    const kept = new Set(p.activities.map((a) => a.id));
    if (fam.activities.some((a) => isBuiltIn(a.id) && !kept.has(a.id))) {
      throw new HttpError(400, "Built-in activities can't be deleted. You can add your own with + Good or + Oops.", "builtin_activity");
    }
    $set.activities = normalizeActivities(p.activities);
  }
  if (p.milestones) $set.milestones = p.milestones;
  for (const [k, v] of Object.entries(p.settings ?? {})) $set[`settings.${k}`] = v;
  if (Object.keys($set).length) {
    const { families } = await cols();
    await families.updateOne({ _id: fam._id }, { $set });
  }
  return snapshot(user);
});
