"use client";

import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { PhMoonStars, PhSun } from "@/components/ui/Icon";
import { chooseTheme, currentTheme, subscribeTheme, type Theme } from "@/lib/theme";

/**
 * Light / dark. Shows the theme it switches to: a moon in daylight, a sun at night.
 * `onBrand` is the variant for a dark brand header (the login on a phone).
 */
export function ThemeToggle({ onBrand = false }: { onBrand?: boolean }) {
  const t = useTranslations("theme");
  // Null on the server: the system's choice is only readable in the browser.
  const theme = useSyncExternalStore<Theme | null>(subscribeTheme, currentTheme, () => null);

  const next: Theme = theme === "dark" ? "light" : "dark";
  const label = next === "dark" ? t("dark") : t("light");

  return (
    <button type="button" aria-label={label} title={label}
      onClick={() => chooseTheme(next)}
      className={`flex size-11 items-center justify-center rounded-[9px] ${onBrand
        ? "bg-[var(--ds-brand-tile)] text-[var(--ds-on-brand)] shadow-[inset_0_0_0_1px_var(--ds-brand-tile-ring)]"
        : "border border-[var(--ds-outline-variant)] bg-[var(--ds-surface)] text-[var(--ds-on-surface)]"}`}>
      {theme === "dark" ? <PhSun size={19} weight="fill" aria-hidden /> : <PhMoonStars size={19} weight="fill" aria-hidden />}
    </button>
  );
}
