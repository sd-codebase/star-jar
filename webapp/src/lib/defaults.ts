import type { Activity, AppData, Milestone } from "./types";

export const AVATARS = ["🦁", "🐯", "🐼", "🐨", "🦊", "🐸", "🐵", "🦄", "🐲", "🐶", "🐱", "🐰", "🐧", "🦖", "🐙", "🦋", "🐬", "🦉"];

export const COLORS = ["#ff4d6d", "#ff8c00", "#ffc300", "#2ec4b6", "#3a86ff", "#8338ec", "#ff006e", "#06d6a0"];

export const DEFAULTS_REV = 3;

export const DEFAULT_ACTIVITIES: Activity[] = [
  { id: "early-rise", name: "Woke Up Early", emoji: "🌅", points: 5, kind: "good" },
  { id: "early-bed", name: "Slept Early", emoji: "🛏️", points: 5, kind: "good" },
  { id: "brush-teeth", name: "Brushed Teeth", emoji: "🪥", points: 5, kind: "good" },
  { id: "bath", name: "Took a Bath", emoji: "🛁", points: 5, kind: "good" },
  { id: "afternoon-nap", name: "Took a Nap", emoji: "😴", points: 5, kind: "good" },
  { id: "breakfast", name: "Finished Breakfast", emoji: "🥣", points: 5, kind: "good" },
  { id: "tiffin-finish", name: "Finished Tiffin", emoji: "🍱", points: 5, kind: "good" },
  { id: "lunch", name: "Finished Lunch", emoji: "🍛", points: 5, kind: "good" },
  { id: "dinner", name: "Finished Dinner", emoji: "🍽️", points: 5, kind: "good" },
  { id: "healthy-fruits", name: "Ate Healthy Fruits", emoji: "🍎", points: 5, kind: "good" },
  { id: "help-mom", name: "Helped Mom", emoji: "💐", points: 5, kind: "good" },
  { id: "help-dad", name: "Helped Dad", emoji: "🛠️", points: 5, kind: "good" },
  { id: "good-behaviour", name: "Behaved Well", emoji: "😇", points: 5, kind: "good" },
  { id: "classwork", name: "Did Classwork", emoji: "📚", points: 5, kind: "good" },
  { id: "hindi-homework", name: "Did Hindi Homework", emoji: "📝", points: 5, kind: "good" },
  { id: "maths-homework", name: "Did Maths Homework", emoji: "🔢", points: 5, kind: "good" },
  { id: "english-homework", name: "Did English Homework", emoji: "🔤", points: 5, kind: "good" },
  { id: "evs-homework", name: "Did EVS Homework", emoji: "🌳", points: 5, kind: "good" },
  { id: "good-handwriting", name: "Wrote Neatly", emoji: "✍️", points: 5, kind: "good" },
  { id: "school-activities", name: "Joined School Activities", emoji: "🏫", points: 5, kind: "good" },
  { id: "play-outside", name: "Played Outside", emoji: "⚽", points: 5, kind: "good" },
  { id: "no-screen", name: "Stayed Off Screens", emoji: "📵", points: 5, kind: "good" },
  { id: "bonus", name: "Earned a Bonus", emoji: "🎉", points: 5, kind: "good", parentOnly: true },
  { id: "fighting", name: "Fought", emoji: "😠", points: -5, kind: "bad" },
  { id: "not-listening", name: "Didn't Listen", emoji: "🙉", points: -5, kind: "bad" },
  { id: "bad-behaviour", name: "Behaved Badly", emoji: "😤", points: -5, kind: "bad" },
  { id: "yelled-at-mom", name: "Yelled at Mom", emoji: "🗣️", points: -5, kind: "bad" },
  { id: "junk-food", name: "Ate Junk Food", emoji: "🍟", points: -5, kind: "bad" },
  { id: "too-much-screen", name: "Watched Too Much Screen", emoji: "📱", points: -5, kind: "bad" },
  { id: "tantrum", name: "Threw a Tantrum", emoji: "😭", points: -5, kind: "bad" },
  { id: "messy-room", name: "Left Room Messy", emoji: "🧸", points: -5, kind: "bad" },
];

/** Names shipped in revision 1 — renamed on upgrade only if the parent never edited them. */
const REV1_NAMES: Record<string, string> = {
  "early-rise": "Early Rise",
  "early-bed": "Early Bed",
  classwork: "Classwork",
  homework: "Homework",
  "brush-teeth": "Brush Teeth",
  bath: "Bath Time",
  "play-outside": "Play Outside",
  "no-screen": "No Screen",
  fighting: "Fighting",
  "not-listening": "Not Listening",
  "too-much-screen": "Too Much Screen",
  tantrum: "Tantrum",
  "messy-room": "Messy Room",
};

/** Rev-1 activities replaced by dedicated ones (generic Homework → per-subject homework). */
const REMOVED_IDS = new Set(["homework"]);

/** Built-in activities added after rev 2. Anything not listed here or in REV1_NAMES arrived in rev 2. */
const INTRODUCED_IN: Record<string, number> = { breakfast: 3, lunch: 3, dinner: 3 };
const introducedIn = (id: string) => (REV1_NAMES[id] ? 1 : (INTRODUCED_IN[id] ?? 2));

/** Bring saved activities up to the latest built-in list without touching parent customisations. */
export function upgradeActivities(activities: Activity[], rev: number): Activity[] {
  if (rev >= DEFAULTS_REV) return activities;
  const byId = new Map(DEFAULT_ACTIVITIES.map((a) => [a.id, a]));
  let result = activities;
  if (rev < 2) {
    result = result
      .filter((a) => !(REMOVED_IDS.has(a.id) && REV1_NAMES[a.id] === a.name))
      .map((a) => {
        const def = byId.get(a.id);
        return def && REV1_NAMES[a.id] === a.name ? { ...a, name: def.name } : a;
      });
  }
  // Insert each new built-in right after its predecessor in the default list, so related items stay together.
  result = [...result];
  DEFAULT_ACTIVITIES.forEach((def, i) => {
    if (introducedIn(def.id) <= rev || result.some((a) => a.id === def.id)) return;
    const prevIds = new Set(DEFAULT_ACTIVITIES.slice(0, i).map((d) => d.id));
    let at = -1;
    result.forEach((a, j) => {
      if (prevIds.has(a.id)) at = j;
    });
    result.splice(at + 1, 0, { ...def });
  });
  return result;
}

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
    defaultsRev: DEFAULTS_REV,
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
