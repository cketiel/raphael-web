"use client";

import { AdvancedMarker, Map, Pin, useMap, useMapsLibrary, type MapMouseEvent } from "@vis.gl/react-google-maps";
import { useEffect } from "react";
import { reportUsage } from "./places";

export interface LatLng {
  lat: number;
  lng: number;
}

/** Draws the encoded polyline the backend returned with the leg (POST /api/routing/legs, includePolyline). */
function RouteLine({ encoded }: { encoded: string | null }) {
  const map = useMap();
  const geometry = useMapsLibrary("geometry");

  useEffect(() => {
    if (!map || !geometry || !encoded) return;
    const path = geometry.encoding.decodePath(encoded);
    const line = new google.maps.Polyline({ path, map, strokeColor: "#0d6efd", strokeWeight: 5, strokeOpacity: 0.6 });
    const bounds = new google.maps.LatLngBounds();
    path.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, 40);
    return () => line.setMap(null);
  }, [map, geometry, encoded]);

  return null;
}

/** Maps already reported. React may run an effect twice for the same map (Strict Mode in development). */
const reportedMaps = new WeakSet<google.maps.Map>();

/** Google bills a Dynamic Maps load per map shown: report exactly one per map, as Desktop does per page. */
function ReportMapLoad() {
  const map = useMap();
  useEffect(() => {
    if (!map || reportedMaps.has(map)) return;
    reportedMaps.add(map);
    reportUsage("DynamicMaps");
  }, [map]);
  return null;
}

/** Keeps the map centred on the pickup when it moves without a route to frame. */
function FollowPickup({ pickup, hasRoute }: { pickup: LatLng; hasRoute: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (map && !hasRoute) map.setCenter(pickup);
  }, [map, pickup, hasRoute]);
  return null;
}

interface TripMapProps {
  mapId: string;
  pickup: LatLng;
  dropoff: LatLng;
  polyline: string | null;
  /** A pin was dropped somewhere new: the caller resolves the address through the backend. */
  onPinMoved: (which: "pickup" | "dropoff", position: LatLng) => void;
}

/**
 * The "Interactive Route Map" of the trip form: pickup pin red, dropoff pin blue, both draggable,
 * as in the original (Booking Web app.js:351-373).
 */
export function TripMap({ mapId, pickup, dropoff, polyline, onPinMoved }: TripMapProps) {
  function dragEnd(which: "pickup" | "dropoff") {
    return (event: google.maps.MapMouseEvent | MapMouseEvent) => {
      const latLng = "latLng" in event ? event.latLng : null;
      if (latLng) onPinMoved(which, { lat: latLng.lat(), lng: latLng.lng() });
    };
  }

  return (
    <div className="h-[380px] w-full overflow-hidden rounded-lg border border-slate-300">
      <Map mapId={mapId} defaultCenter={pickup} defaultZoom={12} gestureHandling="greedy">
        <AdvancedMarker position={pickup} draggable onDragEnd={dragEnd("pickup")} title="Pickup">
          <Pin background="#dc3545" borderColor="#842029" glyphColor="#fff" />
        </AdvancedMarker>
        <AdvancedMarker position={dropoff} draggable onDragEnd={dragEnd("dropoff")} title="Dropoff">
          <Pin background="#0d6efd" borderColor="#084298" glyphColor="#fff" />
        </AdvancedMarker>
        <RouteLine encoded={polyline} />
        <ReportMapLoad />
        <FollowPickup pickup={pickup} hasRoute={!!polyline} />
      </Map>
    </div>
  );
}
