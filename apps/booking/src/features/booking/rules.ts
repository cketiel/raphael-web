import type { ProductionRow } from "./productionReportCsv";
import type { TripRead } from "./types";

/** Status pill colours of the original portal (styles.css:61-80). Unknown statuses fall back to primary blue. */
const STATUS_COLORS: Record<string, string> = {
  assigned: "bg-[#198754] text-white",
  accepted: "bg-[#0dcaf0] text-white",
  scheduled: "bg-[#0d6efd] text-white",
  waiting: "bg-[#ffc107] text-[#212529]",
  late: "bg-[#fd7e14] text-white",
  inprogress: "bg-[#6610f2] text-white",
  finished: "bg-[#6c757d] text-white",
  canceled: "bg-[#dc3545] text-white",
  billed: "bg-[#20c997] text-white",
  payed: "bg-[#14a44d] text-white",
};

export function statusBadgeClass(status: string | null | undefined) {
  if (!status) return STATUS_COLORS.assigned;
  return STATUS_COLORS[status.toLowerCase()] ?? "bg-[#0d6efd] text-white";
}

export function isCanceled(trip: TripRead) {
  return trip.status === "Canceled" || trip.status === "Cancelled" || trip.isCancelled === true;
}

/**
 * The four summary cards. Mixes two sources, exactly as the original did:
 * the counts come from my-trips, the money from the production report.
 * "Billed Trips" is total minus canceled, not trips in Billed status.
 */
export function summarize(trips: TripRead[], report: ProductionRow[]) {
  const totalTrips = trips.length;
  const canceledTrips = trips.filter(isCanceled).length;
  const totalAmount = report.reduce((sum, r) => sum + (r.charge || 0), 0);
  return {
    totalTrips,
    canceledTrips,
    billedTrips: totalTrips - canceledTrips,
    totalBilledValue: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalAmount),
  };
}

/** Today in the user's own calendar. The original used the UTC date, which turns into tomorrow after 8 pm in Florida. */
export function localToday(now = new Date()) {
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

/** "HH:mm:ss" → "HH:mm", for <input type="time"> and for the table (the original showed the seconds). */
export const toTimeInput = (value: string | null | undefined) => (value ? value.substring(0, 5) : "");

/**
 * Customer search: 2+ characters, case-insensitive, first 10 (Booking Web app.js:762-780).
 * Matches name, Rider ID and client code: the box always said "name or code", but the original
 * never looked at the code.
 */
export function searchCustomers<T extends { fullName?: string | null; riderId?: string | null; clientCode?: string | null }>(
  customers: T[],
  text: string,
) {
  const q = text.toLowerCase();
  if (q.length < 2) return [];
  const has = (v: string | null | undefined) => (v || "").toLowerCase().includes(q);
  return customers.filter((c) => has(c.fullName) || has(c.riderId) || has(c.clientCode)).slice(0, 10);
}

/** A US phone as stored by the backend: 10 digits. Accepts any punctuation and a leading 1. */
export function normalizeUsPhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  return /^[2-9]\d{9}$/.test(digits) ? digits : null;
}

/** (239) 555-0142 for display; anything that is not 10 digits is shown as typed. */
export function formatUsPhone(digits: string): string {
  return /^\d{10}$/.test(digits) ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}` : digits;
}

export const MIN_DOB = "1900-01-01";

/** A date of birth must be a real past date: not in the future, not before 1900. */
export function isValidDob(value: string, today = localToday()): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= MIN_DOB && value <= today;
}

/** Attachments are stored in the database: Word or PDF only, 10 MB at most. */
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
export const ATTACHMENT_EXTENSIONS = [".pdf", ".doc", ".docx"] as const;

/** What is wrong with an attachment, as a code the form turns into words in the user's language. */
export type AttachmentProblem = "attachmentType" | "attachmentSize" | "attachmentEmpty";

export function attachmentProblem(file: { name: string; size: number } | null | undefined): AttachmentProblem | null {
  if (!file) return null;
  const name = file.name.toLowerCase();
  if (!ATTACHMENT_EXTENSIONS.some((ext) => name.endsWith(ext))) return "attachmentType";
  if (file.size > ATTACHMENT_MAX_BYTES) return "attachmentSize";
  if (file.size === 0) return "attachmentEmpty";
  return null;
}

/** "N/A" is what the form shows when Google gives no locality; it is never sent as a city name. */
export const cityForSave = (city: string) => (city === "N/A" ? "" : city);
