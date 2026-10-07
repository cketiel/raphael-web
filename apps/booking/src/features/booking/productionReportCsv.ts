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

const date = (v: string | null | undefined) => (v ? new Date(v).toLocaleDateString() : "");
const yesNo = (v: unknown) => (v ? "Yes" : "No");

/**
 * One row, field by field as the original mapped it. The `|| ""` and `|| 0` fallbacks are kept
 * as they were, including that a 0 coordinate prints as empty.
 * `paid` is an amount in the backend; the original printed it as Yes/No, which lost the figure.
 */
export function toCsvRow(r: ProductionRow): unknown[] {
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
    r.created ? new Date(r.created).toLocaleString() : "",
  ];
}

/** CSV with a UTF-8 BOM so Excel opens accents correctly. Header row unquoted, as before. */
export function buildProductionCsv(rows: ProductionRow[]): string {
  return "﻿" + CSV_HEADERS.join(",") + "\n" + rows.map((r) => toCsvRow(r).map(formatCell).join(",")).join("\n");
}

export function productionReportFileName(now = new Date()) {
  return `Production_Report_${now.toISOString().split("T")[0]}.csv`;
}

export function downloadProductionCsv(rows: ProductionRow[]) {
  const blob = new Blob([buildProductionCsv(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = productionReportFileName();
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
