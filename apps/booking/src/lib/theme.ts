/**
 * Light or dark, remembered in this browser. Without a choice the system decides
 * (prefers-color-scheme in globals.css), so a cookie only exists once someone picked one.
 * Not a secret and not httpOnly: the toggle writes it and the server reads it to set <html data-theme>.
 */
export const THEME_COOKIE = "rb_theme";
export type Theme = "light" | "dark";

export function resolveTheme(value: string | undefined | null): Theme | null {
  return value === "light" || value === "dark" ? value : null;
}

/** The theme on screen now: the chosen one, else the system's. Browser only. */
export function currentTheme(): Theme {
  const chosen = resolveTheme(document.documentElement.dataset.theme);
  if (chosen) return chosen;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const CHANGED = "rb-theme-change";

/** Applies a theme at once and remembers it for a year. Browser only. */
export function chooseTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.cookie = `${THEME_COOKIE}=${theme}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Strict${location.protocol === "https:" ? "; Secure" : ""}`;
  window.dispatchEvent(new Event(CHANGED));
}

/** For useSyncExternalStore: the theme changes when the person picks one or the system switches. */
export function subscribeTheme(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  window.addEventListener(CHANGED, onChange);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener(CHANGED, onChange);
  };
}
