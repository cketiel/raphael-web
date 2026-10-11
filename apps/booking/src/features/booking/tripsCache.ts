import type { ProductionRow } from "./productionReportCsv";
import type { TripRead } from "./types";

/** What the Trips list loaded for one range. */
export interface LoadedTrips {
  trips: TripRead[];
  report: ProductionRow[];
  /** The range these trips were searched for: a live change outside it is not this list's business. */
  start: string;
  end: string;
}

/**
 * The last list Trips loaded, kept for as long as this tab lives in the portal. Opening a trip's
 * tracking page, another section, or changing the language and coming back shows it at once instead
 * of asking the backend again: with hundreds of trips that request is the heaviest of the portal.
 *
 * It stays true while the list is not on screen: the frame applies every live status change to it
 * (`applyStatus`), and a change for a trip it does not hold, inside its range (a new booking), marks
 * it `stale` so the list asks once, in the background, when it is shown again.
 */
let cached: { data: LoadedTrips; stale: boolean } | null = null;

export const tripsCache = {
  /** The list for exactly this range, or null. */
  get(start: string, end: string) {
    return cached && cached.data.start === start && cached.data.end === end ? cached : null;
  },

  set(data: LoadedTrips) {
    cached = { data, stale: false };
  },

  applyStatus(change: { tripId: number; status: string; isCancelled: boolean; date: string }) {
    if (!cached) return;
    const { data } = cached;
    if (data.trips.some((t) => t.id === change.tripId)) {
      cached = {
        ...cached,
        data: { ...data, trips: data.trips.map((t) => (t.id === change.tripId ? { ...t, status: change.status, isCancelled: change.isCancelled } : t)) },
      };
      return;
    }
    const day = change.date.slice(0, 10);
    if (day >= data.start && day <= data.end) cached = { ...cached, stale: true };
  },

  /** Signing out forgets it: the next user of this browser never sees it. */
  clear() {
    cached = null;
  },
};
