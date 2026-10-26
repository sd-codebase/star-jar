import { NextResponse } from "next/server";
import type { VerifyOtpResponse } from "@/lib/api-types";
import { uid } from "@/lib/uid";
import { cols, type UserDoc } from "@/lib/server/db";
import { createFamily, person } from "@/lib/server/family";
import { body, publicRoute } from "@/lib/server/http";
import { checkOtp, normalizePhone } from "@/lib/server/otp";
import { verifyOtpBody } from "@/lib/server/schemas";
import { createSession, isMobile, setSessionCookie } from "@/lib/server/session";

export const POST = publicRoute(async (req) => {
  const b = await body(req, verifyOtpBody);
  const phone = normalizePhone(b.phone);
  await checkOtp(phone, b.otp);

  const { users, invites } = await cols();
  let user = await users.findOne({ phone });
  const isNewUser = !user;
  if (!user) {
    user = { _id: uid(), phone, name: b.name ?? "", familyId: null, createdAt: new Date() } satisfies UserDoc;
    await users.insertOne(user);
    // A co-parent who was invited before signing up lands straight in that family.
    const invite = await invites.findOneAndDelete({ phone, expiresAt: { $gt: new Date() } }, { sort: { createdAt: -1 } });
    if (invite) {
      await users.updateOne({ _id: user._id }, { $set: { familyId: invite.familyId } });
      user.familyId = invite.familyId;
    } else {
      await createFamily(user);
    }
  }

  const { token, session } = await createSession(user._id, req);
  const payload: VerifyOtpResponse = { user: person(user), isNewUser, ...(isMobile(req) ? { token } : {}) };
  const res = NextResponse.json(payload);
  if (!isMobile(req)) setSessionCookie(res, token, session.expiresAt);
  return res;
});
