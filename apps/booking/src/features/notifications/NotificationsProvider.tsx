"use client";

import { useQuery } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { api } from "@/lib/bff";
import { useRealtime, type LiveNotification } from "@/features/realtime/RealtimeProvider";
import { parseReadState, pruneExpired, readStoredState, saveReadState, subscribeReadState } from "./readState";

/** Raphael.Notification NotificationDto, as GET BookingPortal/notifications returns it. */
export interface ClinicNotification extends LiveNotification {
  expiresAtUtc?: string | null;
}

/** How long an integration notice is visible (NotificationRetentionPolicy.VisibleFor). */
const VISIBLE_FOR_MS = 7 * 24 * 60 * 60 * 1000;

interface Notifications {
  items: ClinicNotification[];
  isLoading: boolean;
  isError: boolean;
  unread: number;
  isRead(id: string): boolean;
  markRead(ids: string[]): void;
}

const NotificationsContext = createContext<Notifications | null>(null);

export function useNotifications() {
  const value = useContext(NotificationsContext);
  if (!value) throw new Error("useNotifications must be used inside <NotificationsProvider>.");
  return value;
}

/**
 * The backend writes these instants without a zone ("2026-10-08T04:36:32.37"): they are UTC, but
 * the browser would read them as local time and show a Florida clinic every notice four hours off.
 */
export function asUtc(value: string): string {
  return /([zZ]|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}Z`;
}

/** The same notice with its instants marked as UTC, so every later Date.parse is right. */
function normalize(n: ClinicNotification): ClinicNotification {
  return { ...n, createdAtUtc: asUtc(n.createdAtUtc), expiresAtUtc: n.expiresAtUtc ? asUtc(n.expiresAtUtc) : n.expiresAtUtc };
}

function expiresAt(n: ClinicNotification) {
  return n.expiresAtUtc ?? new Date(Date.parse(n.createdAtUtc) + VISIBLE_FOR_MS).toISOString();
}

/**
 * The clinic's notices for the whole signed-in area: the seven days the backend keeps, plus the ones
 * that arrive live, with this user's read marks. The header, the tab and the page all read from here.
 */
export function NotificationsProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const { notifications: live } = useRealtime();
  const stored = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api<ClinicNotification[]>("BookingPortal/notifications"),
    // Live notices arrive over the hub; this only catches up after a reconnect or a long absence.
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  });

  // Read marks live in localStorage, which the server render cannot see: it renders everything unread.
  const storedMarks = useSyncExternalStore(subscribeReadState, () => readStoredState(userId), () => null);
  const read = useMemo(() => parseReadState(storedMarks), [storedMarks]);

  // Notices expire while the page stays open: the clock moves once a minute, not on every render.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const handle = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(handle);
  }, []);

  const items = useMemo(() => {
    const byId = new Map<string, ClinicNotification>();
    for (const n of stored.data ?? []) byId.set(n.id, normalize(n));
    for (const n of live) if (!byId.has(n.id)) byId.set(n.id, normalize(n));
    return [...byId.values()]
      .filter((n) => Date.parse(expiresAt(n)) > now)
      .sort((a, b) => Date.parse(b.createdAtUtc) - Date.parse(a.createdAtUtc));
  }, [stored.data, live, now]);

  const markRead = useCallback(
    (ids: string[]) => {
      const next = pruneExpired(parseReadState(readStoredState(userId)));
      for (const id of ids) {
        const n = items.find((x) => x.id === id);
        if (n) next[id] = expiresAt(n);
      }
      saveReadState(userId, next);
    },
    [items, userId],
  );

  const value: Notifications = {
    items,
    isLoading: stored.isLoading,
    isError: stored.isError,
    unread: items.filter((n) => !read[n.id]).length,
    isRead: (id) => Boolean(read[id]),
    markRead,
  };

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}
