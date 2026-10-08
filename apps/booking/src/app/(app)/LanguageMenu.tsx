"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { IconLanguage } from "@/components/ui/Icon";
import { Menu } from "@/components/ui/Menu";
import { LOCALES } from "@/i18n/locale";
import { bff } from "@/lib/bff";

/** The signed-in user's language, remembered in this browser for that user only. */
export function LanguageMenu() {
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
    <Menu label={t("label")}
      buttonClassName="flex h-10 items-center gap-1.5 rounded-[var(--radius)] px-2.5 text-sm font-bold text-muted hover:bg-surface-2 hover:text-foreground disabled:opacity-50"
      trigger={<><IconLanguage size={18} aria-hidden className={busy ? "animate-pulse" : ""} /><span className="uppercase">{locale}</span></>}
      header={<p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("label")}</p>}
      items={LOCALES.map((l) => ({
        key: l,
        label: <span className="flex items-center justify-between gap-6"><span>{t(l)}</span><span className="text-xs font-bold uppercase text-muted">{l}</span></span>,
        selected: l === locale,
        onSelect: () => void change(l),
      }))} />
  );
}
