import { describe, expect, it } from "vitest";
import { bufferMinutes, liveEtaValues, minutesUntil, type LiveInputs } from "./etaModel";

const at = (h: number, m: number, s = 0) => new Date(2026, 9, 20, h, m, s);
const base = (over: Partial<LiveInputs> = {}): LiveInputs => ({
  position: { atUtc: at(9, 1, 40).toISOString(), phase: "Dropoff", remainingMiles: 3.14 },
  fallbackPhase: "Dropoff", pickupEta: "08:47:00", dropoffEta: "09:14:00", appointment: "09:30:00",
  tripDay: "2026-10-20", legMiles: 5.6, now: at(9, 2), ...over,
});

describe("Live ETA values", () => {
  it("counts whole minutes up to the ETA on the trip's own day", () => {
    expect(minutesUntil("09:14:00", "2026-10-20", at(9, 2))).toBe(12);
    expect(minutesUntil("09:14:00", "2026-10-20", at(9, 2, 10))).toBe(12); // 11 min 50 s rounds up
    expect(minutesUntil(null, "2026-10-20", at(9, 2))).toBeNull();
  });

  it("shows the design's scenario: 12 min, 3.1 mi, 09:14, live", () => {
    const v = liveEtaValues(base());
    expect(v).toMatchObject({ state: "live", phase: "Dropoff", minutes: 12, miles: "3.1", eta: "09:14", ageSeconds: 20 });
  });

  it("uses the pickup ETA while heading to the pickup", () => {
    const v = liveEtaValues(base({ position: { atUtc: at(8, 35).toISOString(), phase: "Pickup", remainingMiles: 1 }, now: at(8, 35) }));
    expect(v.eta).toBe("08:47");
    expect(v.minutes).toBe(12);
  });

  it("is stale after two minutes without a position, and waiting with none", () => {
    expect(liveEtaValues(base({ now: at(9, 5) })).state).toBe("stale");
    expect(liveEtaValues(base({ position: null })).state).toBe("nodata");
  });

  it("says arriving under two minutes, and late when the drop-off ETA passes the appointment", () => {
    expect(liveEtaValues(base({ now: at(9, 13), position: { atUtc: at(9, 12, 50).toISOString(), phase: "Dropoff", remainingMiles: 0.3 } })).state).toBe("arriving");
    const late = liveEtaValues(base({ dropoffEta: "09:38:00" }));
    expect(late.state).toBe("late");
    expect(late.lateBy).toBe("8 MIN");
  });

  it("computes the buffer between the drop-off ETA and the appointment", () => {
    expect(bufferMinutes("09:14:00", "09:30:00")).toBe(16);
    expect(bufferMinutes("09:38:00", "09:30:00")).toBe(-8);
    expect(bufferMinutes(null, "09:30:00")).toBeNull();
  });
});
