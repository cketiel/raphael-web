"use client";

import type { Schemas } from "@raphael/api-client";
import { APIProvider } from "@vis.gl/react-google-maps";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { memo, useCallback, useEffect, useEffectEvent, useMemo, useState } from "react";
import {
  PhArrowClockwise, PhArrowLeft, PhCheckCircle, PhInfo, PhNavigationArrow, PhPhone, PhWarningCircle, PhXCircle,
} from "@/components/ui/Icon";
import { api } from "@/lib/bff";
import { useErrorText } from "@/i18n/useErrorText";
import { formatUsPhone } from "@/features/booking/rules";
import { CancelDialog, ToastBar, type Toast } from "@/features/booking/TripDialogs";
import { LiveSheet, NoData, useIsPhone } from "@/features/booking/TripViews";
import { StatusChip, statusEdge, statusKey } from "@/features/booking/TripStatus";
import { useRealtime, type TripVehiclePosition } from "@/features/realtime/RealtimeProvider";
import { LiveEta, type LiveEtaValues } from "./LiveEta";
import { bufferMinutes, hhmm, liveEtaValues, MPH_PER_MPS } from "./etaModel";
import { TrackingMap } from "./TrackingMap";

type Tracking = Schemas["TripTrackingDto"];
const MONO = "font-[family-name:var(--font-plex-mono)]";
const DONE_STATUSES = ["Finished", "Billed", "Payed"];

/**
 * One trip, followed live (design: Trip Tracking.dc.html). A page of its own, /trips/40233, so it
 * can be linked and opened in another tab; Back returns to the list as it was left.
 * - Left: the live card (Live ETA large, appointment and buffer) or a quiet card when the trip is
 *   not under way, then the route with the four times of each stop.
 * - Right: the map with the road, the two stops and the vehicle gliding between fixes.
 * - Phone: the map full size and the cards in a bottom sheet that is dragged up.
 */
