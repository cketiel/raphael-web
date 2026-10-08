import { describe, expect, it } from "vitest";
import { buildProductionCsv, CSV_HEADERS, formatCell, productionReportFileName, toCsvRow } from "./productionReportCsv";
import {
  attachmentProblem, cityForSave, formatUsPhone, isValidDob, localToday, normalizeUsPhone,
  searchCustomers, statusBadgeClass, summarize, toTimeInput,
} from "./rules";
import type { TripRead } from "./types";

const trip = (status: string, isCancelled = false) => ({ status, isCancelled }) as TripRead;

describe("production report CSV (parity with Booking Web app.js:222-319)", () => {
  it("has the 47 columns in the original order", () => {
    expect(CSV_HEADERS).toHaveLength(47);
    expect(CSV_HEADERS[0]).toBe("Date");
    expect(CSV_HEADERS[8]).toBe("Paid");
    expect(CSV_HEADERS[30]).toBe("Trip Id");
    expect(CSV_HEADERS[46]).toBe("Created");
  });

  it("maps every row to 47 cells", () => {
    expect(toCsvRow({})).toHaveLength(47);
  });

  it("quotes every cell, doubles quotes and flattens line breaks", () => {
    expect(formatCell('Room "A"\r\n2nd floor')).toBe('"Room ""A"" 2nd floor"');
    expect(formatCell(null)).toBe("");
    expect(formatCell(0)).toBe('"0"');
  });

  it("starts with a UTF-8 BOM and an unquoted header row", () => {
    const csv = buildProductionCsv([]);
    expect(csv.startsWith("﻿Date,Req Pickup,Appointment,")).toBe(true);
  });

  it("keeps the original fallbacks: charge 0, booleans Yes/No", () => {
    const row = toCsvRow({ willCall: true, canceled: false, paid: 25 });
    expect(row[7]).toBe(0);
    // Paid is an amount: the original printed "Yes" here and lost it.
    expect(row[8]).toBe(25);
    expect(toCsvRow({})[8]).toBe(0);
    expect(row[23]).toBe("Yes");
    expect(row[24]).toBe("No");
  });

  it("names the file Production_Report_<UTC date>.csv", () => {
    expect(productionReportFileName(new Date("2026-10-06T12:00:00Z"))).toBe("Production_Report_2026-10-06.csv");
  });
});

describe("summary cards", () => {
  it("counts canceled by status or flag and billed as total minus canceled", () => {
    const s = summarize([trip("Canceled"), trip("Cancelled"), trip("Assigned", true), trip("Finished")], [{ charge: 10.5 }, { charge: null }, { charge: 4 }]);
    expect(s).toEqual({ totalTrips: 4, canceledTrips: 3, billedTrips: 1, totalBilledValue: "$14.50" });
  });
});

describe("status badges", () => {
  it("maps known statuses case-insensitively and falls back to primary blue", () => {
    expect(statusBadgeClass("InProgress")).toContain("#6610f2");
    expect(statusBadgeClass("Waiting")).toContain("text-[#212529]");
    expect(statusBadgeClass("Arrived")).toContain("#0d6efd");
    expect(statusBadgeClass(null)).toContain("#198754");
  });
});

describe("customer smart search", () => {
  const customers = Array.from({ length: 15 }, (_, i) => ({ fullName: `Maria Lopez ${i}`, riderId: `R${i}` }));

  it("needs at least 2 characters", () => {
    expect(searchCustomers(customers, "m")).toEqual([]);
  });

  it("matches name or Rider ID, case-insensitive, at most 10", () => {
    expect(searchCustomers(customers, "LOPEZ")).toHaveLength(10);
    expect(searchCustomers(customers, "r14")).toEqual([{ fullName: "Maria Lopez 14", riderId: "R14" }]);
  });
});

describe("fixes over the original", () => {
  it("searches the client code too, as the placeholder always promised", () => {
    expect(searchCustomers([{ fullName: "Ana", riderId: null, clientCode: "MC-778" }], "mc-7")).toHaveLength(1);
  });

  it("accepts US phones with any punctuation and stores 10 digits", () => {
    expect(normalizeUsPhone("(239) 555-0142")).toBe("2395550142");
    expect(normalizeUsPhone("+1 239.555.0142")).toBe("2395550142");
    expect(normalizeUsPhone("12345")).toBeNull();
    expect(normalizeUsPhone("0864836314")).toBeNull();
    expect(formatUsPhone("2395550142")).toBe("(239) 555-0142");
  });

  it("rejects a date of birth in the future or before 1900", () => {
    expect(isValidDob("1950-03-02", "2026-10-07")).toBe(true);
    expect(isValidDob("2026-10-07", "2026-10-07")).toBe(true);
    expect(isValidDob("2026-10-08", "2026-10-07")).toBe(false);
    expect(isValidDob("1899-12-31", "2026-10-07")).toBe(false);
    expect(isValidDob("", "2026-10-07")).toBe(false);
  });

  it("accepts only Word or PDF attachments up to 10 MB", () => {
    expect(attachmentProblem({ name: "Order.PDF", size: 2_000 })).toBeNull();
    expect(attachmentProblem({ name: "notes.docx", size: 2_000 })).toBeNull();
    expect(attachmentProblem({ name: "photo.jpg", size: 2_000 })).toBe("attachmentType");
    expect(attachmentProblem({ name: "big.pdf", size: 11 * 1024 * 1024 })).toBe("attachmentSize");
    expect(attachmentProblem(null)).toBeNull();
  });

  it("never sends N/A as a city", () => {
    expect(cityForSave("N/A")).toBe("");
    expect(cityForSave("Fort Myers")).toBe("Fort Myers");
  });

  it("shows times without seconds", () => {
    expect(toTimeInput("20:50:00")).toBe("20:50");
  });
});

describe("default filter date", () => {
  it("is the local calendar date, not the UTC one", () => {
    // 9 pm in Florida (UTC-4) is already the next day in UTC; the original showed tomorrow.
    const evening = new Date("2026-10-06T21:00:00-04:00");
    const expected = `${evening.getFullYear()}-${String(evening.getMonth() + 1).padStart(2, "0")}-${String(evening.getDate()).padStart(2, "0")}`;
    expect(localToday(evening)).toBe(expected);
  });
});
