import { formatCell } from "./productionReportCsv";
import { isCanceled } from "./rules";
import type { TripRead } from "./types";

/**
 * The trips of a range as a SafeRide2 file: the same 31 columns, in the same order, as the files
 * Raphael.Desktop imports (Assets/Mappings/SAFERIDE2.json). A file exported here can be imported
 * there as it is. What the Desktop reads, and therefore what must hold:
 * - PickUpTime and DropOffTime are "MM-dd-yyyy HH:mm" (CsvTripMapper.ParseDateWithTime), and
 *   PickUpTime is never empty: the importer throws. A trip with no pickup time goes out at 23:59,
 *   as SafeRide writes its will-calls.
 * - Status only matters when it says "WillCall"; the importer takes every other row as Accepted.
 *   So a will-call trip says WillCall, and every other trip says its own status. A canceled trip
 *   says Canceled, and the Desktop would bring it back as Accepted: the file is a record, and
 *   re-importing canceled rows is the dispatcher's decision.
 * - MobilityType is matched against the space types by name (WCH, AMB…).
 */
export const TRIPS_CSV_HEADERS = [
  "MediRoutesClient", "PickUpTime", "PickUpAddressName", "Status", "MemberName", "memberID", "MemberAge",
  "TripType", "PickUpPhone", "PickUpStreet", "PickUpCity", "PickUpState", "PickUpZip", "PickUpNotes",
  "DropOffNotes", "DropOffZip", "DropOffState", "DropOffCity", "DropOffStreet", "DropOffPhone",
  "DropOffAddressName", "DropOffTime", "CarSeats", "TripID", "MobilityType", "Escorts", "Attendants",
  "Miles", "TripLegID", "Payor", "ClaimNote",
] as const;

/** What the trip itself does not carry: who the patient is, from the list Booking already holds. */
export interface PatientInfo {
  riderId?: string | null;
  dob?: string | null;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

/**
 * "1547 N Tamiami Trl, North Fort Myers, FL 33903, USA" → street, city, state, zip.
 * Every address saved by Booking comes from Google in that shape. One that does not keep the whole
 * text as the street, and the city the trip has: better a full street than a wrong split.
 */
export function splitAddress(full: string | null | undefined, cityHint?: string | null): Address {
  const text = (full ?? "").trim();
  const parts = text.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length && /^(USA|United States|EE\. UU\.|Estados Unidos)$/i.test(parts[parts.length - 1])) parts.pop();
  const stateZip = parts.length >= 3 ? /^([A-Z]{2})(?:\s+(\d{5}(?:-\d{4})?))?$/.exec(parts[parts.length - 1]) : null;
  if (!stateZip) return { street: text, city: cityHint?.trim() ?? "", state: "", zip: "" };
  return {
    street: parts.slice(0, -2).join(", "),
    city: parts[parts.length - 2],
    state: stateZip[1],
    zip: stateZip[2] ?? "",
  };
}

/** "2026-10-09" and "08:45:00" → "10-09-2026 08:45". */
export function safeRideDateTime(day: string, time: string | null | undefined): string {
  const [y, m, d] = day.slice(0, 10).split("-");
  return `${m}-${d}-${y} ${time ? time.slice(0, 5) : "23:59"}`;
}

/** Whole years on the day of the trip, or empty when the date of birth is unknown. */
export function ageOn(dob: string | null | undefined, day: string): string {
  if (!dob) return "";
  const [by, bm, bd] = dob.slice(0, 10).split("-").map(Number);
  const [ty, tm, td] = day.slice(0, 10).split("-").map(Number);
  if (!by || !ty) return "";
  const age = ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0);
  return age >= 0 ? String(age) : "";
}

export function toTripsCsvRow(trip: TripRead, patient: PatientInfo | undefined, client: string): unknown[] {
  const day = trip.date.slice(0, 10);
  const from = splitAddress(trip.pickupAddress, trip.pickupCity);
  const to = splitAddress(trip.dropoffAddress, trip.dropoffCity);
  const status = trip.willCall && !isCanceled(trip) ? "WillCall" : isCanceled(trip) ? "Canceled" : (trip.status ?? "");
  return [
    client,
    safeRideDateTime(day, trip.fromTime),
    trip.pickup ?? "",
    status,
    trip.customerName ?? "",
    patient?.riderId ?? "",
    ageOn(patient?.dob, day),
    trip.type === "Return" ? "B" : "A",
    trip.pickupPhone ?? "",
    from.street, from.city, from.state, from.zip,
    trip.pickupComment ?? "",
    trip.dropoffComment ?? "",
    to.zip, to.state, to.city, to.street,
    trip.dropoffPhone ?? "",
    trip.dropoff ?? "",
    trip.toTime ? safeRideDateTime(day, trip.toTime) : "",
    "",
    trip.tripId ?? "",
    trip.spaceTypeName ?? "",
    "", "",
    trip.distance != null ? String(Math.round(trip.distance * 100) / 100) : "",
    "",
    trip.fundingSourceName ?? "",
    "",
  ];
}

/** UTF-8 with a BOM, so Excel shows the accents; the Desktop's StreamReader reads past it. */
export function buildTripsCsv(trips: TripRead[], patients: Map<number, PatientInfo>, client: string): string {
  const rows = trips.map((t) => toTripsCsvRow(t, patients.get(t.customerId ?? -1), client).map(formatCell).join(","));
  return "﻿" + TRIPS_CSV_HEADERS.join(",") + "\n" + rows.join("\n") + "\n";
}

/** raphael-trips_2026-10-01_2026-10-09.csv, or raphael-trips_2026-10-09.csv for one day. */
export function tripsCsvFileName(start: string, end: string) {
  return start === end ? `raphael-trips_${start}.csv` : `raphael-trips_${start}_${end}.csv`;
}

export function downloadTripsCsv(content: string, fileName: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