export function TripTrackingPage({ tripId, mapsKey }: { tripId: number; mapsKey: string }) {
  const t = useTranslations("tracking");
  const tDash = useTranslations("dashboard");
  const locale = useLocale();
  const router = useRouter();
  const errorText = useErrorText();
  const phone = useIsPhone();
  const { status: hubStatus, watchTrip, onTripStatus, onTripTracking } = useRealtime();

  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [failed, setFailed] = useState(false);
  const [position, setPosition] = useState<TripVehiclePosition | null>(null);
  const [polyline, setPolyline] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  /** One small request: the trip's header, its places, its times and whether it is under way. */
  const load = useCallback(async () => {
    try {
      const data = await api<Tracking>(`BookingPortal/trips/${tripId}/tracking`);
      setTracking(data);
      setFailed(false);
      if (!data.inProgress) setPosition(null);
    } catch {
      setFailed(true);
    }
  }, [tripId]);
  const refresh = useEffectEvent(() => void load());

  // Read once, then only when the server says something changed: a status change, or new ETAs or
  // routing (TripTrackingChanged). No polling: the page is driven by the server's signals.
  const inProgress = !!tracking?.inProgress;
  useEffect(() => {
    const first = setTimeout(() => refresh(), 0);
    const offStatus = onTripStatus((c) => { if (c.tripId === tripId) refresh(); });
    const offTracking = onTripTracking((id) => { if (id === tripId) refresh(); });
    return () => { clearTimeout(first); offStatus(); offTracking(); };
  }, [onTripStatus, onTripTracking, tripId]);

  // The vehicle: asked once the live channel is up and the trip is under way, then pushed by the
  // server. Asked again after a reconnection, which drops the subscription.
  // Joining the trip's group is what brings its signals, so it is joined whatever its status; the
  // server sends positions only while it is under way.
  useEffect(() => {
    if (hubStatus !== "connected") return;
    let stop: (() => void) | null = null;
    let gone = false;
    void watchTrip(tripId, (p) => setPosition(p)).then(({ result, stop: s }) => {
      if (gone) { s(); return; }
      stop = s;
      if (result?.position) setPosition(result.position);
    });
    return () => { gone = true; stop?.(); };
  }, [inProgress, hubStatus, tripId, watchTrip]);

  // The road, bought once per leg through the backend's cache (MAPS_POLICY: only for a map, priced
  // at the trip's own date and pickup time). Once bought, the backend also measures miles to go on it.
  const legKey = tracking ? `${tracking.pickupLatitude},${tracking.pickupLongitude}|${tracking.dropoffLatitude},${tracking.dropoffLongitude}` : null;
  useEffect(() => {
    if (!tracking || !legKey) return;
    let cancelled = false;
    const body: Schemas["RouteLegsRequestDto"] = {
      legs: [{
        originLat: tracking.pickupLatitude ?? 0, originLng: tracking.pickupLongitude ?? 0,
        destLat: tracking.dropoffLatitude ?? 0, destLng: tracking.dropoffLongitude ?? 0,
        date: (tracking.date ?? "").slice(0, 10) || null,
        departureTime: tracking.requestedPickupTime ?? null,
        includePolyline: true,
      }],
    };
    api<Schemas["RouteLegsResponseDto"]>("routing/legs", { method: "POST", body: JSON.stringify(body) })
      .then((r) => { const leg = r.legs?.[0]; if (!cancelled && leg?.status === "Ok") setPolyline(leg.encodedPolyline ?? null); })
      .catch(() => undefined);
    return () => { cancelled = true; };
    // legKey holds every input that changes the answer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legKey]);

  async function confirmCancel() {
    if (!tracking?.externalTripId) return;
    setCancelling(true);
    try {
      await api("BookingPortal/cancel-multiple", { method: "POST", body: JSON.stringify([tracking.externalTripId]) });
      setToast({ tone: "success", text: tDash("toastCanceled", { count: 1 }) });
      await load();
    } catch (e) {
      setToast({ tone: "error", text: tDash("cancelFailed", { message: errorText(e, tDash("cancelUnavailable")) }) });
    } finally {
      setCancelling(false);
      setAsking(false);
    }
  }

  const back = () => router.push("/");
  const number = tracking?.externalTripId || String(tripId);
  const canceled = !!tracking?.isCancelled;
  const status = tracking?.status ?? null;
  const done = !!status && DONE_STATUSES.includes(status);
  const routed = !!(tracking?.pickupEta || tracking?.dropoffEta);
  const onBoard = position?.phase ? position.phase === "Dropoff" : !!tracking?.pickedUpAt || status === "InProgress";
  const isLive = !!tracking && inProgress && !canceled;
  const etaInputs = tracking && isLive ? {
    position, fallbackPhase: (onBoard ? "Dropoff" : "Pickup") as "Pickup" | "Dropoff",
    pickupEta: position?.pickupEta ?? tracking.pickupEta ?? null,
    dropoffEta: position?.dropoffEta ?? tracking.dropoffEta ?? null,
    appointment: tracking.appointmentTime ?? null,
    tripDay: (tracking.date ?? "").slice(0, 10), legMiles: tracking.distance ?? null,
  } : null;

  // ── header ──
  const provider = tracking?.providerName ?? tDash("providerDefault");
  const meta = [tracking?.spaceTypeName, tracking?.distance ? `${tracking.distance.toFixed(1)} mi` : null, provider].filter(Boolean).join(" · ");
  const phoneNumber = tracking?.pickupPhone ? formatUsPhone(tracking.pickupPhone.replace(/\D/g, "").slice(-10)) : null;
  const header = (
    <div className="flex items-center gap-2.5 border-b border-[var(--ds-outline-variant)] bg-[var(--ds-surface)] px-4 py-3.5 sm:gap-3.5 sm:px-[26px] sm:py-4">
      <button type="button" onClick={back} aria-label={t("back")} title={t("back")}
        className="flex size-11 shrink-0 items-center justify-center rounded-[9px] border border-[var(--ds-outline)] hover:bg-[var(--ds-selected)]">
        <PhArrowLeft size={19} aria-hidden />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="truncate text-base font-semibold tracking-[-0.01em] sm:text-[24px] sm:tracking-[-0.02em]">
            {t("title", { id: number })}{tracking?.customerName ? ` · ${tracking.customerName}` : ""}
          </h1>
          {tracking && <span className="hidden sm:inline-flex"><StatusChip status={status} isCancelled={canceled} /></span>}
        </div>
        {tracking && <div className={`${MONO} mt-1 truncate text-[10.5px] uppercase text-[var(--ds-on-surface-variant)] sm:text-[12.5px]`}>{meta}</div>}
        {tracking && <div className="mt-2.5 sm:hidden"><StatusChip status={status} isCancelled={canceled} /></div>}
      </div>
      {tracking && (
        <div className="flex shrink-0 gap-2.5">
          {phoneNumber
            ? <a href={`tel:${tracking.pickupPhone}`} aria-label={t("call", { phone: phoneNumber })}
              className="flex h-11 items-center gap-2 rounded-lg border border-[var(--ds-outline)] px-3 text-[13.5px] font-semibold text-[var(--ds-on-surface)] hover:bg-[var(--ds-selected)] sm:px-4">
              <PhPhone size={17} aria-hidden /><span className="hidden sm:inline">{phoneNumber}</span>
            </a>
            : <span className="hidden items-center text-[13px] sm:flex"><NoData>{t("noPhone")}</NoData></span>}
          <button type="button" disabled={canceled || done || !tracking.externalTripId} onClick={() => setAsking(true)} aria-label={t("cancelTrip")}
            className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[var(--ds-error)] px-3 text-[13.5px] font-semibold text-[var(--ds-error)] disabled:border-[var(--ds-outline)] disabled:text-[var(--ds-on-surface-variant)] disabled:opacity-45 sm:px-4">
            <PhXCircle size={19} className="sm:hidden" aria-hidden /><span className="hidden sm:inline">{t("cancelTrip")}</span>
          </button>
        </div>
      )}
    </div>
  );

  const errorView = failed && !tracking ? (
      <div className="flex h-full flex-col">
        {header}
        <div className="flex flex-1 items-center justify-center bg-[var(--ds-background)] p-6">
          <div className="w-full max-w-[430px] rounded-xl border border-[var(--ds-outline-variant)] bg-[var(--ds-surface)] px-[26px] py-[30px] text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-[var(--ds-error-container)]"><PhWarningCircle size={28} className="text-[var(--ds-error)]" aria-hidden /></span>
            <div className="mt-4 text-[17px] font-semibold">{t("loadFailed")}</div>
            <div className="mt-2 text-[13.5px] leading-normal text-[var(--ds-on-surface-variant)]">{t("loadFailedText")}</div>
            <button type="button" onClick={() => void load()}
              className="mt-[18px] inline-flex h-11 items-center gap-[9px] rounded-lg bg-[var(--ds-primary)] px-5 text-[13.5px] font-semibold text-[var(--ds-on-primary)]">
              <PhArrowClockwise size={17} aria-hidden />{t("retry")}
            </button>
          </div>
        </div>
      </div>
  ) : null;

  // ── cards ──
  const buffer = bufferMinutes(position?.dropoffEta ?? tracking?.dropoffEta ?? null, tracking?.appointmentTime ?? null);
  const liveCard = (open = true) => etaInputs && (
    <LiveCard inputs={etaInputs} compact={phone && !open} size={phone ? "md" : "lg"} showFooter={!phone || open}
      appointment={hhmm(tracking?.appointmentTime)} buffer={buffer} />
  );

  const quiet = tracking && !isLive ? quietCard() : null;
  function quietCard() {
    const tr = tracking!;
    let title: string, aL: string, aV: string | null, bL: string, bV: string | null, foot: string;
    if (canceled) {
      title = t("quietCanceled"); aL = t("requested"); aV = hhmm(tr.requestedPickupTime); bL = t("appointment"); bV = hhmm(tr.appointmentTime);
      foot = t("quietCanceledFoot");
    } else if (done) {
      title = t("quietFinished"); aL = t("droppedOff"); aV = hhmm(tr.droppedOffAt); bL = t("appointment"); bV = hhmm(tr.appointmentTime);
      foot = t("onlyWhileInProgress");
    } else if (!routed) {
      title = t("quietNotRouted"); aL = t("requestedPickup"); aV = hhmm(tr.requestedPickupTime); bL = t("appointment"); bV = hhmm(tr.appointmentTime);
      foot = t("quietNotRoutedFoot", { provider });
    } else {
      title = t("quietNotStarted"); aL = t("pickupEta"); aV = hhmm(tr.pickupEta); bL = t("appointment"); bV = hhmm(tr.appointmentTime);
      foot = t("onlyWhileInProgress");
    }
    return (
      <div className="shrink-0 rounded-xl border border-[var(--ds-outline-variant)] bg-[var(--ds-subtle)] p-[18px]">
        <div className={`${MONO} flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ds-on-surface-variant)]`}>
          <span className="size-2 rounded-[2px]" style={{ background: statusEdge(statusKey(status, canceled)) }} />{title}
        </div>
        <div className="mt-3.5 flex flex-wrap items-end gap-[18px]">
          <div>
            <div className={`${MONO} text-[10.5px] uppercase tracking-[0.1em] text-[var(--ds-on-surface-variant)]`}>{aL}</div>
            <div className={`${MONO} mt-[5px] text-[28px] font-semibold leading-none`}>{aV ?? "—"}</div>
          </div>
          <div className="pb-0.5">
            <div className={`${MONO} text-[10.5px] uppercase tracking-[0.1em] text-[var(--ds-on-surface-variant)]`}>{bL}</div>
            <div className={`${MONO} mt-[5px] text-[19px] font-semibold leading-none`}>{bV ?? "—"}</div>
          </div>
        </div>
        <div className="mt-3.5 text-[12.5px] leading-normal text-[var(--ds-on-surface-variant)]">{foot}</div>
      </div>
    );
  }

  const current = isLive && position ? (onBoard ? "dropoffEta" : "pickupEta") : null;
  const route = tracking && (
    <div className="shrink-0 rounded-xl border border-[var(--ds-outline-variant)] bg-[var(--ds-surface)] p-[18px]">
      <div className={`${MONO} text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--ds-on-surface-variant)]`}>{t("route")}</div>
      <div className="mt-3.5 flex gap-3">
        <div className="flex w-3.5 shrink-0 flex-col items-center py-[3px]">
          <svg width="14" height="18" viewBox="0 0 12 16" aria-hidden="true"><path d="M6 0a6 6 0 0 0-6 6c0 4.4 6 10 6 10s6-5.6 6-10a6 6 0 0 0-6-6z" fill="var(--ds-pickup)" /><circle cx="6" cy="6" r="2.2" fill="var(--ds-pin-inner)" /></svg>
          <span className="my-1 w-0.5 flex-1 bg-[linear-gradient(180deg,var(--ds-pickup),var(--ds-dropoff))]" />
          <svg width="14" height="18" viewBox="0 0 12 16" aria-hidden="true"><path d="M6 0a6 6 0 0 0-6 6c0 4.4 6 10 6 10s6-5.6 6-10a6 6 0 0 0-6-6z" fill="var(--ds-dropoff)" /><circle cx="6" cy="6" r="2.2" fill="var(--ds-pin-inner)" /></svg>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-[18px]">
          <Stop address={tracking.pickupAddress} place={tracking.pickupPlace ?? null} boxes={[
            { label: t("requested"), value: hhmm(tracking.requestedPickupTime) },
            { label: t("eta"), value: hhmm(position?.pickupEta ?? tracking.pickupEta), current: current === "pickupEta" },
            { label: t("arrived"), value: hhmm(tracking.pickupArrivedAt), done: true },
            { label: t("pickedUp"), value: hhmm(tracking.pickedUpAt), done: true },
          ]} />
          <Stop address={tracking.dropoffAddress} place={tracking.dropoffPlace ?? null} boxes={[
            { label: t("appointment"), value: hhmm(tracking.appointmentTime) },
            { label: t("eta"), value: hhmm(position?.dropoffEta ?? tracking.dropoffEta), current: current === "dropoffEta" },
            { label: t("arrived"), value: hhmm(tracking.dropoffArrivedAt), done: true },
            { label: t("droppedOff"), value: hhmm(tracking.droppedOffAt), done: true },
          ]} />
        </div>
      </div>
      {!routed && !canceled && !done && (
        <div className="mt-4 flex gap-[9px] rounded-[9px] border border-[var(--ds-outline-variant)] bg-[var(--ds-subtle)] px-3 py-[11px]">
          <PhInfo size={16} className="mt-px shrink-0 text-[var(--ds-on-surface-variant)]" aria-hidden />
          <span className="text-[12.5px] leading-[1.45] text-[var(--ds-on-surface-variant)]">{t("notRouted")}</span>
        </div>
      )}
    </div>
  );

  // ── map ──
  const pLat = tracking?.pickupLatitude, pLng = tracking?.pickupLongitude;
  const dLat = tracking?.dropoffLatitude, dLng = tracking?.dropoffLongitude;
  const pickupPoint = useMemo(() => (pLat != null && pLng != null ? { lat: pLat, lng: pLng } : null), [pLat, pLng]);
  const dropoffPoint = useMemo(() => (dLat != null && dLng != null ? { lat: dLat, lng: dLng } : null), [dLat, dLng]);
  const pickedUp = hhmm(tracking?.pickedUpAt);
  const droppedOff = hhmm(tracking?.droppedOffAt);
  const dropEta = hhmm(position?.dropoffEta ?? tracking?.dropoffEta);
  const pickupLabel = canceled ? t("mapPickup", { time: "—" })
    : pickedUp ? t("mapPickup", { time: pickedUp })
      : routed ? t("mapPickupEta", { time: hhmm(position?.pickupEta ?? tracking?.pickupEta) ?? "—" })
        : t("mapPickupReq", { time: hhmm(tracking?.requestedPickupTime) ?? "—" });
  const dropoffLabel = canceled ? t("mapDropoff", { time: "—" })
    : droppedOff ? t("mapDropoff", { time: droppedOff })
      : t("mapDropoffEta", { time: dropEta ?? "—" });
  const vehicleLabel = tracking?.vehicleType ? `${provider} · ${tracking.vehicleType}` : provider;
  const vehicle = useMemo(() => (isLive && position ? {
    position: { lat: position.latitude, lng: position.longitude },
    atUtc: position.atUtc,
    label: vehicleLabel,
    detail: t("vehicleDetail", {
      mph: Math.round(position.speed * MPH_PER_MPS),
      miles: position.remainingMiles != null ? position.remainingMiles.toFixed(1) : "—",
    }),
    onBoard,
  } : null), [isLive, position, vehicleLabel, onBoard, t]);
  const noteKind = !tracking ? null : !inProgress || canceled ? "idle" : !position ? "waiting" : null;
  const note = useMemo(() => (noteKind === "idle" ? { text: t("onlyWhileInProgress") }
    : noteKind === "waiting" ? { text: t("waitingPosition"), spin: true } : null), [noteKind, t]);

  const map = tracking && (
    <APIProvider apiKey={mapsKey} language={locale} region="US">
      <TrackingMap pickup={pickupPoint} dropoff={dropoffPoint} polyline={polyline} vehicle={vehicle}
        pickupLabel={pickupLabel} dropoffLabel={dropoffLabel} note={note} />
    </APIProvider>
  );

  if (errorView) return errorView;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {header}
      {!tracking ? (
        <div className="flex flex-1 items-center justify-center bg-[var(--ds-background)] text-sm text-[var(--ds-on-surface-variant)]">{t("loading")}</div>
      ) : phone ? (
        <div className="relative min-h-0 flex-1 p-0 [&>div>div]:rounded-none">
          <div className="absolute inset-0 pb-[96px]">{map}</div>
          <LiveSheet>
            {(open) => (
              <>
                {liveCard(open)}
                {quiet}
                {open && route}
              </>
            )}
          </LiveSheet>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 gap-[18px] bg-[var(--ds-background)] px-4 pb-[22px] pt-[18px] sm:px-[26px]">
          <div className="flex w-[378px] shrink-0 flex-col gap-3.5 overflow-y-auto overflow-x-hidden pr-3 xl:w-[412px]">
            {liveCard()}
            {quiet}
            {route}
          </div>
          <div className="min-w-0 flex-1">{map}</div>
        </div>
      )}

      {asking && tracking && (
        <CancelDialog lines={[{ number, patient: tracking.customerName ?? "", time: hhmm(tracking.requestedPickupTime) }]} busy={cancelling}
          onKeep={() => setAsking(false)} onConfirm={() => void confirmCancel()} />
      )}
      {toast && <ToastBar toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

interface Box { label: string; value: string | null; current?: boolean; done?: boolean }

/** One stop: its place and address, and its four times in a 2 × 2 grid. */
function Stop({ address, place, boxes }: { address: string | null | undefined; place: string | null; boxes: Box[] }) {
  const parts = (address ?? "").split(",").map((p) => p.trim());
  const street = parts[0] ?? "";
  const city = parts.length > 1 ? parts[1] : "";
  return (
    <div>
      <div className="text-sm font-semibold">{street}</div>
      <div className="mt-0.5 text-[13px] text-[var(--ds-on-surface-variant)]">{[city, place].filter(Boolean).join(" · ")}</div>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        {boxes.map((b) => {
          const has = !!b.value;
          return (
            <div key={b.label} className="rounded-lg px-2.5 py-2"
              style={b.current
                ? { background: "var(--ds-primary-container)", boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--ds-primary) 34%, transparent)" }
                : has ? { background: "var(--ds-subtle)" } : { boxShadow: "inset 0 0 0 1px var(--ds-outline-variant)" }}>
              <div className={`${MONO} flex items-center gap-[5px] text-[9.5px] uppercase tracking-[0.1em]`}
                style={{ color: b.current ? "var(--ds-primary)" : has ? "var(--ds-on-surface-variant)" : "var(--ds-on-surface-variant)" }}>
                {b.current && <PhNavigationArrow size={11} weight="fill" aria-hidden />}{b.label}
              </div>
              <div className="mt-[3px] flex items-center gap-1.5">
                <span className={`${MONO} text-sm font-semibold`}
                  style={{ color: b.current ? "var(--ds-primary)" : has ? "var(--ds-on-surface)" : "var(--ds-on-surface-variant)" }}>{b.value ?? "—"}</span>
                {has && b.done && <PhCheckCircle size={13} weight="fill" className="text-[var(--ds-success)]" aria-hidden />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The dark live card. It owns the one-second clock, so the minutes count down without re-drawing
 * the rest of the page or the map.
 */
const LiveCard = memo(function LiveCard({ inputs, compact, size, showFooter, appointment, buffer }: {
  inputs: Omit<Parameters<typeof liveEtaValues>[0], "now">;
  compact: boolean;
  size: "lg" | "md";
  showFooter: boolean;
  appointment: string | null;
  buffer: number | null;
}) {
  const t = useTranslations("tracking");
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const v: LiveEtaValues = liveEtaValues({ ...inputs, now });
  return (
    <div className="relative shrink-0 rounded-xl text-[#f2f8fb] [background:radial-gradient(circle_at_88%_6%,rgb(129_99_230/0.42),transparent_58%),linear-gradient(170deg,#073d55,#04202d)]"
      style={{ padding: compact ? 11 : 18 }}>
      <LiveEta v={v} size={size} compact={compact} />
      {showFooter && (
        <div className="relative mt-4 flex flex-wrap items-end gap-[18px] border-t border-[rgb(207_228_239/0.22)] pt-3.5">
          <div>
            <div className={`${MONO} text-[11px] uppercase tracking-[0.1em] text-[#cfe4ef]`}>{t("appointment")}</div>
            <div className={`${MONO} mt-[5px] text-[20px] font-semibold leading-none`}>{appointment ?? "—"}</div>
          </div>
          <div className="ml-auto text-right">
            <div className={`${MONO} text-[11px] uppercase tracking-[0.1em] text-[#cfe4ef]`}>{t("buffer")}</div>
            <div className={`${MONO} mt-[5px] text-[20px] font-semibold leading-none ${buffer !== null && buffer < 0 ? "text-[#f7bd81]" : "text-[#8fe0b5]"}`}>
              {buffer === null ? "—" : t("bufferMin", { sign: buffer >= 0 ? "+" : "−", n: Math.abs(buffer) })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
