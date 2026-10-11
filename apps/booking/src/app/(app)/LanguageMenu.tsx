"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { PhCaretDown, PhGlobe } from "@/components/ui/Icon";
import { Menu } from "@/components/ui/Menu";
import { LOCALES } from "@/i18n/locale";
import { bff } from "@/lib/bff";

/** Changes the signed-in user's language, remembered in this browser for that user only. */
export function useChangeLanguage() {
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function change(next: string) {
    if (next === locale) return;
    setBusy(true);
    try {
      await bff("/api/preferences/language", { method: "POST", body: JSON.stringify({ locale: next }) });
      // Google Maps fixes its language when its script loads, so once it is in this tab only a full
      // reload changes it. Until then a refresh is enough: the server sends the texts in the new
      // language and the page keeps what it holds (the trips loaded, the filters, the selection).
      if ((window as { google?: { maps?: unknown } }).google?.maps) window.location.reload();
      else {
        router.refresh();
        setBusy(false);
      }
    } catch {
      setBusy(false);
    }
  }

  return { locale, busy, change };
}

/** The language menu of the top bar. */
export function LanguageMenu({ onBrand = false }: { onBrand?: boolean }) {
  const t = useTranslations("language");
  const { locale, busy, change } = useChangeLanguage();

  return (
    <Menu look="ds" width={190} label={t("label")}
      buttonClassName={`flex h-11 items-center gap-[7px] rounded-[9px] px-3 text-[13.5px] font-semibold disabled:opacity-50 ${onBrand
        ? "bg-[var(--ds-brand-tile)] text-[var(--ds-on-brand)] shadow-[inset_0_0_0_1px_var(--ds-brand-tile-ring)]"
        : "border border-[var(--ds-outline-variant)] text-[var(--ds-on-surface)] hover:bg-[var(--ds-selected)]"}`}
      trigger={<>
        <PhGlobe size={17} aria-hidden className={`${onBrand ? "" : "text-[var(--ds-on-surface-variant)]"} ${busy ? "animate-pulse" : ""}`} />
        <span className="uppercase">{locale}</span>
        <PhCaretDown size={12} aria-hidden className={onBrand ? "" : "text-[var(--ds-on-surface-variant)]"} />
      </>}
      header={<p className="font-[family-name:var(--font-plex-mono)] text-[10.5px] uppercase tracking-[0.12em] text-[var(--ds-on-surface-variant)]">{t("label")}</p>}
      items={LOCALES.map((l) => ({ key: l, label: t(l), selected: l === locale, onSelect: () => void change(l) }))} />
  );
}
