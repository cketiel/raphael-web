"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useFeedback } from "@/components/Feedback";
import { PhBuildings, PhCaretDown, PhCaretUpDown, PhKey, PhSignOut } from "@/components/ui/Icon";
import { Menu, type MenuItem } from "@/components/ui/Menu";
import { bff } from "@/lib/bff";
import { ChangePasswordModal } from "./ChangePasswordModal";

/** Two letters for the avatar: "ana.lopez" → "AL", "test" → "TE". */
export function initials(username: string) {
  const parts = username.split(/[\s._-]+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : username.slice(0, 2)).toUpperCase();
}

/**
 * The signed-in user's menu: who is signed in, the portal's version, the organization, the password
 * and sign out. One menu, two triggers: the top bar and the user card at the foot of the sidebar.
 * `organization` is null when this user cannot open Admin; its name is then not a link.
 */
export function UserMenu({ username, roleLabel, organization, variant = "topbar", extra = [] }: {
  username: string;
  roleLabel: string;
  organization: { name: string | null; canOpen: boolean };
  /** "brand": the ocean header below 1024 px, where only the avatar fits and dark text would not read. */
  variant?: "topbar" | "sidebar" | "brand";
  /** Rows before Sign out: on a phone, the theme and the language, which have no room in the header. */
  extra?: MenuItem[];
}) {
  const t = useTranslations("account");
  const tNav = useTranslations("nav");
  const feedback = useFeedback();
  const router = useRouter();
  const [changing, setChanging] = useState(false);

  async function signOut() {
    await bff("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    // A full reload on purpose: it also drops every patient record held in this tab's memory.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/login");
  }

  // No name yet (still loading, or not readable by this user): shown in red until it has a source.
  const orgName = organization.name ?? tNav("organizationUnknown");
  const items: MenuItem[] = [
    {
      key: "organization",
      label: <span className={organization.name ? "" : "text-red-600"}>{orgName}</span>,
      icon: PhBuildings,
      onSelect: () => { if (organization.canOpen) router.push("/admin?section=organization"); },
    },
    { key: "password", label: t("changePassword"), icon: PhKey, onSelect: () => setChanging(true) },
    ...extra,
    { key: "logout", label: tNav("logout"), icon: PhSignOut, danger: true, separated: true, onSelect: () => void signOut() },
  ];

  const header = (
    <>
      <p className="font-[family-name:var(--font-plex-mono)] text-[10.5px] uppercase tracking-[0.12em] text-[var(--ds-on-surface-variant)]">{tNav("signedInAs")}</p>
      <p className="mt-1 truncate text-sm font-semibold">{username}</p>
      <p className="mt-0.5 font-[family-name:var(--font-plex-mono)] text-[11.5px] uppercase text-[var(--ds-on-surface-variant)]">
        {roleLabel} · v{process.env.APP_VERSION}
      </p>
    </>
  );

  const trigger = variant === "sidebar" ? (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(140deg,#5ab6dd,#0a5c7e)] text-[13px] font-bold text-white" aria-hidden="true">{initials(username)}</span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[13.5px] font-semibold text-white">{username}</span>
        <span className="block truncate text-[11.5px] text-[var(--ds-on-brand-variant)]">{roleLabel}</span>
      </span>
      <PhCaretUpDown size={16} aria-hidden className="text-[var(--ds-on-brand-variant)]" />
    </>
  ) : (
    <>
      <span className="flex size-[30px] items-center justify-center rounded-[7px] bg-[linear-gradient(140deg,#5ab6dd,#0a5c7e)] font-[family-name:var(--font-plex-mono)] text-[11.5px] font-semibold text-white" aria-hidden="true">{initials(username)}</span>
      {variant === "topbar" && <>
        <span className="hidden max-w-36 truncate text-[13.5px] font-medium text-[var(--ds-on-surface)] sm:inline">{username}</span>
        <PhCaretDown size={12} aria-hidden className="hidden text-[var(--ds-on-surface-variant)] sm:inline" />
      </>}
    </>
  );

  return (
    <>
      <Menu look="ds" width={244} label={t("menu", { name: username })} header={header} items={items}
        side={variant === "sidebar" ? "above" : "below"} align={variant === "sidebar" ? "left" : "right"}
        buttonClassName={variant === "sidebar"
          ? "flex h-14 w-full items-center gap-[11px] rounded-[10px] bg-white/10 px-3 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)] hover:bg-white/15"
          : variant === "brand"
            ? "flex size-11 items-center justify-center rounded-[9px] bg-[var(--ds-brand-tile)] shadow-[inset_0_0_0_1px_var(--ds-brand-tile-ring)]"
            : "flex h-11 items-center gap-[9px] rounded-[9px] border border-[var(--ds-outline-variant)] pl-1.5 pr-1.5 sm:pr-3 hover:bg-[var(--ds-selected)]"}
        trigger={trigger} />

      {changing && (
        <ChangePasswordModal onClose={() => setChanging(false)}
          onChanged={() => { setChanging(false); void feedback.alert(t("changed")); }} />
      )}
    </>
  );
}
