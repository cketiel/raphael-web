"use client";

import type { Schemas } from "@raphael/api-client";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore, type PointerEvent, type ReactNode } from "react";
import {
  PhCalendarX, PhCircleNotch, PhClockCountdown, PhCrosshair, PhDotsThree, PhPencilSimple, PhWifiSlash, PhX,
} from "@/components/ui/Icon";
import { Menu } from "@/components/ui/Menu";
import { api } from "@/lib/bff";
import { useRealtime, type TripVehiclePosition } from "@/features/realtime/RealtimeProvider";
import { LiveEtaTicker } from "@/features/tracking/LiveEtaTicker";
import type { TripLine } from "./tripLines";
import { StatusChip, statusEdge, statusRing } from "./TripStatus";

const MONO = "font-[family-name:var(--font-plex-mono)]";
/** The table's columns (Design System §3): check, time, patient, route, status, provider, actions. */
const GRID = "grid-cols-[44px_104px_minmax(0,1.15fr)_minmax(0,2.53fr)_124px_128px_152px]";

/** Something the design draws and nothing feeds yet: red, so it is seen and settled one by one. */
export function NoData({ children }: { children: ReactNode }) {
  return <span className="font-semibold text-red-600">{children}</span>;
}

export interface TripActions {
  selected: Set<string>;
  /** Trips under way, followed live (useLiveTrips): absent = not under way, null = no position yet. */
  live: Map<number, TripVehiclePosition | null>;
  highlightId: number | null;
  toggle: (line: TripLine) => void;
  track: (line: TripLine) => void;
  edit: (line: TripLine) => void;
  cancel: (line: TripLine) => void;
  rowRef: (layout: string, id: number) => (el: HTMLElement | null) => void;
}

/** The map pin of the design: red for pickup, deep blue for drop-off. */
function Pin({ kind }: { kind: "pickup" | "dropoff" }) {
  return (
    <svg width="12" height="15" viewBox="0 0 12 16" aria-hidden="true" className="shrink-0">
      <path d="M6 0a6 6 0 0 0-6 6c0 4.4 6 10 6 10s6-5.6 6-10a6 6 0 0 0-6-6z" fill={`var(--ds-${kind})`} />
      <circle cx="6" cy="6" r="2.2" fill="var(--ds-pin-inner)" />
    </svg>
  );
}

function Stop({ stop, truncate }: { stop: TripLine["from"]; truncate?: boolean }) {
  const t = useTranslations("dashboard");
  return (
    <div className={`text-[13px] leading-[1.35] text-[var(--ds-on-surface-variant)] ${truncate ? "truncate" : ""}`}>
      {stop.place
        ? <b className="font-semibold text-[var(--ds-on-surface)]">{stop.place}</b>
        : <NoData>{t("noPlaceName")}</NoData>}
      {" · "}{stop.address}
    </div>
  );
}

/** Two stops, each with its pin. `joined` draws the line between the pins, as the timeline does. */
function Route({ line, joined }: { line: TripLine; joined?: boolean }) {
  if (joined) {
    return (
      <div className="flex gap-2.5">
        <div className="flex w-3 shrink-0 flex-col items-center py-0.5">
          <Pin kind="pickup" />
          <span className="my-[3px] w-0.5 flex-1 bg-[linear-gradient(180deg,var(--ds-pickup),var(--ds-dropoff))]" />
          <Pin kind="dropoff" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5"><Stop stop={line.from} /><Stop stop={line.to} /></div>
      </div>
    );
  }
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex min-w-0 gap-[9px]"><Pin kind="pickup" /><Stop stop={line.from} truncate /></div>
      <div className="flex min-w-0 gap-[9px]"><Pin kind="dropoff" /><Stop stop={line.to} truncate /></div>
    </div>
  );
}

/** "#40235 · AMB · 3.9 mi", and the provider after it when asked. */
function Meta({ line, withProvider }: { line: TripLine; withProvider?: boolean }) {
  const t = useTranslations("dashboard");
  return (
    <div className={`${MONO} mt-0.5 text-xs text-[var(--ds-on-surface-variant)]`}>
      #{line.number} · {line.space ?? <NoData>{t("noSpace")}</NoData>} · {line.miles ?? <NoData>{t("noMiles")}</NoData>}
      {withProvider && <> · {line.provider ?? t("providerDefault")}</>}
    </div>
  );
}

