import { describe, expect, it } from "vitest";
import { ageOn, buildTripsCsv, safeRideDateTime, splitAddress, toTripsCsvRow, TRIPS_CSV_HEADERS, tripsCsvFileName } from "./tripsCsv";
import type { TripRead } from "./types";

const trip = (over: Partial<TripRead> = {}): TripRead => ({
  id: 1, date: "2026-10-09T00:00:00", created: "2026-10-01T00:00:00Z",
  pickupLatitude: 0, pickupLongitude: 0, dropoffLatitude: 0, dropoffLongitude: 0,
  fromTime: "08:45:00", toTime: "09:30:00", customerId: 7, customerName: "Luis Fernández",
  pickupAddress: "455 NW 42nd Ave, Miami, FL 33126, USA", dropoffAddress: "1840 NW 7th Ave, Miami, FL 33136, USA",
  pickup: "Home", dropoff: "Sunrise Dialysis Center", status: "InProgress", tripId: "40233",
  spaceTypeName: "WCH", distance: 5.6, fundingSourceName: "Saferide", type: "Appointment",
  ...over,
});

describe("trips CSV (SafeRide2)", () => {
  it("has the 31 columns of the SafeRide2 file, in its order", () => {
    expect(TRIPS_CSV_HEADERS).toHaveLength(31);
    expect(TRIPS_CSV_HEADERS[0]).toBe("MediRoutesClient");
    expect(TRIPS_CSV_HEADERS[30]).toBe("ClaimNote");
    expect(toTripsCsvRow(trip(), undefined, "Demo Clinic")).toHaveLength(31);
  });

  it("writes dates as the Desktop parses them, MM-dd-yyyy HH:mm", () => {
    expect(safeRideDateTime("2026-10-09", "08:45:00")).toBe("10-09-2026 08:45");
  });

  it("never leaves PickUpTime empty: a trip with no time goes at 23:59, as SafeRide's will-calls", () => {
    const row = toTripsCsvRow(trip({ fromTime: null, toTime: null, willCall: true }), undefined, "X");
    expect(row[1]).toBe("10-09-2026 23:59");
    expect(row[3]).toBe("WillCall");
    expect(row[21]).toBe("");
  });

  it("splits a Google address into street, city, state and zip", () => {
    expect(splitAddress("1547 N Tamiami Trl apt 12, North Fort Myers, FL 33903, USA"))
      .toEqual({ street: "1547 N Tamiami Trl apt 12", city: "North Fort Myers", state: "FL", zip: "33903" });
  });

  it("keeps an address it cannot split whole, with the trip's city", () => {
    expect(splitAddress("Somewhere without commas", "Miami")).toEqual({ street: "Somewhere without commas", city: "Miami", state: "", zip: "" });
  });

  it("puts each stop's parts in its own columns, drop-off in the file's reversed order", () => {
    const row = toTripsCsvRow(trip(), { riderId: "R-7", dob: "1950-10-10" }, "Demo Clinic");
    expect(row.slice(9, 13)).toEqual(["455 NW 42nd Ave", "Miami", "FL", "33126"]);
    expect(row.slice(15, 19)).toEqual(["33136", "FL", "Miami", "1840 NW 7th Ave"]);
    expect(row[5]).toBe("R-7");
    expect(row[6]).toBe("75"); // turns 76 the day after the trip
    expect(row[29]).toBe("Saferide");
  });

  it("marks a return leg as B and a canceled trip as Canceled", () => {
    const row = toTripsCsvRow(trip({ type: "Return", isCancelled: true, status: "Scheduled" }), undefined, "X");
    expect(row[7]).toBe("B");
    expect(row[3]).toBe("Canceled");
  });

  it("starts with a BOM and an unquoted header row", () => {
    const csv = buildTripsCsv([trip()], new Map(), "Demo Clinic");
    expect(csv.startsWith("﻿MediRoutesClient,PickUpTime,")).toBe(true);
    expect(csv.split("\n")[1].startsWith('"Demo Clinic","10-09-2026 08:45","Home","InProgress","Luis Fernández"')).toBe(true);
  });

  it("names the file with the range", () => {
    expect(tripsCsvFileName("2026-10-01", "2026-10-09")).toBe("raphael-trips_2026-10-01_2026-10-09.csv");
    expect(tripsCsvFileName("2026-10-09", "2026-10-09")).toBe("raphael-trips_2026-10-09.csv");
  });

  it("computes the age on the trip's day", () => {
    expect(ageOn("1950-10-09", "2026-10-09")).toBe("76");
    expect(ageOn(null, "2026-10-09")).toBe("");
  });
});
