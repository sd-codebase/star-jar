import { cols } from "@/lib/server/db";
import { familyOf, findKid, requireParent, snapshot } from "@/lib/server/family";
import { authedRoute, body } from "@/lib/server/http";
import { kidBody } from "@/lib/server/schemas";

export const PATCH = authedRoute<{ id: string }>(async (req, { user }, { id }) => {
  const fam = await familyOf(user);
  requireParent(req, fam);
  const k = await body(req, kidBody.partial());
  await findKid(fam._id, id);
  const { kids } = await cols();
  await kids.updateOne({ familyId: fam._id, id }, { $set: k });
  return snapshot(user);
});

/** Removes the child and all of their stars. */
export const DELETE = authedRoute<{ id: string }>(async (req, { user }, { id }) => {
  const fam = await familyOf(user);
  requireParent(req, fam);
  await findKid(fam._id, id);
  const { kids, entries } = await cols();
  await entries.deleteMany({ familyId: fam._id, kidId: id });
  await kids.deleteOne({ familyId: fam._id, id });
  return snapshot(user);
});
