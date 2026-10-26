/** Wire types shared by the Next.js API, the webapp and the Expo app. */
import type { Check } from "./rules";
import type { Activity, Entry, Kid, Milestone, Settings } from "./types";

export type PublicSettings = Omit<Settings, "parentPin"> & { hasParentPin: boolean };

export interface Person {
  id: string;
  name: string;
  phone: string;
}

export interface Invite {
  id: string;
  phone: string;
  expiresAt: string;
}

export interface FamilySnapshot {
  family: { id: string; name: string };
  me: Person;
  members: Person[];
  invites: Invite[];
  kids: Kid[];
  activities: Activity[];
  milestones: Milestone[];
  entries: Entry[];
  settings: PublicSettings;
}

export interface MeResponse {
  user: Person;
  /** Invites from other families waiting for this parent. */
  pendingInvites: { id: string; familyName: string; invitedBy: string }[];
}

export interface VerifyOtpResponse {
  user: Person;
  isNewUser: boolean;
  /** Only returned to mobile clients (`x-client: mobile`); browsers use the httpOnly cookie. */
  token?: string;
}

export type LogResult =
  | { ok: true; entry: Entry; total: number; unlocked: Milestone[] }
  | { ok: false; check: Exclude<Check, { ok: true }> };

export interface ApiError {
  error: { code: string; message: string };
}

/** Header carrying the parent PIN on parent-only requests. */
export const PARENT_PIN_HEADER = "x-parent-pin";
