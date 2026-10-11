import { isCanceled, toTimeInput } from "./rules";
import { statusKey, type StatusKey } from "./TripStatus";
import type { TripRead } from "./types";

/** One trip as both views draw it. Fields with no source stay null, and the views show them in red. */
export interface TripLine {
  trip: TripRead;
  key: StatusKey;
  /** The trip's own number (#40235), or the database id when it has none. */
  number: string;
  /** "YYYY-MM-DD" of the trip, to sort and to split a range of days. */
  day: string;
  time: string | null;
  appt: string | null;
  patient: string;
  space: string | null;
  miles: string | null;
  provider: string | null;
  from: { place: string | null; address: string };
  to: { place: string | null; address: string };
  canceled: boolean;
  /** Done with: finished or canceled. Drawn on the quieter surface in the timeline. */
  past: boolean;
}

export function toLine(trip: TripRead): TripLine {
  const canceled = isCanceled(trip);
  const key = statusKey(trip.status, canceled);
  return {
    trip,
    key,
    number: trip.tripId || String(trip.id),
    day: trip.date.slice(0, 10),
    time: toTimeInput(trip.fromTime) || null,
    appt: toTimeInput(trip.toTime) || null,
    patient: trip.customerName ?? "",
    space: trip.spaceTypeName ?? null,
    // The backend stores the road distance in miles (TripModal: routing's distanceMiles).
    miles: trip.distance ? `${trip.distance.toFixed(1)} mi` : null,
    provider: trip.providerName ?? null,
    from: { place: trip.pickup || null, address: trip.pickupAddress ?? "" },
    to: { place: trip.dropoff || null, address: trip.dropoffAddress ?? "" },
    canceled,
    past: key === "finished" || key === "canceled",
  };
}

/** By day, then by pickup time; a trip with no time goes last in its day. */
export function byDayAndTime(a: TripLine, b: TripLine) {
  return a.day.localeCompare(b.day) || (a.time ?? "99:99").localeCompare(b.time ?? "99:99");
}
