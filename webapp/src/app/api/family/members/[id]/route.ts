import { cols } from "@/lib/server/db";
import { familyOf, requireParent, snapshot } from "@/lib/server/family";
import { authedRoute, HttpError } from "@/lib/server/http";

/** Remove a co-parent. They are logged out everywhere and get a fresh empty family next time they log in. */
export const DELETE = authedRoute<{ id: string }>(async (req, { user }, { id }) => {
  const fam = await familyOf(user);
  requireParent(req, fam);
  if (id === user._id) throw new HttpError(400, "You can't remove yourself.", "invalid");
  const { users, sessions } = await cols();
  const res = await users.updateOne({ _id: id, familyId: fam._id }, { $set: { familyId: null } });
  if (!res.modifiedCount) throw new HttpError(404, "Parent not found.", "not_found");
  await sessions.deleteMany({ userId: id });
  return snapshot(user);
});
