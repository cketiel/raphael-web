"use client";

import type { Schemas } from "@raphael/api-client";
import { AdvancedMarker, Map, Pin, useMap } from "@vis.gl/react-google-maps";
import { useTranslations } from "next-intl";
import { useEffect, useEffectEvent, useState } from "react";
import { IconOnTheWay, IconPin, IconTrack } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { Notice } from "@/components/ui/Surface";
import { StatusBadge } from "@/features/booking/StatusBadge";
import { api } from "@/lib/bff";
import { PIN, ReportMapLoad, type LatLng } from "@/features/maps/TripMap";
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

  return (
    <Modal size="xl" icon={IconTrack} labelledBy="tracking-title" onClose={onClose}
      title={t("title", { id: tripId })}
      subtitle={tracking && <span className="mt-1 inline-flex"><StatusBadge status={status} /></span>}>
      {failed ? (
        <Notice tone="danger">{t("loadFailed")}</Notice>
      ) : !tracking ? (
        <p className="text-sm text-muted">{tc("loading")}</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <div className="space-y-4">
            <Stop tone="pickup" label={t("pickup")} address={tracking.pickupAddress}
              rows={[
                [t("requested"), hhmm(tracking.requestedPickupTime)],
                [t("eta"), hhmm(tracking.pickupEta)],
                [t("arrived"), hhmm(tracking.pickupArrivedAt)],
                [t("pickedUp"), hhmm(tracking.pickedUpAt)],
              ]} />
            <Stop tone="dropoff" label={t("dropoff")} address={tracking.dropoffAddress}
              rows={[
                [t("appointment"), hhmm(tracking.appointmentTime)],
                [t("eta"), hhmm(tracking.dropoffEta)],
                [t("arrived"), hhmm(tracking.dropoffArrivedAt)],
                [t("droppedOff"), hhmm(tracking.droppedOffAt)],
              ]} />
            {!tracking.pickupEta && !tracking.dropoffEta && <p className="text-sm text-muted">{t("notRouted")}</p>}
          </div>

          <div className="flex min-h-[320px] flex-col gap-3">
            {!inProgress && <Notice tone="warning"><span role="status">{t("onlyWhileInProgress")}</span></Notice>}
            {inProgress && !vehicle && <Notice><span role="status">{t("waitingPosition")}</span></Notice>}
            <div className="h-[55vh] min-h-[320px] w-full overflow-hidden rounded-xl border border-border lg:h-full">
              <Map mapId={mapId} defaultCenter={pickup ?? { lat: 25.7617, lng: -80.1918 }} defaultZoom={12} gestureHandling="greedy">
                {pickup && (
                  <AdvancedMarker position={pickup} title={t("pickup")}>
                    <Pin background={PIN.pickup.fill} borderColor={PIN.pickup.border} glyphColor="#fff" />
                  </AdvancedMarker>
                )}
                {dropoff && (
                  <AdvancedMarker position={dropoff} title={t("dropoff")}>
                    <Pin background={PIN.dropoff.fill} borderColor={PIN.dropoff.border} glyphColor="#fff" />
                  </AdvancedMarker>
                )}
                {inProgress && vehicle && (
                  <AdvancedMarker position={vehicle} title={t("vehicle")}>
                    <span className="flex size-10 items-center justify-center rounded-full border-[3px] border-white bg-success text-white shadow-lg" aria-hidden="true">
                      <IconOnTheWay size={18} />
                    </span>
                  </AdvancedMarker>
                )}
                <FitPoints points={points} />
                <ReportMapLoad />
              </Map>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Stop({ tone, label, address, rows }: { tone: "pickup" | "dropoff"; label: string; address: string | null | undefined; rows: [string, string | null][] }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="flex items-center gap-2 font-bold">
        <IconPin size={16} aria-hidden className={tone === "pickup" ? "text-danger" : "text-info"} />
        {label}
      </p>
      <p className="mt-1 break-words text-sm text-muted">{address}</p>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
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
