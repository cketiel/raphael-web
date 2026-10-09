import "server-only";
import { NextResponse, type NextRequest } from "next/server";

/** Header every BFF call from our own pages carries. A cross-site form cannot set it. */
export const BFF_HEADER = "x-raphael-bff";

/**
 * Second line of defence against CSRF, after SameSite=Strict on the session cookie:
 * the request must come from this same origin and carry our custom header.
 */
export function rejectCrossSite(request: NextRequest): NextResponse | null {
  if (request.headers.get(BFF_HEADER) !== "1") {
    return NextResponse.json({ code: "forbidden", message: "Forbidden." }, { status: 403 });
  }
  const origin = request.headers.get("origin");
  if (origin !== null && hostOf(origin) !== calledHost(request)) {
    return NextResponse.json({ code: "forbidden", message: "Forbidden." }, { status: 403 });
  }
  return null;
}

/**
 * The host the browser called. Not `request.nextUrl`: behind App Service, TLS ends at the front
 * end and the server sees its own address (http://0.0.0.0:8080), which no page's Origin ever
 * matches — every sign-in answered 403 on the first deploy. Same rule as Next's own Server
 * Actions check: the forwarded host, else Host. A browser sets neither for another site.
 */
function calledHost(request: NextRequest) {
  return (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host)
    .split(",")[0].trim().toLowerCase();
}

function hostOf(origin: string) {
  try {
    return new URL(origin).host.toLowerCase();
  } catch {
    return null; // "null" and anything unparsable: never ours.
  }
}

export function sessionExpired() {
  return NextResponse.json({ code: "session_expired", message: "Your session has expired. Please sign in again." }, { status: 401 });
}
