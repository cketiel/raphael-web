import { NextResponse, type NextRequest } from "next/server";
import { isLocale, languageCookieName } from "@/i18n/locale";
import { rejectCrossSite, sessionExpired } from "@/server/guard";
import { getSession } from "@/server/session";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Remembers the signed-in user's language in this browser. */
export async function POST(request: NextRequest) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;

  const session = await getSession();
  if (!session.user) return sessionExpired();

  const body = (await request.json().catch(() => null)) as { locale?: unknown } | null;
  if (!isLocale(body?.locale)) {
    return NextResponse.json({ code: "invalid_language", message: "Unsupported language." }, { status: 400 });
  }

  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(languageCookieName(session.user.userId), body.locale, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });
  return response;
}
