"use client";

import type { Schemas } from "@raphael/api-client";
import { AdvancedMarker, Map, Pin, useMap } from "@vis.gl/react-google-maps";
import { useTranslations } from "next-intl";
import { useEffect, useEffectEvent, useState } from "react";
import { api } from "@/lib/bff";
import { ReportMapLoad, type LatLng } from "@/features/maps/TripMap";
import { useRealtime, type TripVehiclePosition } from "@/features/realtime/RealtimeProvider";

type Tracking = Schemas["TripTrackingDto"];

/** The route's ETAs move when the office re-routes; while the view is open they are read again this often. */
const REFRESH_MS = 60_000;

/** "HH:mm:ss" → "HH:mm". The route's wall-clock hours are shown as they are (TIME_POLICY). */
const hhmm = (value: string | null | undefined) => (value ? value.substring(0, 5) : null);

/** Frames pickup, dropoff and the vehicle, once per change of what is on the map. */
function FitPoints({ points }: { points: LatLng[] }) {
  const map = useMap();
  const key = points.map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join("|");
  useEffect(() => {
    if (!map || points.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, 60);
    // Only when the set of points changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

interface TrackingModalProps {
  tripId: number;
  mapId: string;
  onClose: () => void;
}

/**
 * Read-only tracking of one trip: where it goes, when the route expects it, and the vehicle live
 * while the trip is under way. Outside that window the vehicle is serving other patients, so it is
 * never shown (the server does not send it either).
 */
export function TrackingModal({ tripId, mapId, onClose }: TrackingModalProps) {
  const t = useTranslations("tracking");
  const tStatus = useTranslations("status");
  const tc = useTranslations("common");
  const { watchTrip, onTripStatus } = useRealtime();
  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [failed, setFailed] = useState(false);
  const [vehicle, setVehicle] = useState<LatLng | null>(null);
  const [inProgress, setInProgress] = useState(false);

  async function load() {
    try {
      const data = await api<Tracking>(`BookingPortal/trips/${tripId}/tracking`);
      setTracking(data);
      setInProgress(!!data.inProgress);
      if (!data.inProgress) setVehicle(null);
    } catch {
      setFailed(true);
    }
  }
  const refresh = useEffectEvent(() => void load());

  // The data, then every minute for the ETAs, and again whenever this trip changes status.
  useEffect(() => {
    const first = setTimeout(() => refresh(), 0);
    const timer = setInterval(() => refresh(), REFRESH_MS);
    const unsubscribe = onTripStatus((c) => { if (c.tripId === tripId) refresh(); });
    return () => { clearTimeout(first); clearInterval(timer); unsubscribe(); };
  }, [onTripStatus, tripId]);

  // The vehicle: asked once, then pushed by the server while the trip is under way.
  useEffect(() => {
    let stop: (() => void) | null = null;
    let cancelled = false;
    const onPosition = (p: TripVehiclePosition) => setVehicle({ lat: p.latitude, lng: p.longitude });
    void watchTrip(tripId, onPosition).then(({ result, stop: s }) => {
      if (cancelled) { s(); return; }
      stop = s;
      if (result?.position) onPosition(result.position);
    });
    return () => { cancelled = true; stop?.(); };
  }, [tripId, watchTrip]);

  const pickup = tracking ? { lat: tracking.pickupLatitude ?? 0, lng: tracking.pickupLongitude ?? 0 } : null;
  const dropoff = tracking ? { lat: tracking.dropoffLatitude ?? 0, lng: tracking.dropoffLongitude ?? 0 } : null;
  const points = [pickup, dropoff, inProgress ? vehicle : null].filter((p): p is LatLng => !!p);
  const status = tracking?.status ?? "";
  const statusText = status && tStatus.has(status) ? tStatus(status) : status;

  return (
    <div className="fixed inset-0 z-[1050] flex items-stretch justify-center bg-slate-900/50 sm:items-start sm:overflow-y-auto sm:p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="tracking-title"
        className="flex w-full flex-col bg-surface shadow-2xl sm:my-6 sm:max-w-5xl sm:rounded-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-slate-50 px-4 py-3 sm:rounded-t-2xl sm:px-6 sm:py-4">
          <h2 id="tracking-title" className="text-lg font-bold text-brand">{t("title", { id: tripId })}</h2>
          <button type="button" onClick={onClose} aria-label={tc("close")} className="text-2xl leading-none text-muted hover:text-foreground">×</button>
        </div>

        {failed ? (
          <p className="p-6 text-sm text-red-600">{t("loadFailed")}</p>
        ) : !tracking ? (
          <p className="p-6 text-sm text-muted">{tc("loading")}</p>
        ) : (
          <div className="grid flex-1 gap-4 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[1fr_2fr]">
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-bold uppercase text-muted">{t("status")}</p>
                <p className="mt-1 text-base font-bold">{statusText}</p>
              </div>
              <Stop color="#dc3545" label={t("pickup")} address={tracking.pickupAddress}
                rows={[
                  [t("requested"), hhmm(tracking.requestedPickupTime)],
                  [t("eta"), hhmm(tracking.pickupEta)],
                  [t("arrived"), hhmm(tracking.pickupArrivedAt)],
                  [t("pickedUp"), hhmm(tracking.pickedUpAt)],
                ]} />
              <Stop color="#0d6efd" label={t("dropoff")} address={tracking.dropoffAddress}
                rows={[
                  [t("appointment"), hhmm(tracking.appointmentTime)],
                  [t("eta"), hhmm(tracking.dropoffEta)],
                  [t("arrived"), hhmm(tracking.dropoffArrivedAt)],
                  [t("droppedOff"), hhmm(tracking.droppedOffAt)],
                ]} />
              {!tracking.pickupEta && !tracking.dropoffEta && <p className="text-xs text-muted">{t("notRouted")}</p>}
            </div>

            <div className="flex min-h-[320px] flex-col">
              {!inProgress && (
                <p role="status" className="mb-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  {t("onlyWhileInProgress")}
                </p>
              )}
              {inProgress && !vehicle && (
                <p role="status" className="mb-2 rounded-lg border border-border bg-slate-50 px-3 py-2 text-sm text-muted">{t("waitingPosition")}</p>
              )}
              <div className="h-[55vh] min-h-[320px] w-full overflow-hidden rounded-lg border border-slate-300 lg:h-full">
                <Map mapId={mapId} defaultCenter={pickup ?? { lat: 25.7617, lng: -80.1918 }} defaultZoom={12} gestureHandling="greedy">
                  {pickup && (
                    <AdvancedMarker position={pickup} title={t("pickup")}>
                      <Pin background="#dc3545" borderColor="#842029" glyphColor="#fff" />
                    </AdvancedMarker>
                  )}
                  {dropoff && (
                    <AdvancedMarker position={dropoff} title={t("dropoff")}>
                      <Pin background="#0d6efd" borderColor="#084298" glyphColor="#fff" />
                    </AdvancedMarker>
                  )}
                  {inProgress && vehicle && (
                    <AdvancedMarker position={vehicle} title={t("vehicle")}>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#198754] text-lg shadow-lg" aria-hidden="true">🚐</span>
                    </AdvancedMarker>
                  )}
                  <FitPoints points={points} />
                  <ReportMapLoad />
                </Map>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Stop({ color, label, address, rows }: { color: string; label: string; address: string | null | undefined; rows: [string, string | null][] }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="font-bold"><span style={{ color }}>●</span> {label}</p>
      <p className="mt-1 break-words text-xs text-muted">{address}</p>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted">{k}</dt>
            <dd className="font-semibold">{v ?? "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
