import "server-only";
import { MongoClient, type Db } from "mongodb";
import type { Activity, Entry, Kid, Milestone, Settings } from "../types";
import { env } from "./env";

export interface UserDoc {
  _id: string;
  phone: string; // 10-digit Indian mobile, no country code
  name: string;
  familyId: string | null;
  createdAt: Date;
}

/** One pending login code per phone. Purged by TTL an hour after the last send. */
export interface OtpDoc {
  _id: string; // phone
  hash: string;
  expiresAt: Date;
  attempts: number;
  sends: Date[];
  purgeAt: Date;
}

export interface SessionDoc {
  _id: string; // sha256 of the token — the raw token is never stored
  userId: string;
  createdAt: Date;
  lastSeenAt: Date;
  expiresAt: Date;
  client: "web" | "mobile";
  userAgent: string;
}

export interface FamilyDoc {
  _id: string;
  name: string;
  activities: Activity[];
  milestones: Milestone[];
  settings: Settings;
  defaultsRev: number;
  createdBy: string;
  createdAt: Date;
}

export interface InviteDoc {
  _id: string;
  familyId: string;
  phone: string;
  invitedBy: string;
  createdAt: Date;
  expiresAt: Date;
}

/** `id` is unique per family, so the same backup can be imported into two families. */
export type KidDoc = Kid & { _id?: unknown; familyId: string; lastTapAt?: number | null };
export type EntryDoc = Entry & { _id?: unknown; familyId: string; byUserId: string | null };

const g = globalThis as unknown as { _mongo?: Promise<MongoClient>; _indexes?: Promise<unknown> };

async function database(): Promise<Db> {
  g._mongo ??= new MongoClient(env.mongoUri, { appName: "star-jar" }).connect();
  const client = await g._mongo.catch((e) => {
    g._mongo = undefined;
    throw e;
  });
  return client.db(env.mongoDb);
}

export async function cols() {
  const db = await database();
  const c = {
    users: db.collection<UserDoc>("users"),
    otps: db.collection<OtpDoc>("otps"),
    sessions: db.collection<SessionDoc>("sessions"),
    families: db.collection<FamilyDoc>("families"),
    invites: db.collection<InviteDoc>("invites"),
    kids: db.collection<KidDoc>("kids"),
    entries: db.collection<EntryDoc>("entries"),
  };
  g._indexes ??= Promise.all([
    c.users.createIndex({ phone: 1 }, { unique: true }),
    c.users.createIndex({ familyId: 1 }),
    c.otps.createIndex({ purgeAt: 1 }, { expireAfterSeconds: 0 }),
    c.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    c.sessions.createIndex({ userId: 1 }),
    c.invites.createIndex({ phone: 1 }),
    c.invites.createIndex({ familyId: 1 }),
    c.invites.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    c.kids.createIndex({ familyId: 1, id: 1 }, { unique: true }),
    c.entries.createIndex({ familyId: 1, id: 1 }, { unique: true }),
    c.entries.createIndex({ familyId: 1, kidId: 1, at: 1 }),
  ]).catch((e) => {
    g._indexes = undefined;
    throw e;
  });
  await g._indexes;
  return c;
}

export type Cols = Awaited<ReturnType<typeof cols>>;
