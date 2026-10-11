"use client";

import { memo, useEffect, useState } from "react";
import type { TripRead } from "@/features/booking/types";
import type { TripVehiclePosition } from "@/features/realtime/RealtimeProvider";
import { LiveEta } from "./LiveEta";
import { liveEtaValues } from "./etaModel";

/**
 * Live ETA for one trip of the list, with its own one-second clock. Only the trips under way carry
 * one, so a list of hundreds re-draws nothing but these few every second.
 */
export const LiveEtaTicker = memo(function LiveEtaTicker({ trip, position, size, compact = false }: {
  trip: TripRead;
  /** The last position, with its phase, miles and the route's current ETAs; null before the first. */
  position: TripVehiclePosition | null;
  size: "md" | "inline";
  compact?: boolean;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const v = liveEtaValues({
    position,
    fallbackPhase: trip.status === "InProgress" ? "Dropoff" : "Pickup",
    pickupEta: position?.pickupEta ?? null,
    dropoffEta: position?.dropoffEta ?? null,
    appointment: trip.toTime ?? null,
    tripDay: trip.date.slice(0, 10),
    legMiles: trip.distance ?? null,
    now,
  });
  return <LiveEta v={v} size={size} compact={compact} />;
});
