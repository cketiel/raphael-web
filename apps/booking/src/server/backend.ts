import "server-only";
import type { Schemas } from "@raphael/api-client";
import { serverConfig } from "./config";
import { getSession, type SessionData } from "./session";

type IronSession = Awaited<ReturnType<typeof getSession>>;

/** Renew this long before the access token expires, so a request never leaves with a dying token. */
const RENEW_MARGIN_MS = 60_000;

export class SessionExpiredError extends Error {
  constructor() {
    super("Session expired.");
  }
}

function apiUrl(path: string) {
  return new URL(path, serverConfig.environment.apiBaseUrl).toString();
}

function clientHeaders(): Record<string, string> {
  return {
    "X-Client-App": serverConfig.clientApp,
    "X-Client-Version": serverConfig.clientVersion,
  };
}

export async function loginWithBackend(username: string, password: string) {
  const response = await fetch(apiUrl("/api/Auth/login"), {
    method: "POST",
    headers: { ...clientHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ username, password } satisfies Schemas["LoginRequest"]),
    cache: "no-store",
  });
  const body = response.ok ? ((await response.json()) as Schemas["LoginResponseDto"]) : null;
  return { status: response.status, body };
}

export async function revokeWithBackend(refreshToken: string) {
  await fetch(apiUrl("/api/Auth/logout"), {
    method: "POST",
    headers: { ...clientHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken } satisfies Schemas["RefreshTokenRequestDto"]),
    cache: "no-store",
  }).catch(() => undefined);
}

// Two requests from the same tab can find the token expired at the same moment. The backend
// rotates refresh tokens and answers 409 to the second one, so both must share one renewal.
const renewals = new Map<string, Promise<Schemas["AuthTokenPairDto"] | null>>();

async function renew(refreshToken: string) {
  let pending = renewals.get(refreshToken);
  if (!pending) {
    pending = fetch(apiUrl("/api/Auth/refresh"), {
      method: "POST",
      headers: { ...clientHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken } satisfies Schemas["RefreshTokenRequestDto"]),
      cache: "no-store",
    })
      .then(async (r) => (r.ok ? ((await r.json()) as Schemas["AuthTokenPairDto"]) : null))
      .finally(() => setTimeout(() => renewals.delete(refreshToken), 10_000));
    renewals.set(refreshToken, pending);
  }
  return pending;
}

function needsRenewal(session: SessionData) {
  if (!session.accessTokenExpiresAtUtc) return true;
  return Date.parse(session.accessTokenExpiresAtUtc) - Date.now() < RENEW_MARGIN_MS;
}

/**
 * Returns a valid access token for the signed-in user, renewing it when it is about to expire.
 * Only callable where cookies can be written (route handlers, server actions).
 */
export async function getValidAccessToken(session: IronSession): Promise<string> {
  if (!session.accessToken || !session.refreshToken) throw new SessionExpiredError();
  if (!needsRenewal(session)) return session.accessToken;

  const pair = await renew(session.refreshToken);
  if (!pair?.token || !pair.refreshToken) {
    session.destroy();
    throw new SessionExpiredError();
  }
  session.accessToken = pair.token;
  session.accessTokenExpiresAtUtc = pair.accessTokenExpiresAtUtc;
  session.refreshToken = pair.refreshToken;
  await session.save();
  return pair.token;
}

/** Calls Raphael.Api on behalf of the signed-in user. */
export async function backendFetch(session: IronSession, path: string, init: RequestInit = {}) {
  const token = await getValidAccessToken(session);
  const headers = new Headers(init.headers);
  for (const [k, v] of Object.entries(clientHeaders())) headers.set(k, v);
  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(apiUrl(path), { ...init, headers, cache: "no-store" });
  if (response.status === 401) {
    session.destroy();
    throw new SessionExpiredError();
  }
  return response;
}
