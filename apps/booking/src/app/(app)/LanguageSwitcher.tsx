"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { LOCALES } from "@/i18n/locale";
import { bff } from "@/lib/bff";

/** The signed-in user's language, remembered in this browser for that user only. */
export function LanguageSwitcher() {
  const t = useTranslations("language");
  const locale = useLocale();
  const [busy, setBusy] = useState(false);

  async function change(next: string) {
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
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">{t("label")}</span>
      <select value={locale} disabled={busy} onChange={(e) => void change(e.target.value)}
        className="rounded-lg border border-slate-500 bg-transparent px-2 py-1 text-sm text-white [&>option]:text-slate-900">
        {LOCALES.map((l) => <option key={l} value={l}>{t(l)}</option>)}
      </select>
    </label>
  );
}
