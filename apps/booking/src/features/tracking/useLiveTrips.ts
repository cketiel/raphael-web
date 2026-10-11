"use client";

import { useEffect, useState } from "react";
import { useRealtime, type TripVehiclePosition } from "@/features/realtime/RealtimeProvider";

/**
 * Follows the vehicles of the trips under way in the list: one live subscription per trip, kept
 * while the trip is under way, and the last position of each. A position carries the phase, the
 * miles to go and the route's current ETAs, so nothing is asked of the backend on top of it.
 * `ids` is the set of trips under way; the subscriptions change only when that set changes.
 */
export function useLiveTrips(ids: number[]): Map<number, TripVehiclePosition | null> {
  const { status, watchTrip } = useRealtime();
  const [positions, setPositions] = useState(() => new Map<number, TripVehiclePosition | null>());
  const key = [...ids].sort((a, b) => a - b).join(",");

  useEffect(() => {
    if (status !== "connected" || !key) return;
    const tripIds = key.split(",").map(Number);
    const stops: (() => void)[] = [];
    let gone = false;
    const put = (id: number, p: TripVehiclePosition | null) =>
      setPositions((m) => { const next = new Map(m); next.set(id, p); return next; });

    for (const id of tripIds) {
      void watchTrip(id, (p) => put(id, p)).then(({ result, stop }) => {
        if (gone) { stop(); return; }
        stops.push(stop);
        put(id, result?.position ?? null);
      });
    }
    return () => { gone = true; stops.forEach((s) => s()); };
  }, [key, status, watchTrip]);

  return positions;
}
