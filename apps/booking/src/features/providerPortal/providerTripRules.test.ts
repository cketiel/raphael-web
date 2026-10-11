import { describe, expect, it } from "vitest";
import { providerCan, toTimeSpan } from "./providerTripRules";

const trip = (over = {}) => ({ status: "Accepted", isCancelled: false, providerOutcome: null, date: "2026-10-11T00:00:00", ...over });

describe("What an external Provider may report", () => {
  it("rejects and reports a trip of today that has not started", () => {
    expect(providerCan(trip(), "2026-10-11")).toEqual({ reject: true, report: true });
  });

  it("does not report a trip of a day still to come, but may reject it", () => {
    expect(providerCan(trip({ date: "2026-10-12T00:00:00" }), "2026-10-11")).toEqual({ reject: true, report: false });
  });

  it("does nothing more once a result is in, or the trip is cancelled or finished", () => {
    expect(providerCan(trip({ providerOutcome: "Rejected" }), "2026-10-11")).toEqual({ reject: false, report: false });
    expect(providerCan(trip({ isCancelled: true }), "2026-10-11")).toEqual({ reject: false, report: false });
    expect(providerCan(trip({ status: "Finished" }), "2026-10-11")).toEqual({ reject: false, report: false });
  });

  it("no longer rejects a trip under way, though it can still report it", () => {
    expect(providerCan(trip({ status: "InProgress" }), "2026-10-11")).toEqual({ reject: false, report: true });
  });

  it("sends times as the backend reads them", () => {
    expect(toTimeSpan("08:40")).toBe("08:40:00");
    expect(toTimeSpan("")).toBeNull();
  });
});
