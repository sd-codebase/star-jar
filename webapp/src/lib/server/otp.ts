import "server-only";
import { createHash, randomInt, timingSafeEqual } from "crypto";
import { cols } from "./db";
import { env } from "./env";
import { HttpError } from "./http";

export const OTP_EXPIRE_MIN = 10;
const MAX_ATTEMPTS = 5;
const RESEND_GAP_MS = 30_000;
const SEND_WINDOW_MS = 10 * 60_000;
const MAX_SENDS_PER_WINDOW = 3;

/** Accepts "98765 43210", "+919876543210", "09876543210" … returns the bare 10 digits. */
export function normalizePhone(input: string) {
  let d = String(input ?? "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (!/^[6-9]\d{9}$/.test(d)) throw new HttpError(400, "Enter a valid 10-digit Indian mobile number.", "bad_phone");
  return d;
}

const hashOtp = (phone: string, otp: string) => createHash("sha256").update(`${phone}:${otp}`).digest();

export const isDemo = (phone: string) => !!env.demo.phone && phone === env.demo.phone;

/** Creates and stores a fresh code, enforcing resend limits. Returns the code for the caller to deliver. */
export async function issueOtp(phone: string) {
  const { otps } = await cols();
  const now = Date.now();
  const prev = await otps.findOne({ _id: phone });
  const recent = (prev?.sends ?? []).filter((d) => now - d.getTime() < SEND_WINDOW_MS);
  const last = recent.at(-1)?.getTime() ?? 0;
  if (now - last < RESEND_GAP_MS) {
    throw new HttpError(429, `Please wait ${Math.ceil((RESEND_GAP_MS - (now - last)) / 1000)}s before asking for a new code.`, "otp_cooldown");
  }
  if (recent.length >= MAX_SENDS_PER_WINDOW) throw new HttpError(429, "Too many codes requested. Try again in a few minutes.", "otp_limit");

  const otp = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await otps.updateOne(
    { _id: phone },
    {
      $set: {
        hash: hashOtp(phone, otp).toString("hex"),
        expiresAt: new Date(now + OTP_EXPIRE_MIN * 60_000),
        attempts: 0,
        sends: [...recent, new Date(now)],
        purgeAt: new Date(now + 60 * 60_000),
      },
    },
    { upsert: true },
  );
  return otp;
}

/** Throws unless `otp` matches the live code; a correct code is consumed. */
export async function checkOtp(phone: string, otp: string) {
  if (isDemo(phone)) {
    if (!env.demo.otp || otp !== env.demo.otp) throw new HttpError(400, "Wrong code. Please try again.", "otp_invalid");
    return;
  }
  const { otps } = await cols();
  // Count the attempt before comparing, so parallel guesses can't exceed the limit.
  const doc = await otps.findOneAndUpdate(
    { _id: phone, expiresAt: { $gt: new Date() }, attempts: { $lt: MAX_ATTEMPTS } },
    { $inc: { attempts: 1 } },
    { returnDocument: "after" },
  );
  if (!doc) throw new HttpError(400, "This code has expired. Ask for a new one.", "otp_expired");

  const expected = Buffer.from(doc.hash, "hex");
  const given = hashOtp(phone, String(otp ?? "").trim());
  if (!timingSafeEqual(expected, given)) {
    const left = MAX_ATTEMPTS - doc.attempts;
    throw new HttpError(400, left > 0 ? `Wrong code. ${left} ${left === 1 ? "try" : "tries"} left.` : "Too many wrong tries. Ask for a new code.", "otp_invalid");
  }
  await otps.updateOne({ _id: phone }, { $set: { expiresAt: new Date(0) } });
}
