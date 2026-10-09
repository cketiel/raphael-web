"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useFeedback } from "@/components/Feedback";
import { IconChevronDown, IconKey, IconLogout } from "@/components/ui/Icon";
import { Menu } from "@/components/ui/Menu";
import { bff } from "@/lib/bff";
import { ChangePasswordModal } from "./ChangePasswordModal";

/** Two letters for the avatar: "ana.lopez" → "AL", "test" → "TE". */
function initials(username: string) {
  const parts = username.split(/[\s._-]+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : username.slice(0, 2)).toUpperCase();
}

/** The signed-in user's menu in the top bar: change the password, or sign out. Room for "My account" later. */
export function UserMenu({ username }: { username: string }) {
  const t = useTranslations("account");
  const tNav = useTranslations("nav");
  const feedback = useFeedback();
  const [changing, setChanging] = useState(false);

  async function signOut() {
    await bff("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    // A full reload on purpose: it also drops every patient record held in this tab's memory.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/login");
  }

  return (
    <>
      <Menu label={t("menu", { name: username })}
        buttonClassName="flex h-10 items-center gap-2 rounded-[var(--radius)] pl-1 pr-2 hover:bg-surface-2"
        trigger={
          <>
            <span className="flex size-8 items-center justify-center rounded-full bg-brand text-xs font-bold text-white" aria-hidden="true">{initials(username)}</span>
            <span className="hidden max-w-36 truncate text-sm font-semibold text-foreground sm:inline">{username}</span>
            <IconChevronDown size={13} aria-hidden className="hidden text-muted sm:inline" />
          </>
        }
        header={<><p className="text-xs text-muted">{tNav("signedInAs")}</p><p className="truncate font-semibold">{username}</p><p className="mt-1 text-xs text-muted">v{process.env.APP_VERSION}</p></>}
        items={[
          { key: "password", label: t("changePassword"), icon: IconKey, onSelect: () => setChanging(true) },
          { key: "logout", label: tNav("logout"), icon: IconLogout, danger: true, onSelect: () => void signOut() },
        ]} />

      {changing && (
        <ChangePasswordModal onClose={() => setChanging(false)}
          onChanged={() => { setChanging(false); void feedback.alert(t("changed")); }} />
      )}
    </>
  );
}
