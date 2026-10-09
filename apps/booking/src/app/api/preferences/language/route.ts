import { NextResponse, type NextRequest } from "next/server";
import { ANONYMOUS_LANGUAGE_COOKIE, isLocale, languageCookieName } from "@/i18n/locale";
import { rejectCrossSite } from "@/server/guard";
import { getSession } from "@/server/session";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Remembers a language in this browser: the signed-in user's own, or, on the login page, the
 * browser's until someone signs in (src/i18n/request.ts).
 */
export async function POST(request: NextRequest) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;

  const body = (await request.json().catch(() => null)) as { locale?: unknown } | null;
  if (!isLocale(body?.locale)) {
    return NextResponse.json({ code: "invalid_language", message: "Unsupported language." }, { status: 400 });
  }

  const session = await getSession();
  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(session.user ? languageCookieName(session.user.userId) : ANONYMOUS_LANGUAGE_COOKIE, body.locale, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });
  return response;
}
