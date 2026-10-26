import "server-only";
import { env } from "./env";
import { OTP_EXPIRE_MIN } from "./otp";

/** Sends the login code with the same Meta template as the JEE/NEET apps. `phone` is the 10-digit number. */
export async function sendWhatsAppOtp(phone: string, otp: string): Promise<boolean> {
  const to = `91${phone}`;
  if (!env.notifyLive) {
    console.log(`\n[WHATSAPP] dev mode — OTP for ${to}: ${otp}\n`);
    return true;
  }

  const w = env.whatsapp;
  try {
    const res = await fetch(`https://graph.facebook.com/v22.0/${w.phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${w.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "template",
        template: {
          name: w.templateName,
          language: { code: w.templateLanguage },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: otp },
                { type: "text", text: w.appName },
                { type: "text", text: `${OTP_EXPIRE_MIN} Minutes` },
                { type: "text", text: w.contactNumber },
              ],
            },
            { type: "button", sub_type: "url", index: 0, parameters: [{ type: "text", text: otp }] },
          ],
        },
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (res.ok) return true;
    console.error(`[WHATSAPP] send to ${to} failed: ${res.status} ${await res.text()}`);
    return false;
  } catch (e) {
    console.error(`[WHATSAPP] send to ${to} failed:`, e);
    return false;
  }
}
