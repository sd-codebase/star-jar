import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { emitConfetti } from "@/components/Confetti";
import { useStore } from "./store";

void setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});

// Real kids' voices for good and oops taps, the milestone fanfare, and sci-fi interface sounds
// for everything else (all from Pixabay).
const SOURCES = {
  yay: require("../../assets/sounds/yay.mp3"),
  uhOh: require("../../assets/sounds/uh-oh.mp3"),
  fanfare: require("../../assets/sounds/fanfare.wav"),
  click: require("../../assets/sounds/click.mp3"),
  open: require("../../assets/sounds/screen-open.mp3"),
  close: require("../../assets/sounds/close.mp3"),
  key: require("../../assets/sounds/key.mp3"),
  unlock: require("../../assets/sounds/unlock.mp3"),
  denied: require("../../assets/sounds/denied.mp3"),
  notYet: require("../../assets/sounds/not-yet.mp3"),
  giftTap: require("../../assets/sounds/gift-tap.mp3"),
};
type SoundName = keyof typeof SOURCES;

// A few players per sound, used in turn, so rapid presses (PIN digits, clicks) overlap instead of
// cutting each other off.
const POOL = 3;
const players: Partial<Record<SoundName, AudioPlayer[]>> = {};
const next: Partial<Record<SoundName, number>> = {};

const player = (name: SoundName, i: number) => ((players[name] ??= [])[i] ??= createAudioPlayer(SOURCES[name]));

/** Loads sounds ahead of time; creating a player is slow enough to lag the tap that first needs it. */
export function preloadSounds(...names: SoundName[]) {
  try {
    for (const name of names) for (let i = 0; i < POOL; i++) player(name, i);
  } catch {
    // audio unavailable — stay silent
  }
}

/** How long the PIN pad shows "unlocked" before moving on, so the unlock sound finishes with the screen fade. */
export const UNLOCK_HOLD_MS = 450;

function play(name: SoundName, { stopOthers = false } = {}) {
  if (!useStore.getState().data?.settings.sound) return;
  try {
    // Leaving a screen or popup: cut whatever it was still playing so nothing spills onto the next one.
    if (stopOthers) for (const [n, pool] of Object.entries(players)) if (n !== name) pool?.forEach((other) => other.pause());
    const i = next[name] ?? 0;
    next[name] = (i + 1) % POOL;
    const p = player(name, i);
    void p
      .seekTo(0)
      .catch(() => {})
      .then(() => p.play());
  } catch {
    // audio unavailable — stay silent
  }
}

export const sounds = {
  tap: () => {
    play("click");
    void Haptics.selectionAsync();
  },
  /** A screen or popup appears (the PIN pad). */
  open: () => play("open"),
  /** A popup is dismissed or the child goes back home. */
  close: () => {
    play("close", { stopOthers: true });
    void Haptics.selectionAsync();
  },
  /** One PIN digit. */
  key: () => {
    play("key");
    void Haptics.selectionAsync();
  },
  unlock: () => {
    play("unlock");
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  denied: () => {
    play("denied");
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
  /** Tap refused by the limits: not the child's fault, so a gentle ping rather than "uh oh". */
  notYet: () => {
    play("notYet");
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },
  giftTap: () => {
    play("giftTap");
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  good: () => {
    play("yay");
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  bad: () => {
    play("uhOh");
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },
  fanfare: () => play("fanfare"),
};

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
