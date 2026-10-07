import { NextResponse, type NextRequest } from "next/server";
import { revokeWithBackend } from "@/server/backend";
import { rejectCrossSite } from "@/server/guard";
import { getSession } from "@/server/session";

export async function POST(request: NextRequest) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;

  const session = await getSession();
  // Revoke on the server first: deleting the cookie alone would leave the refresh token alive.
  if (session.refreshToken) await revokeWithBackend(session.refreshToken);
  session.destroy();

  return new NextResponse(null, { status: 204 });
}
