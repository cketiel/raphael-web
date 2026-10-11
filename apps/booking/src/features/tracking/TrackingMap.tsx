"use client";

import { Map, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { useTranslations } from "next-intl";
import { memo, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { PhCircleNotch, PhCrosshair, PhMinus, PhPlus, PhTextAa, PhVan } from "@/components/ui/Icon";
import { ReportMapLoad, type LatLng } from "@/features/maps/TripMap";
import { currentTheme, subscribeTheme } from "@/lib/theme";
import { splitAtVehicle } from "./routeSplit";

const MONO = "font-[family-name:var(--font-plex-mono)]";
const MAP_ID = "trip-tracking";

/**
 * The route's colours by theme (design: Trip Tracking, L and D tables). Google draws the line on its
 * own canvas, so it needs real colours, not CSS variables.
 */
const ROUTE = {
  light: { line: "#0b6f96", halo: "rgba(11,111,150,.18)" },
  dark: { line: "#6ec3e0", halo: "rgba(110,195,224,.2)" },
  // On the satellite photo a pale halo vanishes: a bright line over a dark one.
  satellite: { line: "#5fd4ff", halo: "rgba(4,24,34,.75)" },
};

/** Google's own labels and icons off: only ours are on the map unless the user asks for Google's. */
const NO_LABELS: google.maps.MapTypeStyle[] = [
  { elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
];

/** Harbor night for the road map: Google's night palette, toned to the design's ocean blues. */
const NIGHT: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0c1f29" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#a8c0cc" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a1a23" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#173947" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0a1a23" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#22495b" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#102a38" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#10262f" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0f2a26" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#13303d" }] },
];

function useTheme(): "light" | "dark" {
  return useSyncExternalStore(subscribeTheme, currentTheme, () => "light");
}

export interface VehicleOnMap {
  position: LatLng;
  /** When the fix was taken: the move to it lasts as long as the real gap between two fixes. */
  atUtc: string;
  label: string;
  detail: string;
  /** Heading to the drop-off: the road behind it is drawn solid, the rest dashed. */
  onBoard: boolean;
}

/**
 * Something of ours on the map, drawn in the map's own overlay layer so it moves with the map.
 * Used instead of Advanced Markers because those need a cloud map id, and a map id switches off the
 * styles that hide Google's labels.
 */
function Overlay({ position, zIndex, children }: { position: LatLng; zIndex: number; children: ReactNode }) {
  const map = useMap(MAP_ID);
  const [box] = useState(() => (typeof document === "undefined" ? null : document.createElement("div")));
  const overlay = useRef<google.maps.OverlayView | null>(null);
  const at = useRef(position);

  useEffect(() => {
    at.current = position;
    overlay.current?.draw();
  }, [position]);

  useEffect(() => {
    if (!map || !box) return;
    class Layer extends google.maps.OverlayView {
      onAdd() { this.getPanes()?.floatPane.appendChild(box!); }
      draw() {
        const p = this.getProjection()?.fromLatLngToDivPixel(at.current);
        if (!p) return;
        box!.style.cssText = `position:absolute;left:${p.x}px;top:${p.y}px;z-index:${zIndex}`;
      }
      onRemove() { box!.remove(); }
    }
    const layer = new Layer();
    layer.setMap(map);
    overlay.current = layer;
    return () => { layer.setMap(null); overlay.current = null; };
  }, [map, box, zIndex]);

  return box ? createPortal(children, box) : null;
}

/** The road: solid behind the vehicle, dashed ahead of it, over a soft halo. Without a vehicle, solid. */
function RouteLine({ encoded, theme, vehicle }: { encoded: string | null; theme: keyof typeof ROUTE; vehicle: { at: LatLng; onBoard: boolean } | null }) {
  const map = useMap(MAP_ID);
  const geometry = useMapsLibrary("geometry");
  const lat = vehicle?.at.lat;
  const lng = vehicle?.at.lng;
  const onBoard = vehicle?.onBoard;

  useEffect(() => {
    if (!map || !geometry || !encoded) return;
    const path = geometry.encoding.decodePath(encoded).map((p) => ({ lat: p.lat(), lng: p.lng() }));
    const c = ROUTE[theme];
    // Before the pickup nothing of this road is behind: all of it is still to go.
    const { done, ahead } = lat === undefined || lng === undefined
      ? { done: path, ahead: [] }
      : onBoard ? splitAtVehicle(path, { lat, lng }) : { done: [], ahead: path };
    const dash = { path: "M 0,-1 0,1", strokeOpacity: 1, strokeColor: c.line, scale: 3 };
    const drawn: google.maps.Polyline[] = [new google.maps.Polyline({ path, map, strokeColor: c.halo, strokeOpacity: 1, strokeWeight: 13, zIndex: 1 })];
    if (done.length > 1) drawn.push(new google.maps.Polyline({ path: done, map, strokeColor: c.line, strokeOpacity: 1, strokeWeight: 5, zIndex: 2 }));
    if (ahead.length > 1) drawn.push(new google.maps.Polyline({ path: ahead, map, strokeOpacity: 0, zIndex: 2, icons: [{ icon: dash, offset: "0", repeat: "14px" }] }));
    return () => drawn.forEach((l) => l.setMap(null));
  }, [map, geometry, encoded, theme, lat, lng, onBoard]);

  return null;
}

/** Frames the trip's two stops once, and again whenever "show the whole trip" is pressed. */
function Framer({ points, version }: { points: LatLng[]; version: number }) {
  const map = useMap(MAP_ID);
  const framed = useRef(-1);
  useEffect(() => {
    if (!map || points.length === 0 || framed.current === version) return;
    framed.current = version;
    if (points.length === 1) { map.setCenter(points[0]); map.setZoom(14); return; }
    const bounds = new google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, 80);
  }, [map, points, version]);
  return null;
}

/**
 * The vehicle glides from one fix to the next over the real time between them, as the Desktop's
 * Schedule map does: a fixed step would make it sprint when a report arrives late. Movement under
 * ~11 m is GPS noise and is not animated.
 */
function useGlide(target: LatLng | null, atUtc: string | null) {
  const [shown, setShown] = useState<LatLng | null>(target);
  const from = useRef<LatLng | null>(target);
  const lastAt = useRef<number | null>(atUtc ? Date.parse(atUtc) : null);
  const lat = target?.lat;
  const lng = target?.lng;

  useEffect(() => {
    // Every update of what is drawn happens in an animation frame, never in the effect itself.
    let frame = 0;
    const start = from.current;
    if (lat === undefined || lng === undefined) {
      from.current = null;
      frame = requestAnimationFrame(() => setShown(null));
      return () => cancelAnimationFrame(frame);
    }
    const to = { lat, lng };
    const at = atUtc ? Date.parse(atUtc) : Date.now();
    const gap = lastAt.current ? at - lastAt.current : 0;
    lastAt.current = at;
    const jump = !start || (Math.abs(start.lat - lat) < 0.0001 && Math.abs(start.lng - lng) < 0.0001);
    const duration = jump ? 0 : Math.min(35_000, Math.max(3_000, gap || 30_000));
    const began = performance.now();
    const step = (now: number) => {
      const k = duration === 0 ? 1 : Math.min(1, (now - began) / duration);
      const p = jump || !start ? to : { lat: start.lat + (lat - start.lat) * k, lng: start.lng + (lng - start.lng) * k };
      from.current = p;
      setShown(p);
      if (k < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [lat, lng, atUtc]);

  return shown;
}

/**
 * A stop: the pin, and under it a solid label in the pin's own colour with a white ring and a
 * shadow. It has to read on any ground: the road map, the satellite and Google's own labels.
 */
function StopMarker({ kind, label }: { kind: "pickup" | "dropoff"; label: string }) {
  const fill = kind === "pickup" ? "#c0392b" : "#0a5c7e";
  return (
    <div className="relative -translate-x-1/2 -translate-y-[38px]">
      <svg width="30" height="38" viewBox="0 0 12 16" aria-hidden="true" className="mx-auto block drop-shadow-[0_2px_3px_rgb(0_0_0/0.45)]">
        <path d="M6 0a6 6 0 0 0-6 6c0 4.4 6 10 6 10s6-5.6 6-10a6 6 0 0 0-6-6z" fill={fill} stroke="#fff" strokeWidth="0.9" />
        <circle cx="6" cy="6" r="2.2" fill="#fff" />
      </svg>
      <span className={`${MONO} absolute left-1/2 top-[44px] -translate-x-1/2 whitespace-nowrap rounded-md px-2.5 py-1 text-[11.5px] font-semibold uppercase tracking-[0.04em] text-white shadow-[0_0_0_2px_#fff,0_6px_14px_rgb(0_0_0/0.35)]`}
        style={{ background: fill }}>{label}</span>
    </div>
  );
}

const MapControls = memo(function MapControls({ satellite, labels, onSatellite, onLabels, onRecenter }: {
  satellite: boolean; labels: boolean; onSatellite: (on: boolean) => void; onLabels: () => void; onRecenter: () => void;
}) {
  const map = useMap(MAP_ID);
  const t = useTranslations("tracking");
  const button = "flex size-11 items-center justify-center rounded-[9px] border border-[var(--ds-outline)] bg-[var(--ds-surface)] text-[var(--ds-on-surface)] shadow-[0_4px_12px_rgb(5_25_35/0.18)] hover:bg-[var(--ds-selected)]";
  return (
    <>
      <div className="absolute right-3.5 top-3.5 flex gap-2">
        <div role="radiogroup" aria-label={t("mapType")} className="flex h-11 rounded-[9px] border border-[var(--ds-outline)] bg-[var(--ds-surface)] p-1 shadow-[0_4px_12px_rgb(5_25_35/0.18)]">
          {([false, true] as const).map((sat) => (
            <button key={String(sat)} type="button" role="radio" aria-checked={satellite === sat} onClick={() => onSatellite(sat)}
              className={`rounded-md px-3 text-[13px] font-semibold ${satellite === sat ? "bg-[var(--ds-primary)] text-[var(--ds-on-primary)]" : "text-[var(--ds-on-surface-variant)] hover:text-[var(--ds-on-surface)]"}`}>
              {sat ? t("satellite") : t("roadmap")}
            </button>
          ))}
        </div>
        <button type="button" aria-pressed={labels} onClick={onLabels} title={labels ? t("hideLabels") : t("showLabels")} aria-label={labels ? t("hideLabels") : t("showLabels")}
          className={`${button} ${labels ? "!bg-[var(--ds-primary-container)] !text-[var(--ds-primary)]" : ""}`}>
          <PhTextAa size={19} aria-hidden />
        </button>
      </div>
      <div className="absolute bottom-3.5 right-3.5 flex flex-col gap-2">
        <button type="button" className={button} aria-label={t("zoomIn")} title={t("zoomIn")} onClick={() => map?.setZoom((map.getZoom() ?? 12) + 1)}><PhPlus size={18} weight="bold" aria-hidden /></button>
        <button type="button" className={button} aria-label={t("zoomOut")} title={t("zoomOut")} onClick={() => map?.setZoom((map.getZoom() ?? 12) - 1)}><PhMinus size={18} weight="bold" aria-hidden /></button>
        <button type="button" className={button} aria-label={t("recenter")} title={t("recenter")} onClick={onRecenter}><PhCrosshair size={18} className="text-[var(--ds-primary)]" aria-hidden /></button>
      </div>
    </>
  );
});

/** Map or satellite, and Google's labels: chosen by the user, remembered in this browser. */
function usePreference(key: string, initial: boolean): [boolean, (v: boolean) => void] {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved === "1" || saved === "0") setValue(saved === "1");
    } catch { /* storage blocked: the default stays */ }
  }, [key]);
  return [value, (v: boolean) => {
    setValue(v);
    try { localStorage.setItem(key, v ? "1" : "0"); } catch { /* not remembered, still applied */ }
  }];
}

