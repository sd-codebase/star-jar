"use client";

import confetti from "canvas-confetti";
import { getData } from "./store";

let ctx: AudioContext | null = null;

function audio() {
  if (!getData()?.settings.sound) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "triangle", vol = 0.18) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + start;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

export const sounds = {
  tap: () => tone(660, 0, 0.08, "sine", 0.12),
  good: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.08, 0.3)),
  bad: () => [392, 349, 311, 262].forEach((f, i) => tone(f, i * 0.18, 0.35, "sine", 0.15)),
  wrong: () => [220, 196].forEach((f, i) => tone(f, i * 0.12, 0.15, "square", 0.06)),
  fanfare: () =>
    [523, 523, 523, 659, 784, 659, 784, 1047].forEach((f, i) =>
      tone(f, [0, 0.12, 0.24, 0.36, 0.6, 0.78, 0.9, 1.1][i], i === 7 ? 0.8 : 0.2, "square", 0.1),
    ),
};

export function speak(text: string) {
  if (!getData()?.settings.voice || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const clean = text.replace(/[\p{Extended_Pictographic}‍️]/gu, "").trim();
  const u = new SpeechSynthesisUtterance(clean);
  u.rate = 0.95;
  u.pitch = 1.3;
  const voice = speechSynthesis.getVoices().find((v) => v.lang.startsWith("en") && /female|samantha|google/i.test(v.name));
  if (voice) u.voice = voice;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

const PARTY = ["#ff006e", "#ffbe0b", "#3a86ff", "#8338ec", "#06d6a0", "#fb5607"];

export function burst(x = 0.5, y = 0.5) {
  const star = confetti.shapeFromText({ text: "⭐", scalar: 2 });
  confetti({ particleCount: 90, spread: 100, startVelocity: 45, origin: { x, y }, colors: PARTY });
  confetti({ particleCount: 25, spread: 120, startVelocity: 35, origin: { x, y }, shapes: [star], scalar: 2 });
}

export function fireworks(ms = 3500) {
  const end = Date.now() + ms;
  const frame = () => {
    confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0, y: 0.8 }, colors: PARTY });
    confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1, y: 0.8 }, colors: PARTY });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
  [0, 700, 1400, 2100].forEach((d) =>
    setTimeout(
      () => confetti({ particleCount: 120, spread: 360, startVelocity: 30, origin: { x: Math.random() * 0.6 + 0.2, y: Math.random() * 0.3 + 0.15 }, colors: PARTY }),
      d,
    ),
  );
}
