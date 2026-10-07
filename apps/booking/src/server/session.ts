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
}

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
