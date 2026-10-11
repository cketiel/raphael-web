"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { PhBell } from "@/components/ui/Icon";
import { useNotifications } from "@/features/notifications/NotificationsProvider";
import { useRealtime } from "./RealtimeProvider";

/**
 * The bell in the top bar: how many notices this user has not read. The list itself is the
 * Notifications page, where there is room for hundreds of them. Below 1024 px, where the sidebar
 * and its "Live updates" line are gone, a dot on the bell keeps the live channel's state in sight.
 */
export function NotificationBell({ onBrand = false }: { onBrand?: boolean }) {
  const t = useTranslations("notifications");
  const { status } = useRealtime();
  const { unread } = useNotifications();

  return (
    <Link href="/notifications" aria-label={t("bellLabel", { count: unread })} title={t(status)}
      className={`relative flex size-11 shrink-0 items-center justify-center rounded-[9px] ${onBrand
        ? "bg-[var(--ds-brand-tile)] text-[var(--ds-on-brand)] shadow-[inset_0_0_0_1px_var(--ds-brand-tile-ring)]"
        : "border border-[var(--ds-outline-variant)] text-[var(--ds-on-surface)] hover:bg-[var(--ds-selected)]"}`}>
      <PhBell size={19} aria-hidden />
      <span aria-hidden="true" className={`absolute bottom-2 right-2 size-2 rounded-full lg:hidden ${STATUS_DOT[status]}`} />
      {unread > 0 && (
        <span className={`absolute -right-1 -top-1 flex h-[19px] min-w-[19px] items-center justify-center rounded-[5px] border-2 bg-[var(--ds-badge)] px-1 font-[family-name:var(--font-plex-mono)] text-[11px] font-semibold text-white ${onBrand ? "border-[#073a52]" : "border-[var(--ds-surface)]"}`}>
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}

export const STATUS_DOT = {
  connecting: "bg-amber-400",
  connected: "bg-[#1c8a57] shadow-[0_0_8px_#1c8a57]",
  reconnecting: "bg-amber-400",
  disconnected: "bg-red-500",
} as const;