export const TrackingMap = memo(function TrackingMap({ pickup, dropoff, polyline, vehicle, pickupLabel, dropoffLabel, note }: {
  pickup: LatLng | null;
  dropoff: LatLng | null;
  polyline: string | null;
  vehicle: VehicleOnMap | null;
  pickupLabel: string;
  dropoffLabel: string;
  note: { text: string; spin?: boolean } | null;
}) {
  const theme = useTheme();
  const [frameVersion, setFrameVersion] = useState(0);
  const [satellite, setSatellite] = usePreference("rb_map_satellite", false);
  const [labels, setLabels] = usePreference("rb_map_labels", false);
  const glided = useGlide(vehicle?.position ?? null, vehicle?.atUtc ?? null);
  const [points] = useState(() => [pickup, dropoff].filter((p): p is LatLng => !!p));

  // Satellite carries its labels in its own type (hybrid); the road map, in its styles.
  const mapTypeId = satellite ? (labels ? "hybrid" : "satellite") : "roadmap";
  const styles = satellite ? undefined : [...(theme === "dark" ? NIGHT : []), ...(labels ? [] : NO_LABELS)];

  return (
    <div className="relative size-full overflow-hidden rounded-xl border border-[var(--ds-outline-variant)] bg-[var(--ds-background)]">
      <Map id={MAP_ID} defaultCenter={pickup ?? { lat: 25.7617, lng: -80.1918 }} defaultZoom={12}
        gestureHandling="greedy" disableDefaultUI clickableIcons={labels} mapTypeId={mapTypeId} styles={styles}>
        <RouteLine encoded={polyline} theme={satellite ? "satellite" : theme} vehicle={vehicle && glided ? { at: glided, onBoard: vehicle.onBoard } : null} />
        <Framer points={points} version={frameVersion} />
        <ReportMapLoad />
      </Map>
      {pickup && <Overlay position={pickup} zIndex={2}><StopMarker kind="pickup" label={pickupLabel} /></Overlay>}
      {dropoff && <Overlay position={dropoff} zIndex={2}><StopMarker kind="dropoff" label={dropoffLabel} /></Overlay>}
      {vehicle && glided && (
        <Overlay position={glided} zIndex={3}>
          {/* A dark bubble: reads on the light map, the night map and the satellite alike. */}
          <div className="flex -translate-x-5 -translate-y-1/2 items-center gap-[9px]">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-white bg-[#6d4ad6] shadow-[0_0_0_6px_rgb(109_74_214/0.3),0_8px_18px_rgb(0_0_0/0.4)]">
              <PhVan size={21} weight="fill" className="text-white" aria-hidden />
            </span>
            <span className="rounded-lg border-l-4 border-[#a98cf7] bg-[#10303f] px-[11px] py-[7px] shadow-[0_0_0_1.5px_rgb(255_255_255/0.85),0_8px_20px_rgb(0_0_0/0.4)]">
              <span className="block whitespace-nowrap text-[12.5px] font-semibold text-white">{vehicle.label}</span>
              <span className={`${MONO} mt-0.5 block whitespace-nowrap text-[10.5px] uppercase text-[#cfe4ef]`}>{vehicle.detail}</span>
            </span>
          </div>
        </Overlay>
      )}
      <MapControls satellite={satellite} labels={labels} onSatellite={setSatellite} onLabels={() => setLabels(!labels)}
        onRecenter={() => setFrameVersion((n) => n + 1)} />
      {note && (
        <div role="status" className="absolute inset-x-3.5 top-[68px] flex items-center gap-[9px] rounded-[9px] border border-[var(--ds-outline-variant)] bg-[var(--ds-surface)] px-[13px] py-[11px] shadow-[0_8px_20px_rgb(5_25_35/0.14)]">
          {note.spin ? <PhCircleNotch size={17} className="shrink-0 animate-spin text-[var(--ds-on-surface-variant)]" aria-hidden />
            : <PhVan size={17} className="shrink-0 text-[var(--ds-on-surface-variant)]" aria-hidden />}
          <span className="text-[13px] text-[var(--ds-on-surface)]">{note.text}</span>
        </div>
      )}
    </div>
  );
});
