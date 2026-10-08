"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useNotificationHub, type HubStatus } from "./useNotificationHub";

const STATUS_STYLE: Record<HubStatus, string> = {
  connecting: "bg-amber-100 text-amber-800",
  connected: "bg-emerald-100 text-emerald-800",
  reconnecting: "bg-amber-100 text-amber-800",
  disconnected: "bg-red-100 text-red-800",
};

export function NotificationsPanel() {
  const { status, items } = useNotificationHub();
  const t = useTranslations("notifications");
  const format = useFormatter();

  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center gap-3">
        <h2 className="mr-auto text-lg font-semibold">{t("title")}</h2>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[status]}`}>{t(status)}</span>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{t("empty")}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((n) => (
            <li key={n.id} className="rounded-lg border border-border p-3 text-sm">
              <p className="font-semibold">{n.title}</p>
              <p className="text-muted">{n.message}</p>
              <p className="mt-1 font-mono text-xs text-muted">{n.businessEventCode} · {format.dateTime(new Date(n.createdAtUtc), { timeStyle: "medium" })}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
