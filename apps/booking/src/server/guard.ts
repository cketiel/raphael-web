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
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }
  const origin = request.headers.get("origin");
  if (origin !== null && origin !== request.nextUrl.origin) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }
  return null;
}

export function sessionExpired() {
  return NextResponse.json({ message: "Your session has expired. Please sign in again." }, { status: 401 });
}
