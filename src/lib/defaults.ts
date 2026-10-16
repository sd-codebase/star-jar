import type { Activity, AppData, Milestone } from "./types";

export const AVATARS = ["🦁", "🐯", "🐼", "🐨", "🦊", "🐸", "🐵", "🦄", "🐲", "🐶", "🐱", "🐰", "🐧", "🦖", "🐙", "🦋", "🐬", "🦉"];

export const COLORS = ["#ff4d6d", "#ff8c00", "#ffc300", "#2ec4b6", "#3a86ff", "#8338ec", "#ff006e", "#06d6a0"];

export const DEFAULT_ACTIVITIES: Activity[] = [
  { id: "early-rise", name: "Early Rise", emoji: "🌅", points: 5, kind: "good" },
  { id: "early-bed", name: "Early Bed", emoji: "🛏️", points: 5, kind: "good" },
  { id: "classwork", name: "Classwork", emoji: "📚", points: 5, kind: "good" },
  { id: "homework", name: "Homework", emoji: "✏️", points: 5, kind: "good" },
  { id: "brush-teeth", name: "Brush Teeth", emoji: "🪥", points: 5, kind: "good" },
  { id: "bath", name: "Bath Time", emoji: "🛁", points: 5, kind: "good" },
  { id: "play-outside", name: "Play Outside", emoji: "⚽", points: 5, kind: "good" },
  { id: "no-screen", name: "No Screen", emoji: "📵", points: 5, kind: "good" },
  { id: "fighting", name: "Fighting", emoji: "😠", points: -5, kind: "bad" },
  { id: "not-listening", name: "Not Listening", emoji: "🙉", points: -5, kind: "bad" },
  { id: "too-much-screen", name: "Too Much Screen", emoji: "📱", points: -5, kind: "bad" },
  { id: "tantrum", name: "Tantrum", emoji: "😭", points: -5, kind: "bad" },
  { id: "messy-room", name: "Messy Room", emoji: "🧸", points: -5, kind: "bad" },
];

export const DEFAULT_MILESTONES: Milestone[] = [
  { id: "m25", points: 25, title: "Little Star", badge: "⭐", gift: "Pick a sticker" },
  { id: "m50", points: 50, title: "Shiny Rocket", badge: "🚀", gift: "Ice cream treat 🍦" },
  { id: "m100", points: 100, title: "Rainbow Hero", badge: "🌈", gift: "Small toy 🧸" },
  { id: "m200", points: 200, title: "Super Dino", badge: "🦖", gift: "Park trip 🎡" },
  { id: "m350", points: 350, title: "Magic Unicorn", badge: "🦄", gift: "Choose a movie night 🍿" },
  { id: "m500", points: 500, title: "Golden Trophy", badge: "🏆", gift: "Big surprise gift 🎁" },
  { id: "m750", points: 750, title: "Dragon Master", badge: "🐉", gift: "Fun day out 🎢" },
  { id: "m1000", points: 1000, title: "King / Queen", badge: "👑", gift: "Dream gift! ✨" },
];

export function defaultData(): AppData {
  return {
    version: 1,
    kids: [],
    activities: DEFAULT_ACTIVITIES.map((a) => ({ ...a })),
    milestones: DEFAULT_MILESTONES.map((m) => ({ ...m })),
    entries: [],
    settings: {
      parentPin: null,
      sound: true,
      voice: true,
      maxPerDay: 2,
      sameGapMin: 10,
      anyGapMin: 1,
    },
  };
}
