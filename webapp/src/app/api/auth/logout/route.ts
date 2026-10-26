import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/server/http";
import { authenticate, clearSessionCookie, destroySession } from "@/lib/server/session";

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res);
  try {
    await destroySession(await authenticate(req));
  } catch (e) {
    // Already logged out is still a successful logout.
    if ((e as { status?: number }).status !== 401) return errorResponse(e);
  }
  return res;
}
