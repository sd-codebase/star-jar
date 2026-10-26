"use client";

import { PARENT_PIN_HEADER, type ApiError } from "../api-types";

export class RequestError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

let onUnauthenticated: () => void = () => {};
export const setUnauthenticatedHandler = (fn: () => void) => void (onUnauthenticated = fn);

/** Same-origin JSON call; the httpOnly session cookie rides along automatically. */
export async function api<T>(path: string, opts: { method?: string; body?: unknown; pin?: string | null } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.pin) headers[PARENT_PIN_HEADER] = opts.pin;

  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: opts.method ?? (opts.body === undefined ? "GET" : "POST"),
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    throw new RequestError(0, "offline", "Can't reach Star Jar. Check your internet connection.");
  }

  const json = (await res.json().catch(() => null)) as (T & Partial<ApiError>) | null;
  if (!res.ok) {
    if (res.status === 401) onUnauthenticated();
    throw new RequestError(res.status, json?.error?.code ?? "error", json?.error?.message ?? "Something went wrong.");
  }
  return json as T;
}
