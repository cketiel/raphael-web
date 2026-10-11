export interface Point {
  lat: number;
  lng: number;
}

/**
 * Splits the road at the vehicle: the part already driven (pickup → vehicle) and the part still to
 * go (vehicle → drop-off). The vehicle is projected onto the nearest segment, so a GPS fix a few
 * metres off the road still cuts it in the right place. A flat projection is exact enough at
 * city scale; the backend measures the miles the same way (RemainingDistance).
 */
export function splitAtVehicle(path: Point[], vehicle: Point): { done: Point[]; ahead: Point[] } {
  if (path.length < 2) return { done: [], ahead: path };

  const cos = Math.cos((vehicle.lat * Math.PI) / 180);
  let best = { dist: Infinity, index: 0, foot: path[0] };

  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const ax = a.lng * cos, ay = a.lat, bx = b.lng * cos, by = b.lat, px = vehicle.lng * cos, py = vehicle.lat;
    const dx = bx - ax, dy = by - ay;
    const len = dx * dx + dy * dy;
    const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len));
    const fx = ax + t * dx, fy = ay + t * dy;
    const dist = (fx - px) ** 2 + (fy - py) ** 2;
    if (dist < best.dist) best = { dist, index: i, foot: { lat: fy, lng: fx / cos } };
  }

  return {
    done: [...path.slice(0, best.index + 1), best.foot],
    ahead: [best.foot, ...path.slice(best.index + 1)],
  };
}
