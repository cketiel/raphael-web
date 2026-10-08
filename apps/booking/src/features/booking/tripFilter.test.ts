import { describe, expect, it } from "vitest";
import { tripMatches } from "./tripFilter";
import type { TripRead } from "./types";

const trip = {
  id: 40108,
  tripId: "RB-1520",
  date: "2026-10-08T00:00:00",
  customerName: "José García",
  pickupAddress: "123 Main St, Miami, FL",
  dropoffAddress: "500 Brickell Ave, Miami, FL",
  pickupPhone: "(305) 555-1234",
  providerName: "1ST CHOICE MEDICAL TRANSIT",
  status: "Scheduled",
  pickupLatitude: 0,
  pickupLongitude: 0,
  dropoffLatitude: 0,
  dropoffLongitude: 0,
} as TripRead;

const label = (s: string | null | undefined) => (s === "Scheduled" ? "Programado" : s);

describe("tripMatches", () => {
  it("matches everything when nothing is typed", () => {
    expect(tripMatches(trip, "   ", label)).toBe(true);
  });

  it("ignores case and accents", () => {
    expect(tripMatches(trip, "jose garcia", label)).toBe(true);
    expect(tripMatches(trip, "GARCÍA", label)).toBe(true);
  });

  it("needs every word, in any order", () => {
    expect(tripMatches(trip, "brickell garcia", label)).toBe(true);
    expect(tripMatches(trip, "garcia orlando", label)).toBe(false);
  });

  it("finds the trip by its internal number or its own id", () => {
    expect(tripMatches(trip, "40108", label)).toBe(true);
    expect(tripMatches(trip, "rb-1520", label)).toBe(true);
  });

  it("finds a phone whatever its punctuation", () => {
    expect(tripMatches(trip, "3055551234", label)).toBe(true);
    expect(tripMatches(trip, "555-1234", label)).toBe(true);
    expect(tripMatches(trip, "3055559999", label)).toBe(false);
  });

  it("finds the status in the user's language and the provider", () => {
    expect(tripMatches(trip, "programado", label)).toBe(true);
    expect(tripMatches(trip, "choice medical", label)).toBe(true);
  });
});
