import type { LiveEtaValues } from "./LiveEta";

/** A position older than this is "stale": shown dimmed, never as fresh (design: Live ETA states). */
export const STALE_AFTER_SECONDS = 120;
/** Under this many minutes the vehicle is "arriving now". */
export const ARRIVING_MINUTES = 2;
/** GPS speed comes from the driver's app in metres per second (MAUI Location.Speed). */
export const MPH_PER_MPS = 2.236_936;

/** "09:14:00" → minutes after midnight; null when empty or malformed. */
export function clockMinutes(value: string | null | undefined): number | null {
  const m = value ? /^(\d{1,2}):(\d{2})/.exec(value) : null;
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** "09:14:00" → "09:14". */
export const hhmm = (value: string | null | undefined) => (value ? value.slice(0, 5) : null);

/**
 * Whole minutes from now to a wall-clock time of the trip's day, rounded up (2 min 10 s is "3").
 * The route's hours are the business's wall clock (TIME_POLICY) and the clinic reads them on its
 * own clock, which is the same zone: the comparison is made in the browser's local time.
 */
export function minutesUntil(eta: string | null | undefined, tripDay: string, now: Date): number | null {
  const at = clockMinutes(eta);
  if (at === null) return null;
  const [y, m, d] = tripDay.slice(0, 10).split("-").map(Number);
  const target = new Date(y, m - 1, d, Math.floor(at / 60), at % 60, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / 60_000);
}

export interface LiveInputs {
  /** Last position, or null before the first one. */
  position: { atUtc: string; phase?: "Pickup" | "Dropoff"; remainingMiles?: number | null } | null;
  /** The phase when there is no position yet: from the trip's status. */
  fallbackPhase: "Pickup" | "Dropoff";
  pickupEta: string | null;
  dropoffEta: string | null;
  appointment: string | null;
  tripDay: string;
  /** The leg's full road miles (trip.distance), to draw how much of it is behind. */
  legMiles: number | null;
  now: Date;
}

/** Everything Live ETA shows, from the latest position and the route's current ETAs. */
export function liveEtaValues(i: LiveInputs): LiveEtaValues {
  const phase = i.position?.phase ?? i.fallbackPhase;
  const eta = phase === "Pickup" ? i.pickupEta : i.dropoffEta;
  const minutes = minutesUntil(eta, i.tripDay, i.now);
  const milesNumber = i.position?.remainingMiles ?? null;
  const miles = milesNumber === null ? null : milesNumber.toFixed(1);
  const ageSeconds = i.position ? Math.max(0, Math.round((i.now.getTime() - Date.parse(i.position.atUtc)) / 1000)) : null;

  // Late: heading to the drop-off with an ETA past the appointment.
  const etaAt = clockMinutes(i.dropoffEta);
  const apptAt = clockMinutes(i.appointment);
  const lateMinutes = phase === "Dropoff" && etaAt !== null && apptAt !== null ? etaAt - apptAt : 0;

  let state: LiveEtaValues["state"] = "live";
  if (!i.position) state = "nodata";
  else if (ageSeconds !== null && ageSeconds > STALE_AFTER_SECONDS) state = "stale";
  else if (minutes !== null && minutes < ARRIVING_MINUTES) state = "arriving";
  else if (lateMinutes > 0) state = "late";

  // How much of the way is behind: by distance when the leg's length is known, otherwise by time.
  let progress = 0;
  if (state !== "nodata") {
    progress = phase === "Dropoff" && milesNumber !== null && i.legMiles
      ? 1 - milesNumber / i.legMiles
      : minutes === null ? 0.5 : 1 - minutes / 30;
    progress = Math.max(0.1, Math.min(state === "arriving" ? 0.95 : 0.88, progress));
  }

  return { state, phase, minutes, miles, eta: hhmm(eta), ageSeconds, lateBy: lateMinutes > 0 ? `${lateMinutes} MIN` : null, progress };
}

/** Minutes of slack between the drop-off ETA and the appointment: positive is early, negative late. */
export function bufferMinutes(dropoffEta: string | null, appointment: string | null): number | null {
  const eta = clockMinutes(dropoffEta);
  const appt = clockMinutes(appointment);
  return eta === null || appt === null ? null : appt - eta;
}