function Checkbox({ checked, label, onChange, disabled }: { checked: boolean; label: string; onChange: () => void; disabled?: boolean }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} aria-label={label} disabled={disabled} onClick={onChange}
      className={`flex size-[18px] items-center justify-center rounded border-[1.5px] disabled:opacity-40 ${checked
        ? "border-[var(--ds-primary)] bg-[var(--ds-primary)]" : "border-[var(--ds-outline)] bg-transparent"}`}>
      {checked && <svg width="11" height="11" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="var(--ds-on-primary)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
    </button>
  );
}

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled}
      className="flex size-11 shrink-0 items-center justify-center rounded-[9px] border border-[var(--ds-outline)] hover:bg-[var(--ds-selected)] disabled:pointer-events-none disabled:border-[var(--ds-outline-variant)] disabled:bg-[var(--ds-subtle)] disabled:opacity-45">
      {children}
    </button>
  );
}

/**
 * Track, edit, cancel. A canceled trip keeps its place in the list with the three off: Booking never
 * reactivates a trip (INTEGRATION_API_SPEC: integrators do not, and are not let to).
 */
function Actions({ line, a, vertical }: { line: TripLine; a: TripActions; vertical?: boolean }) {
  const t = useTranslations("dashboard");
  const off = line.canceled;
  return (
    <div className={`flex gap-2 ${vertical ? "flex-col" : "justify-end"}`}>
      <IconButton label={t("trackTrip")} disabled={off} onClick={() => a.track(line)}><PhCrosshair size={18} className="text-[var(--ds-primary)]" aria-hidden /></IconButton>
      <IconButton label={t("editTrip")} disabled={off} onClick={() => a.edit(line)}><PhPencilSimple size={18} className="text-[var(--ds-on-surface-variant)]" aria-hidden /></IconButton>
      <IconButton label={t("cancelTrip")} disabled={off} onClick={() => a.cancel(line)}><PhX size={18} className="text-[var(--ds-error)]" aria-hidden /></IconButton>
    </div>
  );
}

/** On a phone there is room for one wide action: Track, and the rest behind "More". */
function PhoneActions({ line, a }: { line: TripLine; a: TripActions }) {
  const t = useTranslations("dashboard");
  return (
    <div className="mt-3 flex gap-2">
      <button type="button" disabled={line.canceled} onClick={() => a.track(line)}
        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--ds-outline)] text-[13.5px] font-semibold text-[var(--ds-primary)] disabled:opacity-45">
        <PhCrosshair size={18} aria-hidden />{t("track")}
      </button>
      {!line.canceled && (
        <Menu look="ds" width={200} label={t("more")}
          buttonClassName="flex size-11 items-center justify-center rounded-[9px] border border-[var(--ds-outline)] text-[var(--ds-on-surface-variant)]"
          trigger={<PhDotsThree size={18} aria-hidden />}
          items={[
            { key: "edit", label: t("editTrip"), icon: PhPencilSimple, onSelect: () => a.edit(line) },
            { key: "cancel", label: t("cancelTrip"), icon: PhX, danger: true, onSelect: () => a.cancel(line) },
          ]} />
      )}
    </div>
  );
}

/** The time column: pickup big, appointment under it, and the day when the range spans several. */
function TimeCell({ line, showDay, big }: { line: TripLine; showDay: boolean; big?: boolean }) {
  const t = useTranslations("dashboard");
  const format = useFormatter();
  return (
    <div className={MONO}>
      <div className={`font-semibold leading-none text-[var(--ds-on-surface)] ${big ? "text-[17px]" : "text-[15px]"}`}>{line.time ?? "—"}</div>
      <div className={`mt-1 whitespace-nowrap text-[var(--ds-on-surface-variant)] ${big ? "text-[11px]" : "text-xs"}`}>{t("appt", { time: line.appt ?? "—" })}</div>
      {showDay && <div className="mt-0.5 text-[11px] uppercase text-[var(--ds-on-surface-variant)]">{format.dateTime(new Date(`${line.day}T12:00:00`), { day: "2-digit", month: "short" })}</div>}
    </div>
  );
}

