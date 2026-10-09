import { NextResponse, type NextRequest } from "next/server";
import { selectEnvironment } from "@/server/environments";

const SESSION_COOKIE = "__Host-rb_session";
const PUBLIC_PATHS = new Set(["/login"]);

function contentSecurityPolicy(nonce: string, isDev: boolean) {
  const api = new URL(selectEnvironment().apiBaseUrl).host;
  // Google Maps JavaScript runs in the page and needs its own hosts (Google's documented CSP for Maps).
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https:${isDev ? " 'unsafe-eval'" : ""}`,
    // Maps and React inject inline styles. Inline styles cannot run code; scripts stay nonce-only.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com https://*.google.com https://*.googleusercontent.com",
    "font-src 'self' https://fonts.gstatic.com",
    `connect-src 'self' https://*.googleapis.com https://*.google.com https://*.gstatic.com data: blob: wss://${api}`,
    "frame-src https://*.google.com",
    "worker-src blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const signedIn = request.cookies.has(SESSION_COOKIE);

  // A cheap presence check only: the cookie's contents are verified on the server for every API call.
  if (!signedIn && !PUBLIC_PATHS.has(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = contentSecurityPolicy(nonce, process.env.NODE_ENV === "development");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // brand/ is the public mark (logos). Without the exclusion a signed-out visitor was sent
      // to /login for it, so the login page itself showed a broken logo.
      source: "/((?!api|_next/static|_next/image|favicon.ico|brand/).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
