"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { useRealtime, type LiveNotification } from "./RealtimeProvider";

/** The five events a clinic is told about (NotificationRuleCatalog, recipient Integration). */
const KNOWN_EVENTS = new Set(["TRIP_SCHEDULED", "DRIVER_STARTED_TRIP", "TRIP_CANCELLED", "TRIP_REACTIVATED", "DRIVER_COMPLETED_TRIP"]);

/** The bell in the header: live notices for this clinic's trips, in the user's language. */
export function NotificationBell() {
  const t = useTranslations("notifications");
  const tc = useTranslations("common");
  const format = useFormatter();
  const { status, notifications, unread, markRead } = useRealtime();
  const [open, setOpen] = useState(false);

  /** Known events are written here, in the user's language; anything else shows the server's own text. */
  function describe(n: LiveNotification) {
    if (!KNOWN_EVENTS.has(n.businessEventCode)) return { title: n.title, body: n.message };
    const m = n.metadata ?? {};
    return {
      title: t(`events.${n.businessEventCode}.title`),
      body: t(`events.${n.businessEventCode}.body`, { tripId: m.TripId ?? "", date: m.TripDate ?? "", time: m.TripTime ?? "" }),
    };
  }

  return (
    <div className="relative">
      <button type="button" aria-label={t("title")} aria-expanded={open}
        onClick={() => { setOpen((o) => !o); markRead(); }}
        className="relative rounded-lg border border-slate-500 px-2.5 py-1 text-sm hover:bg-white/10">
        <span aria-hidden="true">🔔</span>
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full bg-red-600 px-1 text-center text-[0.7rem] font-bold leading-5">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <section
          className="fixed inset-x-2 top-14 z-[1200] max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-surface p-4 text-foreground shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96">
          <div className="mb-2 flex items-center gap-3">
            <h2 className="mr-auto text-base font-semibold">{t("title")}</h2>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[status]}`}>{t(status)}</span>
            {/* On a phone the panel covers the bell, so it closes from here too. */}
            <button type="button" onClick={() => setOpen(false)} aria-label={tc("close")}
              className="text-xl leading-none text-muted hover:text-foreground">×</button>
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-muted">{t("empty")}</p>
          ) : (
            <ul className="space-y-2">
              {notifications.map((n) => {
                const { title, body } = describe(n);
                return (
                  <li key={n.id} className="rounded-lg border border-border p-3 text-sm">
                    <p className="font-semibold">{title}</p>
                    <p className="text-muted">{body}</p>
                    <p className="mt-1 text-xs text-muted">{format.dateTime(new Date(n.createdAtUtc), { timeStyle: "short" })}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

const STATUS_STYLE = {
  connecting: "bg-amber-100 text-amber-800",
  connected: "bg-emerald-100 text-emerald-800",
  reconnecting: "bg-amber-100 text-amber-800",
  disconnected: "bg-red-100 text-red-800",
} as const;
