"use client";

import { useTranslations } from "next-intl";
import { bff } from "@/lib/bff";

export function SignOutButton() {
  const t = useTranslations("nav");
  async function signOut() {
    await bff("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    // A full reload on purpose: it also drops every patient record held in this tab's memory.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/login");
  }
  return (
    <button onClick={signOut} className="rounded-lg border border-slate-500 px-3 py-1 text-sm hover:bg-white/10">
      {t("logout")}
    </button>
  );
}
