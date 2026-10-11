import "server-only";
import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";
import { serverConfig } from "./config";

/**
 * Server-side session. The browser only ever holds an encrypted, httpOnly cookie;
 * the backend tokens never reach JavaScript.
 */
export interface SessionData {
  accessToken?: string;
  accessTokenExpiresAtUtc?: string;
  refreshToken?: string;
  user?: SessionUser;
}

export interface SessionUser {
  userId: string;
  username: string;
  role: string;
  integratorId: number | null;
  /**
   * Whose portal this is. "provider": a user of a Provider that works outside Raphael, who only
   * sees and exports the trips the clinics give it. Missing on sessions opened before 2026-10-11.
   */
  kind?: "clinic" | "provider" | "office";
  /** The password was set by somebody else (a clinic): nothing else is reachable until it changes. */
  mustChangePassword?: boolean;
}

/** The portal a session user gets. Sessions older than the field are read from the integrator. */
export const portalKind = (user: SessionUser) => user.kind ?? (user.integratorId != null ? "clinic" : "office");

// "__Host-" pins the cookie to this exact host, over HTTPS, with Path=/.
// Browsers treat http://localhost as a secure context, so it also works in local development.
const COOKIE_NAME = "__Host-rb_session";

function sessionOptions(): SessionOptions {
  return {
    cookieName: COOKIE_NAME,
    password: serverConfig.sessionSecret,
    // Never outlives the backend's refresh ceiling (RefreshAbsoluteHours); the backend decides the real end.
    ttl: 60 * 60 * 24,
    cookieOptions: {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
    },
  };
}

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions());
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