/** Table: one row per trip, with its status as a 6 px edge and a label. */
export function TableView({ lines, a, multiDay, allChecked, onToggleAll, footer }: {
  lines: TripLine[]; a: TripActions; multiDay: boolean; allChecked: boolean; onToggleAll: () => void; footer: ReactNode;
}) {
  const t = useTranslations("dashboard");
  const head = `${MONO} text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--ds-on-surface-variant)]`;
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--ds-surface)]">
      <div className={`sticky top-0 z-10 hidden h-[38px] shrink-0 items-center border-b-[1.5px] border-[var(--ds-rule)] bg-[var(--ds-surface)] px-[26px] lg:grid ${GRID} ${head}`}>
        <div><Checkbox checked={allChecked} label={t("selectAll")} onChange={onToggleAll} disabled={lines.length === 0} /></div>
        <div>{t("colTime")}</div><div>{t("colPatient")}</div><div>{t("colRoute")}</div><div>{t("colStatus")}</div><div>{t("colProvider")}</div>
        <div className="text-right">{t("colActions")}</div>
      </div>
      <div>
        {lines.map((line) => {
          const sel = a.selected.has(line.trip.tripId ?? "");
          const hl = a.highlightId === line.trip.id;
          return (
            <div key={line.trip.id}>
              {/* Wide screens: the row */}
              <div ref={a.rowRef("row", line.trip.id)}
                className={`relative hidden items-center border-b border-[var(--ds-outline-variant)] px-[26px] py-2.5 lg:grid ${GRID} ${sel || hl ? "bg-[var(--ds-selected)]" : ""} ${hl ? "shadow-[inset_0_0_0_2px_var(--ds-primary)]" : ""}`}>
                <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5" style={{ background: statusEdge(line.key) }} />
                <div className="flex h-11 items-center">
                  <Checkbox checked={sel} label={t("selectTrip", { id: line.number })} onChange={() => a.toggle(line)} disabled={line.canceled} />
                </div>
                <TimeCell line={line} showDay={multiDay} />
                <div className="min-w-0 pr-3">
                  <div className="truncate text-sm font-semibold">{line.patient}</div>
                  <Meta line={line} />
                </div>
                <div className="min-w-0 pr-4"><Route line={line} /></div>
                <div className="flex flex-col items-start gap-1.5">
                  <StatusChip status={line.trip.status} isCancelled={line.canceled} />
                  {a.live.has(line.trip.id) && <LiveEtaTicker trip={line.trip} position={a.live.get(line.trip.id) ?? null} size="inline" />}
                </div>
                <div className="pr-3 text-[13px] leading-[1.35] text-[var(--ds-on-surface-variant)]">{line.provider ?? t("providerDefault")}</div>
                <Actions line={line} a={a} />
              </div>
              {/* Phones and tablets: the card */}
              <PhoneCard line={line} a={a} sel={sel} hl={hl} multiDay={multiDay} />
            </div>
          );
        })}
      </div>
      {footer}
    </div>
  );
}

function PhoneCard({ line, a, sel, hl, multiDay }: { line: TripLine; a: TripActions; sel: boolean; hl: boolean; multiDay: boolean }) {
  const t = useTranslations("dashboard");
  return (
    <div ref={a.rowRef("card", line.trip.id)}
      className={`relative mx-4 my-2.5 rounded-[9px] border bg-[var(--ds-surface)] py-3 pl-4 pr-3 lg:hidden ${hl ? "border-[var(--ds-primary)]" : "border-[var(--ds-outline-variant)]"} ${sel ? "bg-[var(--ds-selected)]" : ""}`}
      style={{ boxShadow: `inset 4px 0 0 ${statusEdge(line.key)}` }}>
      <div className="flex items-start gap-3">
        <div className="pt-0.5"><Checkbox checked={sel} label={t("selectTrip", { id: line.number })} onChange={() => a.toggle(line)} disabled={line.canceled} /></div>
        <TimeCell line={line} showDay={multiDay} big />
        <div className="ml-auto"><StatusChip status={line.trip.status} isCancelled={line.canceled} /></div>
      </div>
      {a.live.has(line.trip.id) && <div className="mt-2"><LiveEtaTicker trip={line.trip} position={a.live.get(line.trip.id) ?? null} size="inline" /></div>}
      <div className="mt-2.5 text-sm font-semibold">{line.patient}</div>
      <Meta line={line} withProvider />
      <div className="mt-2.5"><Route line={line} joined /></div>
      <PhoneActions line={line} a={a} />
    </div>
  );
}

