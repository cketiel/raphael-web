import { NextResponse, type NextRequest } from "next/server";
import { passwordProblem } from "@/features/account/passwordRules";
import { backendFetch, SessionExpiredError } from "@/server/backend";
import { rejectCrossSite, sessionExpired } from "@/server/guard";
import { getSession } from "@/server/session";

/**
 * Changes the signed-in user's own password. The user id comes from the session, never from the
 * page, and the backend refuses a clinic user changing anyone else's.
 */
export async function POST(request: NextRequest) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;

  const session = await getSession();
  if (!session.user) return sessionExpired();

  const body = (await request.json().catch(() => null)) as
    | { currentPassword?: unknown; newPassword?: unknown; confirmPassword?: unknown }
    | null;
  const current = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const next = typeof body?.newPassword === "string" ? body.newPassword : "";
  const confirm = typeof body?.confirmPassword === "string" ? body.confirmPassword : "";

  const problem = passwordProblem(current, next, confirm);
  if (problem) return NextResponse.json({ code: problem, message: "The new password is not valid." }, { status: 400 });

  let upstream: Response;
  try {
    upstream = await backendFetch(session, "/api/Users/change-password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: Number(session.user.userId),
        currentPassword: current,
        newPassword: next,
        confirmPassword: confirm,
      }),
    });
  } catch (error) {
    if (error instanceof SessionExpiredError) return sessionExpired();
    return NextResponse.json({ code: "service_unavailable", message: "The service is not available right now." }, { status: 502 });
  }

  if (upstream.ok) return new NextResponse(null, { status: 204 });

  // The backend answers 400 with its own English text; the only one a user can act on is a wrong
  // current password, so that one gets its code and the rest a generic one.
  const text = await upstream.text();
  if (upstream.status === 400 && /current password is incorrect/i.test(text)) {
    return NextResponse.json({ code: "wrong_current_password", message: "Current password is incorrect." }, { status: 400 });
  }
  return NextResponse.json({ code: "password_change_failed", message: "The password could not be changed." }, { status: upstream.status >= 500 ? 502 : 400 });
}
