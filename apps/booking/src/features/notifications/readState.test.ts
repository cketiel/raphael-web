import { describe, expect, it } from "vitest";
import { pruneExpired, readStateKey } from "./readState";
import { asUtc } from "./NotificationsProvider";
import { tripLink } from "./useDescribe";

describe("pruneExpired", () => {
  const now = Date.parse("2026-10-08T12:00:00Z");

  it("drops the marks of notices that have expired", () => {
    expect(pruneExpired({ a: "2026-10-08T11:59:59Z", b: "2026-10-09T00:00:00Z" }, now)).toEqual({ b: "2026-10-09T00:00:00Z" });
  });

  it("keeps a mark whose date cannot be read rather than bringing the notice back as unread", () => {
    expect(pruneExpired({ a: "not a date" }, now)).toEqual({ a: "not a date" });
  });
});

describe("readStateKey", () => {
  it("is per user and safe to use as a storage key", () => {
    expect(readStateKey("42")).toBe("rb_notif_read_42");
    expect(readStateKey("4 2;x")).toBe("rb_notif_read_42x");
  });
});

describe("tripLink", () => {
  const base = { id: "n", businessEventCode: "TRIP_CANCELLED", title: "", message: "", createdAtUtc: "" };

  it("points to the trip and its day", () => {
    expect(tripLink({ ...base, metadata: { TripId: "40108", TripDate: "2026-10-08" } })).toEqual({ tripId: 40108, date: "2026-10-08" });
  });

  it("gives no link without a usable trip or day", () => {
    expect(tripLink({ ...base, metadata: { TripId: "40108" } })).toBeNull();
    expect(tripLink({ ...base, metadata: { TripId: "abc", TripDate: "2026-10-08" } })).toBeNull();
    expect(tripLink({ ...base, metadata: { TripId: "40108", TripDate: "08/10/2026" } })).toBeNull();
    expect(tripLink(base)).toBeNull();
  });
});

describe("asUtc", () => {
  it("reads an instant without a zone as UTC", () => {
    expect(Date.parse(asUtc("2026-10-08T04:36:32.3702061"))).toBe(Date.parse("2026-10-08T04:36:32.370Z"));
  });

  it("leaves an instant that already carries its zone alone", () => {
    expect(asUtc("2026-10-08T04:36:32Z")).toBe("2026-10-08T04:36:32Z");
    expect(asUtc("2026-10-08T00:36:32-04:00")).toBe("2026-10-08T00:36:32-04:00");
  });
});
