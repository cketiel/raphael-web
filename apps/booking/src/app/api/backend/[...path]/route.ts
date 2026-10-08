import { NextResponse, type NextRequest } from "next/server";
import { backendFetch, SessionExpiredError } from "@/server/backend";
import { rejectCrossSite, sessionExpired } from "@/server/guard";
import { getSession } from "@/server/session";

/**
 * The only door from the browser to Raphael.Api. It adds the user's token on the server, so the
 * token never reaches JavaScript, and it only opens for the endpoints this portal actually uses:
 * a compromised page cannot reach the rest of the API through it.
 */
const ALLOWED: ReadonlyArray<{ method: string; pattern: RegExp; brokerOnly?: boolean }> = [
  { method: "GET", pattern: /^BookingPortal\/my-trips$/ },
  { method: "GET", pattern: /^BookingPortal\/my-funding-source$/ },
  { method: "GET", pattern: /^BookingPortal\/trips\/\d{1,10}\/tracking$/ },
  { method: "POST", pattern: /^BookingPortal\/sync-single$/ },
  { method: "POST", pattern: /^BookingPortal\/cancel-multiple$/ },
  { method: "GET", pattern: /^Customers$/ },
  { method: "GET", pattern: /^SpaceTypes$/ },
  // Brokers only: a clinic has exactly one funding source and reads it from my-funding-source.
  { method: "GET", pattern: /^FundingSources$/, brokerOnly: true },
  { method: "GET", pattern: /^Schedules\/reports\/production-range$/ },
  // Maps proxy (MAPS_POLICY §4.1): everything cacheable goes through the backend.
  { method: "POST", pattern: /^routing\/legs$/ },
  { method: "POST", pattern: /^routing\/reverse-geocode$/ },
  { method: "GET", pattern: /^routing\/place\/[A-Za-z0-9_-]{1,300}$/ },
  { method: "POST", pattern: /^routing\/place$/ },
  { method: "POST", pattern: /^routing\/usage$/ },
];

type Context = { params: Promise<{ path: string[] }> };

async function forward(request: NextRequest, context: Context) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;

  const { path } = await context.params;
  const target = path.join("/");
  const rule = ALLOWED.find((r) => r.method === request.method && r.pattern.test(target));
  if (!rule) {
    return NextResponse.json({ code: "not_found", message: "Not found." }, { status: 404 });
  }

  const session = await getSession();
  if (rule.brokerOnly && session.user?.integratorId != null) {
    return NextResponse.json({ code: "not_found", message: "Not found." }, { status: 404 });
  }
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  headers.set("Accept", "application/json");

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  let upstream: Response;
  try {
    upstream = await backendFetch(session, `/api/${target}${request.nextUrl.search}`, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      // Required by fetch to stream a request body (multipart uploads included).
      ...(hasBody ? { duplex: "half" } : {}),
    } as RequestInit);
  } catch (error) {
    if (error instanceof SessionExpiredError) return sessionExpired();
    return NextResponse.json({ code: "service_unavailable", message: "The service is not available right now. Try again in a moment." }, { status: 502 });
  }

  // Server errors reach the browser as a generic message, never with their original text.
  if (upstream.status >= 500) {
    return NextResponse.json({ code: "server_error", message: "Something went wrong on the server. Try again in a moment." }, { status: 502 });
  }

  const responseHeaders = new Headers();
  const upstreamType = upstream.headers.get("content-type");
  if (upstreamType) responseHeaders.set("Content-Type", upstreamType);
  responseHeaders.set("Cache-Control", "no-store");

  return new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders });
}

export const GET = forward;
export const POST = forward;
