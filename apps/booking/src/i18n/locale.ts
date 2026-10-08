/** The portal's languages. English is the default for everyone until they choose otherwise. */
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
