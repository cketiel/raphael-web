import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { getSession } from "@/server/session";
import { languageCookieName, resolveLocale } from "./locale";

/**
 * The language of each request: the signed-in user's own choice, or English.
 * Nobody is signed in on the login page, so it is always English.
 */
export default getRequestConfig(async () => {
  const session = await getSession();
  const store = await cookies();
  const chosen = session.user ? store.get(languageCookieName(session.user.userId))?.value : undefined;
  const locale = resolveLocale(chosen);

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
