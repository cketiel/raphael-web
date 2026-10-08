"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useNotifications } from "@/features/notifications/NotificationsProvider";
import { useRealtime } from "./RealtimeProvider";

/**
 * The bell in the header: how many notices this user has not read, and the state of the live
 * channel. The list itself is the Notifications tab, where there is room for hundreds of them.
 */
export function NotificationBell() {
  const t = useTranslations("notifications");
  const { status } = useRealtime();
  const { unread } = useNotifications();

  return (
    <Link href="/notifications" aria-label={t("bellLabel", { count: unread })} title={t(status)}
      className="relative rounded-lg border border-slate-500 px-2.5 py-1 text-sm hover:bg-white/10">
      <span aria-hidden="true">🔔</span>
      {/* The live channel's state, as a dot: green when notices arrive by themselves. */}
      <span aria-hidden="true" className={`absolute -bottom-1 -left-1 size-2.5 rounded-full ring-2 ring-navy ${STATUS_DOT[status]}`} />
      {unread > 0 && (
        <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full bg-red-600 px-1 text-center text-[0.7rem] font-bold leading-5">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}

const STATUS_DOT = {
  connecting: "bg-amber-400",
  connected: "bg-emerald-400",
  reconnecting: "bg-amber-400",
  disconnected: "bg-red-500",
} as const;
