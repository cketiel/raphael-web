import type { Schemas } from "@raphael/api-client";

export type ProductionRow = Schemas["ProductionReportRowDto"];

/** The 47 columns, in the exact order of the original portal (Booking Web app.js:229-238). */
export const CSV_HEADERS = [
  "Date", "Req Pickup", "Appointment", "Patient", "Pickup Address", "Dropoff Address", "Space",
  "Charge", "Paid", "Pickup Comment", "Dropoff Comment", "Type", "Pickup Phone", "Dropoff Phone",
  "Authorization", "Funding Source", "Distance", "Run", "Driver", "Pickup Arrive", "Pickup Perform",
  "Dropoff Arrive", "Dropoff Perform", "Will Call", "Canceled", "VIN", "Pickup Odometer",
  "Will Call Time", "Vehicle", "Vehicle Plate", "Trip Id", "Pickup GPS Arrive Distance",
  "Dropoff GPS Arrive Distance", "Pickup City", "Pickup State", "Pickup Zip", "Dropoff City",
  "Dropoff State", "Dropoff Zip", "Patient Address", "DOB", "Driver No-Show Reason",
  "Pickup Lat", "Pickup Lon", "Dropoff Lat", "Dropoff Lon", "Created",
] as const;

/** Every cell quoted, double quotes doubled, line breaks flattened to a space. */
export function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value).replace(/\r?\n|\r/g, " ").replace(/"/g, '""');
  return `"${text}"`;
}

/**
 * The words and formats of one language. The CSV follows the user's language (decided
 * 2026-10-07): headers, Yes/No and dates. English is the default, and the column order never changes.
 */
export interface CsvLocale {
  headers: readonly string[];
  yes: string;
  no: string;
  /** Formats a date (and, when asked, its time) the way the user reads them. */
  formatDate: (value: Date, withTime: boolean) => string;
}

export const ENGLISH_CSV: CsvLocale = {
  headers: CSV_HEADERS,
  yes: "Yes",
  no: "No",
  formatDate: (value, withTime) => (withTime ? value.toLocaleString("en-US") : value.toLocaleDateString("en-US")),
};

/**
 * One row, field by field as the original mapped it. The `|| ""` and `|| 0` fallbacks are kept
 * as they were, including that a 0 coordinate prints as empty.
 * `paid` is an amount in the backend; the original printed it as Yes/No, which lost the figure.
 */
export function toCsvRow(r: ProductionRow, l: CsvLocale = ENGLISH_CSV): unknown[] {
  const date = (v: string | null | undefined) => (v ? l.formatDate(new Date(v), false) : "");
  const yesNo = (v: unknown) => (v ? l.yes : l.no);
  return [
    date(r.date),
    r.reqPickup || "",
    r.appointment || "",
    r.patient || "",
    r.pickupAddress || "",
    r.dropoffAddress || "",
    r.space || "",
    r.charge || 0,
    r.paid || 0,
    r.pickupComment || "",
    r.dropoffComment || "",
    r.type || "",
    r.pickupPhone || "",
    r.dropoffPhone || "",
    r.authorization || "",
    r.fundingSource || "",
    r.distance || 0,
    r.run || "",
    r.driver || "",
    r.pickupArrive || "",
    r.pickupPerform || "",
    r.dropoffArrive || "",
    r.dropoffPerform || "",
    yesNo(r.willCall),
    yesNo(r.canceled),
    r.vin || "",
    r.pickupOdometer || "",
    r.willCallTime || "",
    r.vehicle || "",
    r.vehiclePlate || "",
    r.tripId || "",
    r.pickupGpsArriveDistance || 0,
    r.dropoffGpsArriveDistance || 0,
    r.pickupCity || "",
    r.pickupState || "",
    r.pickupZip || "",
    r.dropoffCity || "",
    r.dropoffState || "",
    r.dropoffZip || "",
    r.patientAddress || "",
    date(r.dob),
    r.driverNoShowReason || "",
    r.pickupLat || "",
    r.pickupLon || "",
    r.dropoffLat || "",
    r.dropoffLon || "",
    r.created ? l.formatDate(new Date(r.created), true) : "",
  ];
}

/** CSV with a UTF-8 BOM so Excel opens accents correctly. Header row unquoted, as before. */
export function buildProductionCsv(rows: ProductionRow[], l: CsvLocale = ENGLISH_CSV): string {
  return "﻿" + l.headers.join(",") + "\n" + rows.map((r) => toCsvRow(r, l).map(formatCell).join(",")).join("\n");
}

export function productionReportFileName(now = new Date()) {
  return `Production_Report_${now.toISOString().split("T")[0]}.csv`;
}

export function downloadProductionCsv(rows: ProductionRow[], l: CsvLocale = ENGLISH_CSV, fileName = productionReportFileName()) {
  const blob = new Blob([buildProductionCsv(rows, l)], { type: "text/csv;charset=utf-8;" });
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
