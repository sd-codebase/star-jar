import { cols } from "@/lib/server/db";
import { familyOf, requireParent, snapshot } from "@/lib/server/family";
import { authedRoute, body } from "@/lib/server/http";
import { familyPatch } from "@/lib/server/schemas";

export const GET = authedRoute(async (_req, { user }) => snapshot(user));

/** Parent edits: family name, tap limits & toggles, and the full activity / milestone lists. */
export const PATCH = authedRoute(async (req, { user }) => {
  const fam = await familyOf(user);
  requireParent(req, fam);
  const p = await body(req, familyPatch);
  const $set: Record<string, unknown> = {};
  if (p.name) $set.name = p.name;
  if (p.activities) $set.activities = p.activities;
  if (p.milestones) $set.milestones = p.milestones;
  for (const [k, v] of Object.entries(p.settings ?? {})) $set[`settings.${k}`] = v;
  if (Object.keys($set).length) {
    const { families } = await cols();
    await families.updateOne({ _id: fam._id }, { $set });
  }
  return snapshot(user);
});
