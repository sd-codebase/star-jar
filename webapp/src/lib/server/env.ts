import "server-only";

function required(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

export const env = {
  get mongoUri() {
    return required("MONGODB_URI");
  },
  mongoDb: process.env.MONGODB_DB || "starjar",
  isProd: process.env.NODE_ENV === "production",
  /** "production" sends real WhatsApp messages; anything else prints the OTP to the server console. */
  notifyLive: process.env.NOTIFICATION_MODE === "production",
  whatsapp: {
    token: process.env.WHATSAPP_API_TOKEN ?? "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
    templateName: process.env.WHATSAPP_TEMPLATE_NAME ?? "",
    templateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? "en",
    appName: process.env.WHATSAPP_APP_NAME || "Star Jar",
    contactNumber: process.env.WHATSAPP_CONTACT_NUMBER ?? "",
  },
  demo: {
    phone: process.env.DEMO_WHATSAPP_NUMBER ?? "",
    otp: process.env.DEMO_OTP ?? "",
  },
};
