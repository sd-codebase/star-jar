import "server-only";
import { z } from "zod";

const id = z.string().min(1).max(64);
const text = (max: number) => z.string().trim().min(1).max(max);
const emoji = z.string().min(1).max(16);
const pin = z.string().regex(/^\d{4}$/, "PIN must be 4 digits");

export const sendOtpBody = z.object({ phone: z.string() });
export const verifyOtpBody = z.object({ phone: z.string(), otp: z.string().regex(/^\d{4,6}$/), name: z.string().trim().max(40).optional() });
export const meBody = z.object({ name: text(40) });

export const activity = z.object({
  id,
  name: text(60),
  emoji,
  points: z.number().int().min(-100).max(100),
  kind: z.enum(["good", "bad"]),
  parentOnly: z.boolean().optional(),
});

export const milestone = z.object({
  id,
  points: z.number().int().min(1).max(100_000),
  title: text(60),
  badge: emoji,
  gift: z.string().trim().max(100),
});

const editableSettings = z.object({
  sound: z.boolean(),
  voice: z.boolean(),
  maxPerDay: z.number().int().min(1).max(50),
  sameGapMin: z.number().int().min(0).max(24 * 60),
  anyGapMin: z.number().int().min(0).max(24 * 60),
});

export const familyPatch = z.object({
  name: text(60).optional(),
  settings: editableSettings.partial().optional(),
  activities: z.array(activity).max(200).optional(),
  milestones: z.array(milestone).max(100).optional(),
});

export const pinBody = z.object({ pin });

export const kidBody = z.object({
  name: text(40),
  avatar: emoji,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const entryBody = z.object({ kidId: id, activityId: id, byParent: z.boolean().optional() });
export const bonusBody = z.object({ kidId: id, points: z.number().int().min(1).max(1000) });
export const giftBody = z.object({ given: z.boolean() });
export const resetBody = z.object({ scope: z.enum(["stars", "everything"]) });
export const inviteBody = z.object({ phone: z.string() });

/** A Star Jar backup as produced by the old webapp's Export button. */
export const backup = z.object({
  kids: z
    .array(
      z.object({
        id,
        name: text(40),
        avatar: emoji,
        color: z.string(),
        birthdate: z.string(),
        unlocked: z.record(z.number()).optional(),
        giftsGiven: z.record(z.number()).optional(),
        createdAt: z.number().optional(),
      }),
    )
    .max(50),
  activities: z.array(activity).max(200),
  milestones: z.array(milestone).max(100).optional(),
  entries: z
    .array(
      z.object({
        id,
        kidId: id,
        activityId: z.string(),
        name: z.string().max(60),
        emoji: z.string().max(16),
        points: z.number().int(),
        kind: z.enum(["good", "bad"]),
        at: z.number(),
        byParent: z.boolean().optional(),
      }),
    )
    .max(100_000),
  settings: editableSettings.partial().extend({ parentPin: pin.nullable().optional() }).optional(),
  defaultsRev: z.number().optional(),
});
