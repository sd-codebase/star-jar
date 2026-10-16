export type Kind = "good" | "bad";

export interface Kid {
  id: string;
  name: string;
  avatar: string; // emoji
  color: string; // hex
  birthdate: string; // YYYY-MM-DD — PIN is DDMM
  unlocked: Record<string, number>; // milestoneId -> unlocked at (ms)
  giftsGiven: Record<string, number>; // milestoneId -> parent handed real gift at (ms)
  createdAt: number;
}

export interface Activity {
  id: string;
  name: string;
  emoji: string;
  points: number; // positive for good, negative for bad
  kind: Kind;
  parentOnly?: boolean; // hidden from kids (e.g. Bonus) — only parents can award it
}

export interface Milestone {
  id: string;
  points: number;
  title: string;
  badge: string; // emoji badge the kid collects (virtual reward)
  gift: string; // real-world gift (optional, may be empty)
}

export interface Entry {
  id: string;
  kidId: string;
  activityId: string;
  name: string;
  emoji: string;
  points: number;
  kind: Kind;
  at: number;
  byParent?: boolean;
}

export interface Settings {
  parentPin: string | null;
  sound: boolean;
  voice: boolean;
  maxPerDay: number;
  sameGapMin: number;
  anyGapMin: number;
}

export interface AppData {
  version: 1;
  defaultsRev?: number; // which revision of the built-in activities this data has been upgraded to
  kids: Kid[];
  activities: Activity[];
  milestones: Milestone[];
  entries: Entry[];
  settings: Settings;
}
