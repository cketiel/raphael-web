import { NextResponse, type NextRequest } from "next/server";
import { getValidAccessToken, SessionExpiredError } from "@/server/backend";
import { serverConfig } from "@/server/config";
import { rejectCrossSite, sessionExpired } from "@/server/guard";
import { getSession } from "@/server/session";

/**
 * SignalR is the one connection that cannot go through the BFF: route handlers do not proxy
 * WebSockets. The page asks here for the current access token, keeps it in memory only and
 * hands it to the hub connection. It is never written to storage.
 *
 * ⚠️ Its lifetime is the backend's session policy for X-Client-App "BookingWeb". Until that policy
 * exists the backend falls back to Default (600 minutes). It must be short (≈15 min) before
 * production: see the BookingWeb entry pending in SessionPolicy.
 */
export async function GET(request: NextRequest) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;

  const session = await getSession();
  try {
    const accessToken = await getValidAccessToken(session);
    return NextResponse.json(
      {
        accessToken,
        expiresAtUtc: session.accessTokenExpiresAtUtc,
        hubBaseUrl: serverConfig.environment.apiBaseUrl,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof SessionExpiredError) return sessionExpired();
    throw error;
  }
}
