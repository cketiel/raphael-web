"use client";

import { useTranslations } from "next-intl";
import type { LiveNotification } from "@/features/realtime/RealtimeProvider";

/** The five events a clinic is told about (NotificationRuleCatalog, recipient Integration), in the order a trip lives them. */
export const CLINIC_EVENTS = [
  "TRIP_SCHEDULED",
  "DRIVER_STARTED_TRIP",
  "DRIVER_COMPLETED_TRIP",
  "TRIP_CANCELLED",
  "TRIP_REACTIVATED",
] as const;

const KNOWN = new Set<string>(CLINIC_EVENTS);

/** Where a notice points: the trip and the day the trip list has to load to show it. */
export function tripLink(n: LiveNotification): { tripId: number; date: string } | null {
  const tripId = Number(n.metadata?.TripId);
  const date = n.metadata?.TripDate ?? "";
  if (!Number.isInteger(tripId) || tripId <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return { tripId, date };
}

/** Known events are written in the user's language; anything else shows the server's own text. */
export function useDescribe() {
  const t = useTranslations("notifications");
  return (n: LiveNotification) => {
    if (!KNOWN.has(n.businessEventCode)) return { title: n.title, body: n.message };
    const m = n.metadata ?? {};
    return {
      title: t(`events.${n.businessEventCode}.title`),
      body: t(`events.${n.businessEventCode}.body`, { tripId: m.TripId ?? "", date: m.TripDate ?? "", time: m.TripTime ?? "" }),
    };
  };
}
