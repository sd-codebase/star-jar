import "server-only";
import { createHash, randomBytes } from "crypto";
import type { NextRequest, NextResponse } from "next/server";
import { cols, type SessionDoc, type UserDoc } from "./db";
import { env } from "./env";
import { HttpError } from "./http";

export const SESSION_COOKIE = "sj_session";
/** A session dies after this much inactivity; any authenticated request pushes it forward. */
const IDLE_MS = 30 * 24 * 60 * 60_000;
/** Don't write to the DB on every request — only when the last bump is this old. */
const BUMP_EVERY_MS = 10 * 60_000;

const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

export interface Auth {
  user: UserDoc;
  session: SessionDoc;
  token: string;
  renewCookie: boolean;
}

export async function createSession(userId: string, req: NextRequest) {
  const { sessions } = await cols();
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const doc: SessionDoc = {
    _id: hashToken(token),
    userId,
    createdAt: now,
    lastSeenAt: now,
    expiresAt: new Date(now.getTime() + IDLE_MS),
    client: isMobile(req) ? "mobile" : "web",
    userAgent: (req.headers.get("user-agent") ?? "").slice(0, 300),
  };
  await sessions.insertOne(doc);
  return { token, session: doc };
}

/** Mobile clients identify themselves and receive the token in the body; browsers only ever get the httpOnly cookie. */
export const isMobile = (req: NextRequest) => req.headers.get("x-client") === "mobile";

function readToken(req: NextRequest): { token: string; viaCookie: boolean } | null {
  const h = req.headers.get("authorization");
  if (h?.startsWith("Bearer ")) return { token: h.slice(7).trim(), viaCookie: false };
  const c = req.cookies.get(SESSION_COOKIE)?.value;
  return c ? { token: c, viaCookie: true } : null;
}

export async function authenticate(req: NextRequest): Promise<Auth> {
  const t = readToken(req);
  if (!t) throw new HttpError(401, "Please log in.", "unauthenticated");
  const { sessions, users } = await cols();
  const id = hashToken(t.token);
  const now = Date.now();
  const session = await sessions.findOne({ _id: id, expiresAt: { $gt: new Date(now) } });
  if (!session) throw new HttpError(401, "Your session has ended. Please log in again.", "unauthenticated");
  const user = await users.findOne({ _id: session.userId });
  if (!user) throw new HttpError(401, "Please log in.", "unauthenticated");

  let renewCookie = false;
  if (now - session.lastSeenAt.getTime() > BUMP_EVERY_MS) {
    session.lastSeenAt = new Date(now);
    session.expiresAt = new Date(now + IDLE_MS);
    await sessions.updateOne({ _id: id }, { $set: { lastSeenAt: session.lastSeenAt, expiresAt: session.expiresAt } });
    renewCookie = t.viaCookie;
  }
  return { user, session, token: t.token, renewCookie };
}

export async function destroySession(auth: Auth) {
  const { sessions } = await cols();
  await sessions.deleteOne({ _id: auth.session._id });
}

export function setSessionCookie(res: NextResponse, token: string, expires: Date) {
  res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, secure: env.isProd, sameSite: "lax", path: "/", expires });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: env.isProd, sameSite: "lax", path: "/", maxAge: 0 });
}
