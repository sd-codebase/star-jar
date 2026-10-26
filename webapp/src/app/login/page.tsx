"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import SkyBackground from "@/components/SkyBackground";
import { sendOtp, updateMyName, useStore, verifyOtp } from "@/lib/store";

type Step = "phone" | "otp" | "name";

const input = "w-full rounded-2xl border-4 border-purple-200 bg-white px-4 py-3 text-2xl outline-none focus:border-purple-500";
const btn = "btn3d w-full bg-green-500 px-6 py-3 text-xl text-white disabled:opacity-40";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useStore();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const otpRef = useRef<HTMLInputElement>(null);

  // Already logged in (e.g. opened /login directly): nothing to do here.
  useEffect(() => {
    if (status === "authed" && step === "phone") router.replace("/");
  }, [status, step, router]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const attempt = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const send = () =>
    attempt(async () => {
      await sendOtp(phone);
      setStep("otp");
      setOtp("");
      setResendIn(30);
      setTimeout(() => otpRef.current?.focus(), 50);
    });

  const verify = () =>
    attempt(async () => {
      const res = await verifyOtp(phone, otp);
      if (res.user.name) router.replace("/");
      else setStep("name");
    });

  const saveName = () =>
    attempt(async () => {
      if (await updateMyName(name.trim())) router.replace("/");
    });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <SkyBackground />
      <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", bounce: 0.6 }} className="flex flex-col items-center">
        <div className="text-7xl drop-shadow-xl">🫙</div>
        <h1 className="text-outline mt-1 text-5xl font-bold text-yellow-300 drop-shadow-[0_6px_0_rgba(0,0,0,0.25)]">Star Jar</h1>
      </motion.div>

      <motion.div key={step} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="card mt-6 w-full max-w-sm p-6">
        {step === "phone" && (
          <form onSubmit={(e) => (e.preventDefault(), void send())} className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">Parent login</h2>
            <p className="font-semibold text-purple-700">We&apos;ll send a code to your WhatsApp.</p>
            <div className="flex items-center gap-2">
              <span className="rounded-2xl bg-purple-100 px-3 py-3 text-2xl font-bold text-purple-800">+91</span>
              <input
                className={input}
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="98765 43210"
                maxLength={11}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d ]/g, ""))}
                autoFocus
              />
            </div>
            <button className={btn} disabled={busy || phone.replace(/\D/g, "").length !== 10}>
              {busy ? "Sending…" : "Send WhatsApp code"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={(e) => (e.preventDefault(), void verify())} className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">Enter the code</h2>
            <p className="font-semibold text-purple-700">
              Sent to WhatsApp +91 {phone}.{" "}
              <button type="button" className="text-purple-500 underline" onClick={() => setStep("phone")}>
                Change
              </button>
            </p>
            <input
              ref={otpRef}
              className={`${input} text-center tracking-[0.5em]`}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="••••••"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            />
            <button className={btn} disabled={busy || otp.length !== 6}>
              {busy ? "Checking…" : "Log in"}
            </button>
            <button type="button" className="font-semibold text-purple-600 underline disabled:no-underline disabled:opacity-50" disabled={busy || resendIn > 0} onClick={() => void send()}>
              {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
            </button>
          </form>
        )}

        {step === "name" && (
          <form onSubmit={(e) => (e.preventDefault(), void saveName())} className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">Welcome! 👋</h2>
            <p className="font-semibold text-purple-700">What should we call you?</p>
            <input className={input} placeholder="e.g. Mom, Papa, Riya" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            <button className={btn} disabled={busy || !name.trim()}>
              {busy ? "Saving…" : "Continue"}
            </button>
          </form>
        )}

        {error && <p className="mt-3 font-semibold text-red-600">{error}</p>}
      </motion.div>
    </main>
  );
}
