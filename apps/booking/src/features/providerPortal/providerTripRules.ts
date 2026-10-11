/**
 * What an external Provider may do with a trip of its own. The same rules the backend applies
 * (ProviderPortalService, PROVIDER_ACCESS_MODEL.md §3.7); here they only decide which buttons are on.
 */
export interface ReportableTrip {
  status?: string | null;
  isCancelled?: boolean | null;
  /** "YYYY-MM-DD…" */
  date: string;
}

/** Turned down: a trip given to it, or one it accepted and cannot do after all. */
const REJECTABLE = ["Assigned", "Accepted"];
/** Completed or no-show: a trip it accepted. */
const REPORTABLE = ["Accepted", "Waiting", "Late"];
/** Exported to its own system: a trip it committed to, and what came after. */
const EXPORTABLE_NOT = ["Assigned", "Rejected"];

export function providerCan(trip: ReportableTrip, today: string) {
  const open = !trip.isCancelled;
  const status = trip.status ?? "";
  return {
    accept: open && status === "Assigned",
    reject: open && REJECTABLE.includes(status),
    // Completed or no-show only once the trip's day has come.
    report: open && REPORTABLE.includes(status) && trip.date.slice(0, 10) <= today,
  };
}

/** A trip the Provider may export: one it accepted, or later. Never one it has not committed to. */
export const isExportable = (trip: { status?: string | null }) => !EXPORTABLE_NOT.includes(trip.status ?? "");

/** "08:40" → "08:40:00", the TimeSpan the backend reads; "" → null. */
export const toTimeSpan = (value: string) => (value ? `${value}:00` : null);
