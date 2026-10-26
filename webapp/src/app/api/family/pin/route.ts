import { cols } from "@/lib/server/db";
import { familyOf, requireParent } from "@/lib/server/family";
import { authedRoute, body } from "@/lib/server/http";
import { pinBody } from "@/lib/server/schemas";

/** Create the parent PIN, or change it (changing needs the current PIN in the header). */
export const PUT = authedRoute(async (req, { user }) => {
  const fam = await familyOf(user);
  requireParent(req, fam);
  const { pin } = await body(req, pinBody);
  const { families } = await cols();
  await families.updateOne({ _id: fam._id }, { $set: { "settings.parentPin": pin } });
  return { ok: true };
});
