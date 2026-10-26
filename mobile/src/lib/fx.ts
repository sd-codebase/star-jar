import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { emitConfetti } from "@/components/Confetti";
import { useStore } from "./store";

void setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});

const SOURCES = {
  tap: require("../../assets/sounds/tap.wav"),
  good: require("../../assets/sounds/good.wav"),
  bad: require("../../assets/sounds/bad.wav"),
  wrong: require("../../assets/sounds/wrong.wav"),
  fanfare: require("../../assets/sounds/fanfare.wav"),
};
type SoundName = keyof typeof SOURCES;

const players: Partial<Record<SoundName, AudioPlayer>> = {};

function play(name: SoundName) {
  if (!useStore.getState().data?.settings.sound) return;
  try {
    const p = (players[name] ??= createAudioPlayer(SOURCES[name]));
    p.seekTo(0);
    p.play();
  } catch {
    // audio unavailable — stay silent
  }
}

export const sounds = {
  tap: () => play("tap"),
  good: () => {
    play("good");
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  bad: () => {
    play("bad");
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },
  wrong: () => {
    play("wrong");
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
  fanfare: () => play("fanfare"),
};

let voice: string | undefined | null = null;
async function pickVoice() {
  if (voice !== null) return voice;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const en = voices.filter((v) => v.language.startsWith("en"));
    voice = (en.find((v) => /female|samantha|google/i.test(`${v.name} ${v.identifier}`)) ?? en[0])?.identifier;
  } catch {
    voice = undefined;
  }
  return voice;
}

export async function speak(text: string) {
  if (!useStore.getState().data?.settings.voice) return;
  const clean = text.replace(/[\p{Extended_Pictographic}‍️]/gu, "").trim();
  const v = await pickVoice();
  void Speech.stop();
  Speech.speak(clean, { rate: 0.95, pitch: 1.3, language: "en", voice: v });
}

const PARTY = ["#ff006e", "#ffbe0b", "#3a86ff", "#8338ec", "#06d6a0", "#fb5607"];

/** Confetti burst at a screen fraction (0..1), like the web's canvas-confetti `burst`. */
export function burst(x = 0.5, y = 0.5) {
  emitConfetti({ x, y, count: 70, spread: 100, velocity: 45, angle: 90, colors: PARTY });
  emitConfetti({ x, y, count: 18, spread: 120, velocity: 35, angle: 90, colors: PARTY, star: true });
}

export function fireworks(ms = 3500) {
  const end = Date.now() + ms;
  const side = () => {
    emitConfetti({ x: 0, y: 0.8, count: 8, spread: 70, velocity: 45, angle: 60, colors: PARTY });
    emitConfetti({ x: 1, y: 0.8, count: 8, spread: 70, velocity: 45, angle: 120, colors: PARTY });
    if (Date.now() < end) setTimeout(side, 140);
  };
  side();
  [0, 700, 1400, 2100].forEach((d) =>
    setTimeout(() => emitConfetti({ x: Math.random() * 0.6 + 0.2, y: Math.random() * 0.3 + 0.15, count: 80, spread: 360, velocity: 30, angle: 90, colors: PARTY }), d),
  );
}
