import { familyOf } from "@/lib/server/family";
import { authedRoute, body } from "@/lib/server/http";
import { pinBody } from "@/lib/server/schemas";

export const POST = authedRoute(async (req, { user }) => {
  const fam = await familyOf(user);
  const { pin } = await body(req, pinBody);
  return { ok: !!fam.settings.parentPin && pin === fam.settings.parentPin };
});
