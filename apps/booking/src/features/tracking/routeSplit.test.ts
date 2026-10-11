import { describe, expect, it } from "vitest";
import { splitAtVehicle } from "./routeSplit";

// A street going north in three points.
const path = [{ lat: 25.77, lng: -80.2 }, { lat: 25.7745, lng: -80.2 }, { lat: 25.779, lng: -80.2 }];

describe("splitAtVehicle", () => {
  it("cuts the road at the vehicle: driven behind, still to go ahead", () => {
    const { done, ahead } = splitAtVehicle(path, { lat: 25.776, lng: -80.2 });
    expect(done).toHaveLength(3);
    expect(done[2].lat).toBeCloseTo(25.776, 6);
    expect(ahead).toHaveLength(2);
    expect(ahead[0].lat).toBeCloseTo(25.776, 6);
    expect(ahead[1]).toEqual(path[2]);
  });

  it("projects a fix that is a little off the road onto it", () => {
    const { done } = splitAtVehicle(path, { lat: 25.772, lng: -80.1996 });
    expect(done[done.length - 1].lng).toBeCloseTo(-80.2, 6);
    expect(done[done.length - 1].lat).toBeCloseTo(25.772, 6);
  });

  it("at the pickup nothing is behind, at the drop-off nothing is ahead", () => {
    expect(splitAtVehicle(path, path[0]).done.length).toBeLessThanOrEqual(2);
    expect(splitAtVehicle(path, path[2]).ahead.length).toBeLessThanOrEqual(2);
  });
});