/** The red line of the present moment: between the last trip already due and the next one. */
function NowMarker({ time }: { time: string }) {
  const t = useTranslations("dashboard");
  return (
    <div className="mb-4 mt-2 flex items-center gap-3 sm:pl-[86px]" role="separator" aria-label={t("now", { time })}>
      <span className={`${MONO} text-[12.5px] font-bold uppercase tracking-[0.14em] text-[var(--ds-now-ink)]`}>{t("now", { time })}</span>
      <span className="h-px flex-1 bg-[linear-gradient(90deg,var(--ds-now-line),transparent)]" />
    </div>
  );
}

/**
 * Timeline: the day as a line of time, the trips as cards hanging from it, and NOW between the past
 * and what is still coming. `nowIndex` is where NOW goes (-1: the range does not include today).
 */
export function TimelineView({ lines, a, multiDay, nowIndex, nowTime, aside, peek, footer }: {
  lines: TripLine[]; a: TripActions; multiDay: boolean; nowIndex: number; nowTime: string; aside: ReactNode;
  /** What the phone's closed sheet shows: the trip under way's Live ETA, compact. */
  peek?: ReactNode;
  footer: ReactNode;
}) {
  const t = useTranslations("dashboard");
  const format = useFormatter();
  // Below 768 px the live panels ride in a bottom sheet; mounted once, so the tracking is read once.
  const phone = useIsPhone();
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[18px] bg-[var(--ds-background)] px-4 pb-5 pt-4 sm:px-[26px] xl:flex-row">
      <div className={`order-2 min-w-0 flex-1 xl:order-1 ${phone ? "pb-[110px]" : ""}`}>
        {lines.map((line, i) => {
          const sel = a.selected.has(line.trip.tripId ?? "");
          const hl = a.highlightId === line.trip.id;
          const newDay = multiDay && (i === 0 || lines[i - 1].day !== line.day);
          return (
            <div key={line.trip.id}>
              {newDay && (
                <div className={`${MONO} mb-2 mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ds-on-surface-variant)] sm:pl-[86px]`}>
                  {format.dateTime(new Date(`${line.day}T12:00:00`), { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
                </div>
              )}
              {i === nowIndex && <NowMarker time={nowTime} />}
              <div className="mb-2.5 flex items-stretch gap-3.5">
                <div className="hidden w-[72px] shrink-0 pt-4 text-right sm:block"><TimeCell line={line} showDay={false} big /></div>
                <div className="relative hidden w-[17px] shrink-0 justify-center sm:flex">
                  <span className="absolute -bottom-2.5 top-0 w-0.5 bg-[var(--ds-outline-variant)]" />
                  <span className="relative mt-[18px] size-3 rounded-full bg-[var(--ds-background)]" style={{ boxShadow: `0 0 0 3px ${statusRing(line.key)}` }} />
                </div>
                <div ref={a.rowRef("tl", line.trip.id)}
                  className={`flex min-w-0 flex-1 items-start gap-3.5 rounded-[9px] border px-4 py-3 ${hl || sel ? "border-[var(--ds-primary)]" : "border-[var(--ds-outline-variant)]"} ${sel ? "bg-[var(--ds-selected)]" : line.past ? "bg-[var(--ds-subtle)]" : "bg-[var(--ds-surface)]"}`}
                  style={{ boxShadow: `inset 4px 0 0 ${statusEdge(line.key)}` }}>
                  <div className="flex h-11 shrink-0 items-center">
                    <Checkbox checked={sel} label={t("selectTrip", { id: line.number })} onChange={() => a.toggle(line)} disabled={line.canceled} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="sm:hidden"><TimeCell line={line} showDay={false} big /></div>
                    <div className="mt-1 flex flex-wrap items-center gap-2.5 sm:mt-0">
                      <span className="text-sm font-semibold">{line.patient}</span>
                      <StatusChip status={line.trip.status} isCancelled={line.canceled} />
                      {a.live.has(line.trip.id) && <LiveEtaTicker trip={line.trip} position={a.live.get(line.trip.id) ?? null} size="inline" />}
                      {(sel || line.past) && (
                        <span className={`${MONO} ml-auto text-[11px] uppercase ${sel ? "text-[var(--ds-primary)]" : "text-[var(--ds-on-surface-variant)]"}`}>
                          {sel ? t("selectedTag") : t("past")}
                        </span>
                      )}
                    </div>
                    <Meta line={line} withProvider />
                    <div className="mt-[9px]"><Route line={line} joined /></div>
                    <div className="sm:hidden"><PhoneActions line={line} a={a} /></div>
                  </div>
                  {/* Three buttons where they fit, as the table has them; a phone gets Track and "More". */}
                  <div className="hidden shrink-0 sm:block"><Actions line={line} a={a} /></div>
                </div>
              </div>
            </div>
          );
        })}
        {nowIndex === lines.length && lines.length > 0 && <NowMarker time={nowTime} />}
        {footer}
      </div>
      {phone
        ? <LiveSheet>{(open) => (open || !peek ? aside : peek)}</LiveSheet>
        : <div className="order-1 flex w-full shrink-0 flex-col gap-3.5 xl:order-2 xl:w-[300px]">{aside}</div>}
    </div>
  );
}

type Tracking = Schemas["TripTrackingDto"];
const hhmm = (value: string | null | undefined) => (value ? value.substring(0, 5) : null);

/**
 * The trip under way. Its live numbers (phase, minutes, miles, arrival) come with each vehicle
 * position (`position`, from useLiveTrips): nothing is polled. The only thing read from the backend
 * is the time the patient was picked up, once per trip and again when its status changes.
 */
export function InProgressPanel({ line, position, onTrack }: {
  line: TripLine | null;
  position: TripVehiclePosition | null;
  onTrack: (line: TripLine) => void;
}) {
  const t = useTranslations("dashboard");
  const { onTripStatus } = useRealtime();
  const [pickedUp, setPickedUp] = useState<{ id: number; at: string | null } | null>(null);
  const id = line?.trip.id ?? null;

  const load = useEffectEvent(async () => {
    if (id === null) return;
    try {
      const data = await api<Tracking>(`BookingPortal/trips/${id}/tracking`);
      setPickedUp({ id, at: hhmm(data.pickedUpAt) });
    } catch { /* the panel keeps the last known state */ }
  });
  useEffect(() => {
    if (id === null) return;
    const first = setTimeout(() => void load(), 0);
    const unsubscribe = onTripStatus((c) => { if (c.tripId === id) void load(); });
    return () => { clearTimeout(first); unsubscribe(); };
  }, [id, onTripStatus]);

  const shell = "relative overflow-hidden rounded-xl [background:var(--ds-live-panel)] p-[18px] text-[#f2f8fb]";
  const glow = <div className="pointer-events-none absolute -right-10 -top-[30px] size-[170px] bg-[radial-gradient(circle,rgb(129_99_230/0.42),transparent_70%)]" />;
  const heading = (
    <div className={`${MONO} relative flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#d3c6fb]`}>
      <span aria-hidden="true" className="ds-pulse size-2 rounded-full bg-[#a98cf7] shadow-[0_0_10px_#a98cf7]" />{t("inProgressNow")}
    </div>
  );
  if (!line) {
    return <div className={shell}>{glow}{heading}<p className="relative mt-3 text-[13px] text-[#cfe4ef]">{t("noneInProgress")}</p></div>;
  }

  const picked = pickedUp?.id === line.trip.id ? pickedUp.at : null;
  return (
    <div className={shell}>
      {glow}{heading}
      <div className="relative mt-3 text-[19px] font-semibold">{line.patient}</div>
      <div className={`${MONO} relative mt-1 text-xs text-[#cfe4ef]`}>#{line.number} · {line.space ?? "—"} · {line.provider ?? t("providerDefault")}</div>
      <div className="relative mt-4 flex gap-2.5">
        <div className="flex w-3 shrink-0 flex-col items-center py-[3px]">
          <svg width="12" height="15" viewBox="0 0 12 16" aria-hidden="true"><path d="M6 0a6 6 0 0 0-6 6c0 4.4 6 10 6 10s6-5.6 6-10a6 6 0 0 0-6-6z" fill="#ff8578" /><circle cx="6" cy="6" r="2.2" fill="#04202d" /></svg>
          <span className="my-[3px] w-0.5 flex-1 bg-[linear-gradient(180deg,#ff8578,#6ec3e0)]" />
          <svg width="12" height="15" viewBox="0 0 12 16" aria-hidden="true"><path d="M6 0a6 6 0 0 0-6 6c0 4.4 6 10 6 10s6-5.6 6-10a6 6 0 0 0-6-6z" fill="#6ec3e0" /><circle cx="6" cy="6" r="2.2" fill="#04202d" /></svg>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div>
            <div className="text-[13px] leading-[1.35]">{line.from.address}</div>
            <div className={`${MONO} mt-[3px] text-[11px] uppercase text-[#cfe4ef]`}>{t("req")} {line.time ?? "—"} · {t("pickedUp")} {picked ?? "—"}</div>
          </div>
          <div>
            <div className="text-[13px] leading-[1.35]">{line.to.address}</div>
            <div className={`${MONO} mt-[3px] text-[11px] uppercase text-[#cfe4ef]`}>{t("appointment")} {line.appt ?? "—"}</div>
          </div>
        </div>
      </div>
      <div className="relative mt-4 border-t border-white/20 pt-3.5">
        <LiveEtaTicker trip={line.trip} position={position} size="md" />
      </div>
      <button type="button" onClick={() => onTrack(line)}
        className="relative mt-3.5 h-11 w-full rounded-[9px] border border-white/40 bg-white/12 px-4 text-[13.5px] font-semibold text-white hover:bg-white/20">{t("track")}</button>
    </div>
  );
}

/** Late and arrived trips: what the clinic may need to act on now. A click brings the trip into view. */
export function NeedsAttention({ lines, onPick }: { lines: TripLine[]; onPick: (line: TripLine) => void }) {
  const t = useTranslations("dashboard");
  const items = lines.filter((l) => l.key === "late" || l.key === "arrived");
  return (
    <div className="rounded-xl border border-[var(--ds-outline-variant)] bg-[var(--ds-surface)] p-4">
      <div className={`${MONO} text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--ds-on-surface-variant)]`}>{t("needsAttention")}</div>
      {items.length === 0 && <p className="mt-3 text-[13px] text-[var(--ds-on-surface-variant)]">{t("nothingNeedsAttention")}</p>}
      {items.map((l, i) => {
        const late = l.key === "late";
        return (
          <button key={l.trip.id} type="button" onClick={() => onPick(l)}
            className={`flex w-full items-start gap-2.5 rounded-[9px] p-[11px] text-left ${i === 0 ? "mt-3" : "mt-[9px]"} ${late ? "bg-[var(--ds-warn-bg)]" : "bg-[var(--ds-cool-bg)]"}`}>
            <span aria-hidden="true" className={`mt-[5px] size-[9px] shrink-0 rounded-[2px] ${late ? "bg-[var(--ds-late-mark)]" : "bg-[var(--ds-arrived-mark)]"}`} />
            <span>
              <span className="block text-[13.5px] font-semibold">#{l.number} · {l.patient}</span>
              <span className="mt-[3px] block text-xs text-[var(--ds-on-surface-variant)]">
                {late
                  ? t("attentionLate", { time: l.time ?? "—", place: l.from.place ?? l.from.address })
                  : t("attentionArrived", { space: l.space ?? "—", place: l.to.place ?? l.to.address })}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Empty, loading and error: the view switch stays on screen in all three (Design System §10). */
export function ListState({ kind, view, title, text, action }: {
  kind: "empty" | "loading" | "error"; view: "table" | "timeline"; title?: string; text?: string; action?: ReactNode;
}) {
  const t = useTranslations("dashboard");
  if (kind === "loading") {
    return (
      <div className="flex flex-col gap-4 px-[26px] py-4">
        {[0, 1, 2].map((i) => view === "table" ? (
          <div key={i} className="flex items-center gap-3.5">
            <div className="h-[38px] w-1.5 rounded-[2px] bg-[var(--ds-background)]" />
            <div className="ds-shimmer h-3.5 w-[74px] rounded" />
            <div className="ds-shimmer h-3.5 flex-1 rounded" />
            <div className="h-6 w-[84px] rounded-[5px] bg-[var(--ds-background)]" />
          </div>
        ) : (
          <div key={i} className="flex gap-3"><div className="mt-4 h-3.5 w-[46px] rounded bg-[var(--ds-selected)]" /><div className="ds-shimmer h-[76px] flex-1 rounded-[9px]" /></div>
        ))}
        <div className={`${MONO} flex items-center gap-[9px] text-[11.5px] uppercase text-[var(--ds-on-surface-variant)]`}>
          <PhCircleNotch size={15} className="animate-spin text-[var(--ds-primary)]" aria-hidden />{t("loadingTrips")}
        </div>
      </div>
    );
  }
  const Icon = kind === "error" ? PhWifiSlash : view === "timeline" ? PhClockCountdown : PhCalendarX;
  return (
    <div className="flex flex-col items-center gap-2.5 px-6 py-[42px] text-center">
      <Icon size={38} aria-hidden className={kind === "error" ? "text-[var(--ds-error)]" : "text-[var(--ds-outline)]"} />
      {title && <div className="text-[15px] font-semibold">{title}</div>}
      {text && <div className="max-w-[300px] text-[13px] leading-normal text-[var(--ds-on-surface-variant)]">{text}</div>}
      {action && <div className="mt-1 flex gap-2">{action}</div>}
    </div>
  );
}

const PHONE_QUERY = "(max-width: 767.98px)";
export function useIsPhone() {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia(PHONE_QUERY);
      mq.addEventListener("change", notify);
      return () => mq.removeEventListener("change", notify);
    },
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false,
  );
}

/** How much of the sheet shows when it is down: the handle and the head of the live panel. */
const PEEK = 96;

/**
 * The phone's live sheet (design 3f): it sits above the bottom bar showing 96 px of the trip under
 * way, and is dragged up, or tapped, to see all of it and what needs attention. It never covers the
 * NOW line, because the list leaves that much room at its end.
 */
export function LiveSheet({ children, bottom = 84 }: {
  /** Content, or a function of whether the sheet is open (the tracking page shrinks its card when closed). */
  children: ReactNode | ((open: boolean) => ReactNode);
  /** Room under the sheet: the bottom bar's height. */
  bottom?: number;
}) {
  const t = useTranslations("dashboard");
  const [open, setOpen] = useState(false);
  const [drag, setDrag] = useState<number | null>(null);
  const start = useRef<{ y: number; moved: boolean } | null>(null);
  const body = useRef<HTMLDivElement>(null);

  // Open: the sheet is as tall as its content, at most 75% of the screen; closed: only the peek.
  const full = () => Math.min((body.current?.scrollHeight ?? 0) + 28, window.innerHeight * 0.75);
  const offsetClosed = () => Math.max(0, full() - PEEK);

  function down(e: PointerEvent<HTMLButtonElement>) {
    start.current = { y: e.clientY, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e: PointerEvent<HTMLButtonElement>) {
    if (!start.current) return;
    const dy = e.clientY - start.current.y;
    if (Math.abs(dy) > 4) start.current.moved = true;
    const base = open ? 0 : offsetClosed();
    setDrag(Math.min(offsetClosed(), Math.max(0, base + dy)));
  }
  function up() {
    if (!start.current) return;
    const moved = start.current.moved;
    start.current = null;
    if (!moved) { setOpen((o) => !o); setDrag(null); return; }
    // Past half way it settles open, otherwise closed.
    setOpen((drag ?? 0) < offsetClosed() / 2);
    setDrag(null);
  }

  const translate = drag ?? (open ? 0 : null);
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-[var(--ds-scrim)]" onClick={() => setOpen(false)} aria-hidden="true" />}
      <section aria-label={t("liveSheet")}
        className="fixed inset-x-0 z-30 rounded-t-2xl bg-[var(--ds-surface)] shadow-[0_-12px_32px_rgb(5_25_35/0.28)]"
        style={{
          bottom,
          transform: translate === null ? `translateY(calc(100% - ${PEEK}px))` : `translateY(${translate}px)`,
          transition: drag === null ? "transform .22s ease-out" : "none",
          maxHeight: "75vh",
        }}>
        <button type="button" aria-expanded={open} aria-label={open ? t("liveSheetClose") : t("liveSheetOpen")}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
          className="flex h-7 w-full touch-none items-center justify-center">
          <span className="h-1 w-[120px] rounded-full bg-[var(--ds-outline)]" />
        </button>
        <div ref={body} className={`flex flex-col gap-3.5 px-3 pb-3 ${open ? "max-h-[calc(75vh-28px)] overflow-y-auto" : "overflow-hidden"}`}>
          {typeof children === "function" ? children(open) : children}
        </div>
      </section>
    </>
  );
}
