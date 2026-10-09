/** The portal's languages. English when nothing else says otherwise. */
export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function resolveLocale(value: string | undefined | null): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/**
 * One cookie per user, so two people sharing a computer each keep their own language.
 * It lives in this browser only: on another computer the user starts in English again.
 */
export function languageCookieName(userId: string) {
  return `rb_lang_${userId.replace(/[^A-Za-z0-9_-]/g, "")}`;
}

/**
 * The language chosen on the login page, before anyone is signed in. One per browser. At sign-in it
 * becomes the user's own if they have none yet (src/app/api/auth/login/route.ts).
 */
export const ANONYMOUS_LANGUAGE_COOKIE = "rb_lang";

/**
 * The first portal language in an Accept-Language header, by the browser's order of preference:
 * "es-US,es;q=0.9,en;q=0.8" → "es". Null when none of them is ours.
 */
export function fromAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;
  const ranked = header
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return { base: tag.trim().toLowerCase().split("-")[0], q: q ? Number(q.slice(2)) : 1, index };
    })
    .filter((r) => r.base && !Number.isNaN(r.q) && r.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  return ranked.map((r) => r.base).find(isLocale) ?? null;
}
