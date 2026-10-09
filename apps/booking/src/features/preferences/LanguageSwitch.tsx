"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { PhCaretDown, PhGlobe } from "@/components/ui/Icon";
import { Menu } from "@/components/ui/Menu";
import { LOCALES } from "@/i18n/locale";
import { bff } from "@/lib/bff";

/**
 * The language menu in the final design's look. Remembers the choice in this browser: the user's own
 * when signed in, the login page's otherwise (api/preferences/language).
 * `onBrand` is the variant for a dark brand header (the login on a phone).
 */
export function LanguageSwitch({ onBrand = false }: { onBrand?: boolean }) {
  const t = useTranslations("language");
  const locale = useLocale();
  const [busy, setBusy] = useState(false);

  async function change(next: string) {
    if (next === locale) return;
    setBusy(true);
    try {
      await bff("/api/preferences/language", { method: "POST", body: JSON.stringify({ locale: next }) });
      // A full reload, not a refresh: Google Maps fixes its language when its script loads.
      window.location.reload();
    } catch {
      setBusy(false);
    }
  }

  return (
    <Menu look="ds" label={t("label")}
      buttonClassName={`flex h-11 items-center gap-[7px] rounded-[9px] px-3 text-[13.5px] font-semibold disabled:opacity-50 aria-expanded:border-[var(--ds-primary)] ${onBrand
        ? "bg-[var(--ds-brand-tile)] text-[var(--ds-on-brand)] shadow-[inset_0_0_0_1px_var(--ds-brand-tile-ring)]"
        : "border border-[var(--ds-outline-variant)] bg-[var(--ds-surface)] text-[var(--ds-on-surface)]"}`}
      trigger={<>
        <PhGlobe size={17} aria-hidden className={`${onBrand ? "text-[var(--ds-on-brand-variant)]" : "text-[var(--ds-on-surface-variant)]"} ${busy ? "animate-pulse" : ""}`} />
        <span className="uppercase">{locale}</span>
        <PhCaretDown size={12} aria-hidden className={onBrand ? "text-[var(--ds-on-brand-variant)]" : "text-[var(--ds-on-surface-variant)]"} />
      </>}
      header={<p className="font-[family-name:var(--font-plex-mono)] text-[10.5px] uppercase tracking-[.12em] text-[var(--ds-on-surface-variant)]">{t("label")}</p>}
      items={LOCALES.map((l) => ({
        key: l,
        label: <span className="flex items-center gap-2.5">{t(l)}<span className="font-[family-name:var(--font-plex-mono)] text-[11.5px] font-normal uppercase text-[var(--ds-on-surface-variant)]">{l}</span></span>,
        selected: l === locale,
        onSelect: () => void change(l),
      }))} />
  );
}
