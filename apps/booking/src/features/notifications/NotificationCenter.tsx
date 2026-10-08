"use client";

import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { useRealtime } from "@/features/realtime/RealtimeProvider";
import { useNotifications, type ClinicNotification } from "./NotificationsProvider";
import { tripLink, useDescribe } from "./useDescribe";

/**
 * The tabs, as data, in the order a trip lives them (Raphael.Desktop NotificationCenterViewModel.BuildTabs).
 * Reactivations have their own tab: a clinic must see at a glance that a cancelled trip is back.
 */
const TABS = [
  { key: "all", event: null },
  { key: "scheduled", event: "TRIP_SCHEDULED" },
  { key: "started", event: "DRIVER_STARTED_TRIP" },
  { key: "completed", event: "DRIVER_COMPLETED_TRIP" },
  { key: "cancelled", event: "TRIP_CANCELLED" },
  { key: "reactivated", event: "TRIP_REACTIVATED" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/**
 * Rows per page. Fifty, as in the Desktop: a week of a busy clinic is well over a thousand notices,
 * all already in memory, so this pages the rendering, not the fetch.
 */
const PAGE_SIZE = 50;

/** The clinic's inbox: seven days of notices, by kind, each one a way back to its trip. */
export function NotificationCenter() {
  const t = useTranslations("notifications");
  const format = useFormatter();
  const describe = useDescribe();
  const { status } = useRealtime();
  const { items, isLoading, isError, isRead, markRead } = useNotifications();
  const [tab, setTab] = useState<TabKey>("all");
  const [page, setPage] = useState(1);

  const inTab = (key: TabKey) => {
    const event = TABS.find((x) => x.key === key)!.event;
    return event ? items.filter((n) => n.businessEventCode === event) : items;
  };
  const rows = inTab(tab);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const unreadIn = (key: TabKey) => inTab(key).filter((n) => !isRead(n.id)).length;
  const unreadHere = rows.filter((n) => !isRead(n.id)).map((n) => n.id);

  return (
    <div className="w-full px-3 py-4 sm:px-6 sm:py-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-xl font-bold text-slate-600">{t("title")}</h1>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[status]}`}>{t(status)}</span>
        <button type="button" onClick={() => markRead(unreadHere)} disabled={unreadHere.length === 0}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-40">
          {t("markAllRead")}
        </button>
      </div>
      <p className="mb-4 text-sm text-muted">{t("window")}</p>

      {/* Tabs: they scroll sideways on a phone rather than wrap into a wall of buttons. */}
      <div className="mb-4 overflow-x-auto [scrollbar-width:none]">
        <ul className="flex min-w-max gap-1 rounded-xl bg-surface p-1 shadow-sm" role="tablist" aria-label={t("title")}>
          {TABS.map((x) => {
            const active = x.key === tab;
            const unread = unreadIn(x.key);
            return (
              <li key={x.key}>
                <button type="button" role="tab" aria-selected={active} onClick={() => { setTab(x.key); setPage(1); }}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${
                    active ? "bg-brand text-white" : "text-muted hover:bg-slate-50 hover:text-foreground"
                  }`}>
                  {t(`tabs.${x.key}`)}
                  <span className={`rounded-full px-1.5 text-[0.7rem] ${active ? "bg-white/25" : "bg-slate-100"}`}>{inTab(x.key).length}</span>
                  {unread > 0 && <span className="size-2 rounded-full bg-red-600" aria-label={t("unreadCount", { count: unread })} />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {isError && <p className="mb-3 text-sm text-red-700">{t("loadFailed")}</p>}

      {isLoading ? (
        <p className="text-sm text-muted">{t("loading")}</p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl bg-surface p-6 text-sm text-muted shadow-sm">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl bg-surface shadow-sm">
          {visible.map((n) => (
            <Row key={n.id} n={n} read={isRead(n.id)} onRead={() => markRead([n.id])}
              describe={describe} when={format.dateTime(new Date(n.createdAtUtc), { dateStyle: "medium", timeStyle: "short" })} />
          ))}
        </ul>
      )}

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button type="button" disabled={current <= 1} onClick={() => setPage(current - 1)}
            className="rounded-lg border border-border px-4 py-2 font-semibold disabled:opacity-40">{t("previous")}</button>
          <span>{t("pageOf", { page: current, pages })}</span>
          <button type="button" disabled={current >= pages} onClick={() => setPage(current + 1)}
            className="rounded-lg border border-border px-4 py-2 font-semibold disabled:opacity-40">{t("next")}</button>
        </div>
      )}
    </div>
  );
}

function Row({ n, read, onRead, describe, when }: {
  n: ClinicNotification;
  read: boolean;
  onRead: () => void;
  describe: ReturnType<typeof useDescribe>;
  when: string;
}) {
  const t = useTranslations("notifications");
  const { title, body } = describe(n);
  const link = tripLink(n);

  return (
    <li className={`flex flex-wrap items-start gap-3 p-4 sm:flex-nowrap ${read ? "" : "bg-sky-50/60"}`}>
      <span aria-hidden="true" className={`mt-1.5 size-2.5 shrink-0 rounded-full ${read ? "bg-transparent" : "bg-brand"}`} />
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${read ? "font-semibold text-slate-700" : "font-bold"}`}>
          <span className={`mr-2 inline-block rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ${EVENT_STYLE[n.businessEventCode] ?? "bg-slate-100 text-slate-700"}`}>{title}</span>
          {!read && <span className="sr-only">{t("unread")}</span>}
        </p>
        <p className="mt-1 text-sm text-slate-700">{body}</p>
        <p className="mt-1 text-xs text-muted">{when}</p>
      </div>
      <div className="flex w-full shrink-0 justify-end gap-2 sm:w-auto">
        {!read && (
          <button type="button" onClick={onRead} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted hover:bg-slate-100">
            {t("markRead")}
          </button>
        )}
        {link && (
          <Link href={`/?trip=${link.tripId}&date=${link.date}`} onClick={onRead}
            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white hover:opacity-90">
            {t("viewTrip")}
          </Link>
        )}
      </div>
    </li>
  );
}

const STATUS_STYLE = {
  connecting: "bg-amber-100 text-amber-800",
  connected: "bg-emerald-100 text-emerald-800",
  reconnecting: "bg-amber-100 text-amber-800",
  disconnected: "bg-red-100 text-red-800",
} as const;

const EVENT_STYLE: Record<string, string> = {
  TRIP_SCHEDULED: "bg-sky-100 text-sky-800",
  DRIVER_STARTED_TRIP: "bg-amber-100 text-amber-800",
  DRIVER_COMPLETED_TRIP: "bg-emerald-100 text-emerald-800",
  TRIP_CANCELLED: "bg-red-100 text-red-800",
  TRIP_REACTIVATED: "bg-violet-100 text-violet-800",
};
