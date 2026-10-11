import { describe, expect, it } from "vitest";
import { isExportable, providerCan, toTimeSpan } from "./providerTripRules";

const trip = (over = {}) => ({ status: "Assigned", isCancelled: false, date: "2026-10-11T00:00:00", ...over });

describe("What an external Provider may do", () => {
  it("accepts or rejects a trip given to it, and reports nothing before accepting it", () => {
    expect(providerCan(trip(), "2026-10-11")).toEqual({ accept: true, reject: true, report: false });
  });

  it("reports an accepted trip once its day has come, and may still reject it", () => {
    expect(providerCan(trip({ status: "Accepted" }), "2026-10-11")).toEqual({ accept: false, reject: true, report: true });
    expect(providerCan(trip({ status: "Accepted", date: "2026-10-12T00:00:00" }), "2026-10-11")).toEqual({ accept: false, reject: true, report: false });
  });

  it("does nothing more with a rejected, cancelled or finished trip", () => {
    for (const over of [{ status: "Rejected" }, { isCancelled: true }, { status: "Finished" }]) {
      expect(providerCan(trip(over), "2026-10-11")).toEqual({ accept: false, reject: false, report: false });
    }
  });

  it("exports only what it committed to", () => {
    expect(isExportable({ status: "Assigned" })).toBe(false);
    expect(isExportable({ status: "Rejected" })).toBe(false);
    expect(isExportable({ status: "Accepted" })).toBe(true);
    expect(isExportable({ status: "Finished" })).toBe(true);
  });

  it("sends times as the backend reads them", () => {
    expect(toTimeSpan("08:40")).toBe("08:40:00");
    expect(toTimeSpan("")).toBeNull();
  });
});
