import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ANONYMOUS_LANGUAGE_COOKIE, fromAcceptLanguage, languageCookieName, resolveLocale } from "@/i18n/locale";
import { loginWithBackend } from "@/server/backend";
import { rejectCrossSite } from "@/server/guard";
import { getSession } from "@/server/session";

const credentials = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(200),
});

// Roles BookingPortalController accepts ([Authorize(Roles = "6,1,3")]). Anyone else could sign
// in to the backend but would get nothing but 403s here, so they are turned away at the door.
const BOOKING_ROLES = new Set(["1", "3", "6"]);

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function POST(request: NextRequest) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;

  const parsed = credentials.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ code: "missing_credentials", message: "Enter your username and password." }, { status: 400 });
  }

  const { status, body, code } = await loginWithBackend(parsed.data.username, parsed.data.password);

  if (status === 403 && code === "integrator_disabled") {
    return NextResponse.json({ code: "integrator_disabled", message: "Your organization's access is disabled. Contact the office." }, { status: 403 });
  }
  if (status === 403) {
    return NextResponse.json({ code: "account_disabled", message: "User account is disabled. Contact administrator." }, { status: 403 });
  }
  if (status !== 200 || !body?.token || !body.refreshToken) {
    return NextResponse.json({ code: "invalid_credentials", message: "Invalid username or password." }, { status: 401 });
  }
  if (!BOOKING_ROLES.has(body.role ?? "")) {
    return NextResponse.json({ code: "no_portal_access", message: "This account does not have access to the Booking Portal." }, { status: 403 });
  }

  const session = await getSession();
  session.accessToken = body.token;
  session.accessTokenExpiresAtUtc = body.accessTokenExpiresAtUtc;
  session.refreshToken = body.refreshToken;
  session.user = {
    userId: body.userId ?? "",
    username: body.username ?? parsed.data.username,
    role: body.role ?? "",
    integratorId: body.integratorId ?? null,
  };
  await session.save();

  const response = NextResponse.json({ user: session.user });

  // The portal opens in the language the person signed in with, unless they already chose one.
  const ownCookie = languageCookieName(session.user.userId);
  if (!request.cookies.has(ownCookie)) {
    const signedInWith = resolveLocale(
      request.cookies.get(ANONYMOUS_LANGUAGE_COOKIE)?.value ?? fromAcceptLanguage(request.headers.get("accept-language")),
    );
    response.cookies.set(ownCookie, signedInWith, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: ONE_YEAR_SECONDS,
    });
  }

  return response;
}
