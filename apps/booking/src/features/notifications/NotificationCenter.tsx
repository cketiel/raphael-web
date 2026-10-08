"use client";

import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { useState, type ComponentType } from "react";
import { Button } from "@/components/ui/Button";
import {
  IconCancelled, IconCheck, IconCheckAll, IconChevronLeft, IconChevronRight, IconCompleted, IconInbox, IconOnTheWay, IconReactivated, IconScheduled,
} from "@/components/ui/Icon";
import { Badge, Card, EmptyState, Notice, PageHeader, type Tone } from "@/components/ui/Surface";
import { Tabs } from "@/components/ui/Tabs";
import { useRealtime } from "@/features/realtime/RealtimeProvider";
import { useNotifications, type ClinicNotification } from "./NotificationsProvider";
import { tripLink, useDescribe } from "./useDescribe";

type IconComponent = ComponentType<{ size?: number | string; className?: string; "aria-hidden"?: boolean }>;

/**
 * The tabs, as data, in the order a trip lives them (Raphael.Desktop NotificationCenterViewModel.BuildTabs).
 * Reactivations have their own tab: a clinic must see at a glance that a cancelled trip is back.
 */
const TABS = [
  { key: "all", event: null, icon: IconInbox },
  { key: "scheduled", event: "TRIP_SCHEDULED", icon: IconScheduled },
  { key: "started", event: "DRIVER_STARTED_TRIP", icon: IconOnTheWay },
  { key: "completed", event: "DRIVER_COMPLETED_TRIP", icon: IconCompleted },
  { key: "cancelled", event: "TRIP_CANCELLED", icon: IconCancelled },
  { key: "reactivated", event: "TRIP_REACTIVATED", icon: IconReactivated },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/** How each kind of notice looks: its icon and colour, the same in the list and in its tab. */
const EVENT_LOOK: Record<string, { icon: IconComponent; tone: Tone; tile: string }> = {
  TRIP_SCHEDULED: { icon: IconScheduled, tone: "info", tile: "bg-info-soft text-info" },
  DRIVER_STARTED_TRIP: { icon: IconOnTheWay, tone: "warning", tile: "bg-warning-soft text-warning" },
  DRIVER_COMPLETED_TRIP: { icon: IconCompleted, tone: "success", tile: "bg-success-soft text-success" },
  TRIP_CANCELLED: { icon: IconCancelled, tone: "danger", tile: "bg-danger-soft text-danger" },
  TRIP_REACTIVATED: { icon: IconReactivated, tone: "violet", tile: "bg-violet-100 text-violet-700" },
};

const DEFAULT_LOOK = { icon: IconInbox, tone: "neutral" as Tone, tile: "bg-slate-100 text-slate-600" };

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
    <>
      <PageHeader title={t("title")} description={t("window")}
        actions={<>
          <Badge tone={STATUS_TONE[status]} className="!py-1">
            <span className={`size-2 rounded-full ${STATUS_DOT[status]}`} aria-hidden="true" />{t(status)}
          </Badge>
          <Button variant="secondary" icon={IconCheckAll} onClick={() => markRead(unreadHere)} disabled={unreadHere.length === 0}>
            {t("markAllRead")}
          </Button>
        </>} />

      <Tabs label={t("title")} value={tab} onChange={(k) => { setTab(k); setPage(1); }}
        items={TABS.map((x) => ({ key: x.key, label: t(`tabs.${x.key}`), icon: x.icon, count: inTab(x.key).length, attention: unreadIn(x.key) > 0 }))} />

      {isError && <Notice tone="danger" className="mb-4">{t("loadFailed")}</Notice>}

      <Card padded={false} className="overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-sm text-muted">{t("loading")}</p>
        ) : rows.length === 0 ? (
          <EmptyState icon={IconInbox} title={t("emptyTitle")}>{t("empty")}</EmptyState>
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((n) => (
              <Row key={n.id} n={n} read={isRead(n.id)} onRead={() => markRead([n.id])} describe={describe}
                when={format.dateTime(new Date(n.createdAtUtc), { dateStyle: "medium", timeStyle: "short" })} />
            ))}
          </ul>
        )}
      </Card>

      {pages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3 text-sm">
          <Button variant="secondary" icon={IconChevronLeft} disabled={current <= 1} onClick={() => setPage(current - 1)}>{t("previous")}</Button>
          <span className="font-semibold">{t("pageOf", { page: current, pages })}</span>
          <Button variant="secondary" disabled={current >= pages} onClick={() => setPage(current + 1)}>
            {t("next")}<IconChevronRight size={16} aria-hidden />
          </Button>
        </div>
      )}
    </>
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
  const look = EVENT_LOOK[n.businessEventCode] ?? DEFAULT_LOOK;

  return (
    <li className={`flex flex-wrap items-start gap-3 px-4 py-4 sm:flex-nowrap sm:px-5 ${read ? "" : "bg-brand-50/50"}`}>
      <span className={`relative flex size-10 shrink-0 items-center justify-center rounded-xl ${look.tile}`}>
        <look.icon size={18} aria-hidden />
        {!read && <span className="absolute -right-1 -top-1 size-3 rounded-full bg-brand ring-2 ring-surface" aria-hidden="true" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-[0.95rem] ${read ? "font-semibold text-slate-700" : "font-bold text-foreground"}`}>
          {title}
          {!read && <span className="sr-only"> · {t("unread")}</span>}
        </p>
        <p className="mt-0.5 text-sm text-slate-600">{body}</p>
        <p className="mt-1 text-xs text-muted">{when}</p>
      </div>
      <div className="flex w-full shrink-0 justify-end gap-2 sm:w-auto sm:self-center">
        {!read && <Button variant="ghost" size="sm" icon={IconCheck} onClick={onRead}>{t("markRead")}</Button>}
        {link && (
          <Link href={`/?trip=${link.tripId}&date=${link.date}`} onClick={onRead}
            className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius)] bg-brand px-3 text-sm font-semibold text-white hover:bg-brand-700">
            {t("viewTrip")}<IconChevronRight size={14} aria-hidden />
          </Link>
        )}
      </div>
    </li>
  );
}

const STATUS_TONE = { connecting: "warning", connected: "success", reconnecting: "warning", disconnected: "danger" } as const;
const STATUS_DOT = { connecting: "bg-amber-400", connected: "bg-emerald-500", reconnecting: "bg-amber-400", disconnected: "bg-red-500" } as const;
