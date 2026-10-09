import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { getSession } from "@/server/session";
import { ANONYMOUS_LANGUAGE_COOKIE, fromAcceptLanguage, languageCookieName, resolveLocale } from "./locale";

/**
 * The language of each request.
 * - Signed in: the user's own choice (one cookie per user in this browser), or English.
 * - Not signed in (the login page): the language picked there, else the browser's, else English.
 *   At sign-in it becomes the user's own if they have none yet.
 */
export default getRequestConfig(async () => {
  const session = await getSession();
  const store = await cookies();

  const locale = session.user
    ? resolveLocale(store.get(languageCookieName(session.user.userId))?.value)
    : resolveLocale(store.get(ANONYMOUS_LANGUAGE_COOKIE)?.value ?? fromAcceptLanguage((await headers()).get("accept-language")));

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
