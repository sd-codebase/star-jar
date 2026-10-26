import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";
import { authenticate, setSessionCookie, type Auth } from "./session";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "error",
  ) {
    super(message);
  }
}

export function errorResponse(e: unknown) {
  if (e instanceof HttpError) return NextResponse.json({ error: { code: e.code, message: e.message } }, { status: e.status });
  if (e instanceof ZodError) {
    const msg = e.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ");
    return NextResponse.json({ error: { code: "invalid", message: msg } }, { status: 400 });
  }
  console.error(e);
  return NextResponse.json({ error: { code: "server", message: "Something went wrong. Please try again." } }, { status: 500 });
}

export async function body<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "Request body must be JSON.", "invalid");
  }
  return schema.parse(raw);
}

type Ctx<P> = { params: Promise<P> };
type Result = Response | object | void;

/** Unauthenticated route with uniform error handling. */
export function publicRoute<P = object>(fn: (req: NextRequest, params: P) => Promise<Result>) {
  return async (req: NextRequest, ctx: Ctx<P>) => {
    try {
      return toResponse(await fn(req, await ctx.params));
    } catch (e) {
      return errorResponse(e);
    }
  };
}

/** Requires a live session; slides its 30-day expiry and re-issues the web cookie when it moves. */
export function authedRoute<P = object>(fn: (req: NextRequest, auth: Auth, params: P) => Promise<Result>) {
  return async (req: NextRequest, ctx: Ctx<P>) => {
    try {
      const auth = await authenticate(req);
      const res = toResponse(await fn(req, auth, await ctx.params));
      if (auth.renewCookie) setSessionCookie(res, auth.token, auth.session.expiresAt);
      return res;
    } catch (e) {
      return errorResponse(e);
    }
  };
}

function toResponse(r: Result) {
  if (r instanceof Response) return r instanceof NextResponse ? r : new NextResponse(r.body, r);
  return NextResponse.json(r ?? { ok: true });
}
