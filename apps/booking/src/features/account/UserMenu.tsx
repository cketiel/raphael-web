"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useFeedback } from "@/components/Feedback";
import { bff } from "@/lib/bff";
import { ChangePasswordModal } from "./ChangePasswordModal";

/** The signed-in user's menu in the header: change the password, or sign out. Room for "My account" later. */
export function UserMenu({ username }: { username: string }) {
  const t = useTranslations("account");
  const tNav = useTranslations("nav");
  const feedback = useFeedback();
  const [open, setOpen] = useState(false);
  const [changing, setChanging] = useState(false);

  async function signOut() {
    await bff("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    // A full reload on purpose: it also drops every patient record held in this tab's memory.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/login");
  }

  return (
    <div className="relative">
      <button type="button" aria-haspopup="menu" aria-expanded={open} aria-label={t("menu", { name: username })}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-slate-500 px-2.5 py-1 text-sm hover:bg-white/10">
        <span aria-hidden="true">👤</span>
        <span className="hidden max-w-40 truncate font-bold sm:inline">{username}</span>
        <span aria-hidden="true" className="text-xs">▾</span>
      </button>

      {open && (
        <ul role="menu" className="absolute right-0 top-full z-[1200] mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface py-1 text-sm text-foreground shadow-2xl">
          <li className="truncate px-4 py-2 text-xs text-muted sm:hidden">{tNav("user", { name: username })}</li>
          <li>
            <button type="button" role="menuitem" onClick={() => { setOpen(false); setChanging(true); }}
              className="w-full px-4 py-2 text-left hover:bg-slate-100">{t("changePassword")}</button>
          </li>
          <li>
            <button type="button" role="menuitem" onClick={() => void signOut()}
              className="w-full border-t border-border px-4 py-2 text-left text-[#dc3545] hover:bg-red-50">{tNav("logout")}</button>
          </li>
        </ul>
      )}

      {changing && (
        <ChangePasswordModal onClose={() => setChanging(false)}
          onChanged={() => { setChanging(false); void feedback.alert(t("changed")); }} />
      )}
    </div>
  );
}
