"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { IconBell } from "@/components/ui/Icon";
import { useNotifications } from "@/features/notifications/NotificationsProvider";
import { useRealtime } from "./RealtimeProvider";

/**
 * The bell in the top bar: how many notices this user has not read, and the state of the live
 * channel. The list itself is the Notifications page, where there is room for hundreds of them.
 */
export function NotificationBell() {
  const t = useTranslations("notifications");
  const { status } = useRealtime();
  const { unread } = useNotifications();

  return (
    <Link href="/notifications" aria-label={t("bellLabel", { count: unread })} title={t(status)}
      className="relative flex size-10 items-center justify-center rounded-[var(--radius)] text-muted hover:bg-surface-2 hover:text-foreground">
      <IconBell size={19} aria-hidden />
      {/* The live channel's state, as a dot: green when notices arrive by themselves. */}
      <span aria-hidden="true" className={`absolute bottom-2 right-2 size-2.5 rounded-full ring-2 ring-surface ${STATUS_DOT[status]}`} />
      {unread > 0 && (
        <span className="absolute right-0.5 top-0.5 min-w-5 rounded-full bg-danger px-1 text-center text-[0.68rem] font-bold leading-5 text-white">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}

const STATUS_DOT = {
  connecting: "bg-amber-400",
  connected: "bg-emerald-500",
  reconnecting: "bg-amber-400",
  disconnected: "bg-red-500",
} as const;
