/**
 * What an external Provider may still report about a trip. The same rules the backend applies
 * (ProviderPortalService); here they only decide which buttons are on.
 */
export interface ReportableTrip {
  status?: string | null;
  isCancelled?: boolean | null;
  providerOutcome?: string | null;
  /** "YYYY-MM-DD…" */
  date: string;
}

/** Started or over: a trip that can no longer be turned down. */
const NOT_REJECTABLE = ["Started", "Arrived", "InProgress", "Finished", "Billed", "Payed", "Canceled"];
/** Done, billed or cancelled: nothing left to report. */
const CLOSED = ["Finished", "Billed", "Payed", "Canceled"];

export function providerCan(trip: ReportableTrip, today: string) {
  const open = !trip.isCancelled && !trip.providerOutcome;
  return {
    reject: open && !NOT_REJECTABLE.includes(trip.status ?? ""),
    // Completed or no-show only once the trip's day has come.
    report: open && !CLOSED.includes(trip.status ?? "") && trip.date.slice(0, 10) <= today,
  };
}

/** "08:40" → "08:40:00", the TimeSpan the backend reads; "" → null. */
export const toTimeSpan = (value: string) => (value ? `${value}:00` : null);
