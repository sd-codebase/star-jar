import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { PARENT_PIN_HEADER, type ApiError } from "@shared/api-types";

export const API_URL: string = (Constants.expoConfig?.extra?.apiUrl as string) ?? "https://star-jar-lovat.vercel.app";

const TOKEN_KEY = "starjar.session";
let token: string | null | undefined;

export async function getToken() {
  if (token === undefined) token = await SecureStore.getItemAsync(TOKEN_KEY).catch(() => null);
  return token;
}

export async function setToken(t: string | null) {
  token = t;
  if (t) await SecureStore.setItemAsync(TOKEN_KEY, t);
  else await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
}

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

/** JSON call to the Next.js API. Each authenticated call also keeps the 30-day session alive. */
export async function api<T>(path: string, opts: { method?: string; body?: unknown; pin?: string | null } = {}): Promise<T> {
  const headers: Record<string, string> = { "x-client": "mobile", Accept: "application/json" };
  const t = await getToken();
  if (t) headers.Authorization = `Bearer ${t}`;
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.pin) headers[PARENT_PIN_HEADER] = opts.pin;

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method: opts.method ?? (opts.body === undefined ? "GET" : "POST"),
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    });
  } catch {
    throw new RequestError(0, "offline", "Can't reach Star Jar. Check your internet connection.");
  }

  const json = (await res.json().catch(() => null)) as (T & Partial<ApiError>) | null;
  if (!res.ok) {
    if (res.status === 401) {
      await setToken(null);
      onUnauthenticated();
    }
    throw new RequestError(res.status, json?.error?.code ?? "error", json?.error?.message ?? "Something went wrong.");
  }
  return json as T;
}
