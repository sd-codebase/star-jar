import { body, HttpError, publicRoute } from "@/lib/server/http";
import { isDemo, issueOtp, normalizePhone } from "@/lib/server/otp";
import { sendOtpBody } from "@/lib/server/schemas";
import { sendWhatsAppOtp } from "@/lib/server/whatsapp";

export const POST = publicRoute(async (req) => {
  const phone = normalizePhone((await body(req, sendOtpBody)).phone);
  if (isDemo(phone)) return { ok: true };
  const otp = await issueOtp(phone);
  if (!(await sendWhatsAppOtp(phone, otp))) throw new HttpError(502, "Couldn't send the WhatsApp code. Please try again.", "otp_send_failed");
  return { ok: true };
});
