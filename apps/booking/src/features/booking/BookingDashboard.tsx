"use client";

import { APIProvider } from "@vis.gl/react-google-maps";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useEffect, useEffectEvent, useRef, useState, type ComponentType } from "react";
import { useFeedback } from "@/components/Feedback";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Form";
import {
  IconBilling, IconCancelled, IconCheckCircle, IconEdit, IconExport, IconPin, IconPlus, IconProvider, IconSearch, IconTrack, IconTrips, IconWarning,
} from "@/components/ui/Icon";
import { Card, EmptyState, Notice, PageHeader } from "@/components/ui/Surface";
import { useErrorText } from "@/i18n/useErrorText";
import { api } from "@/lib/bff";
import { useRealtime } from "@/features/realtime/RealtimeProvider";
import { TrackingModal } from "@/features/tracking/TrackingModal";
import { reportFundingIds, useCustomers, useFundingContext, useSpaceTypes } from "./catalogs";
import { downloadProductionCsv, type CsvLocale, type ProductionRow } from "./productionReportCsv";
import { localToday, summarize, toTimeInput } from "./rules";
import { StatusBadge } from "./StatusBadge";
import { tripMatches } from "./tripFilter";
import { TripModal } from "./TripModal";
import type { TripRead } from "./types";

/** Day, month and year in the order the user reads them: 10/20/2026 in English, 20/10/2026 in Spanish. */
const DATE_FORMAT = { year: "numeric", month: "2-digit", day: "2-digit" } as const;

type IconComponent = ComponentType<{ size?: number | string; className?: string; "aria-hidden"?: boolean }>;

interface BookingDashboardProps {
  isIntegrator: boolean;
  mapsKey: string;
  mapId: string;
  /** A trip to show and highlight, from a notification's "View trip": its day is the one loaded. */
  focus: { tripId: number; date: string } | null;
}

interface Loaded {
  trips: TripRead[];
  report: ProductionRow[];
  /** The range these trips were searched for: a live change outside it is not this list's business. */
  start: string;
  end: string;
}

/** The day after a "YYYY-MM-DD", in the same calendar. */
function nextDay(day: string) {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function BookingDashboard({ isIntegrator, mapsKey, mapId, focus }: BookingDashboardProps) {
  const feedback = useFeedback();
  const t = useTranslations("dashboard");
  const tStatus = useTranslations("status");
  const tCsv = useTranslations("csv");
  const format = useFormatter();
  const locale = useLocale();
  const errorText = useErrorText();
  const customers = useCustomers();
  const spaceTypes = useSpaceTypes();
  const funding = useFundingContext(isIntegrator);

  const [start, setStart] = useState(() => focus?.date ?? localToday());
  const [end, setEnd] = useState(() => focus?.date ?? localToday());
  const [filter, setFilter] = useState("");
  const [highlightId, setHighlightId] = useState<number | null>(focus?.tripId ?? null);
  const highlightRefs = useRef(new Map<string, HTMLElement>());
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<{ open: boolean; trip: TripRead | null }>({ open: false, trip: null });
  const [trackingId, setTrackingId] = useState<number | null>(null);
  const { onTripStatus } = useRealtime();

  const fundingIds = reportFundingIds(funding.data);

  /** The backend's status, in the user's language. A status this portal does not know is shown as it comes. */
  const statusLabel = (status: string | null | undefined) => (status && tStatus.has(status) ? tStatus(status) : status);

  /** The report in the user's language: headers, Yes/No and dates (the column order never changes). */
  const csvLocale: CsvLocale = {
    headers: tCsv.raw("headers") as string[],
    yes: tCsv("yes"),
    no: tCsv("no"),
    formatDate: (value, withTime) =>
      format.dateTime(value, withTime ? { ...DATE_FORMAT, hour: "2-digit", minute: "2-digit", second: "2-digit" } : DATE_FORMAT),
  };

  /** my-trips, then the production report for the same range (Booking Web app.js:159-179). */
  async function fetchTrips(from: string, to: string): Promise<Loaded> {
    const query = new URLSearchParams({ startDate: from, endDate: to });
    const trips = await api<TripRead[]>(`BookingPortal/my-trips?${query}`);
    // Without funding sources the backend would apply no filter at all, so the report is not asked for.
    const report = fundingIds.length
      ? await api<ProductionRow[]>(`Schedules/reports/production-range?${query}&fundingSourceIds=${fundingIds.join(",")}`)
      : [];
    return { trips: trips ?? [], report: report ?? [], start: from, end: to };
  }

  async function loadTrips(from = start, to = end) {
    if (!from || !to) return;
    await feedback.busy(async () => {
      try {
        setLoaded(await fetchTrips(from, to));
        setSelected(new Set());
      } catch (e) {
        await feedback.alert(errorText(e, t("loadFailed")));
      }
    });
  }

  /** A search the user asks for is a new list: the highlighted trip from a notification is done with. */
  function search(from = start, to = end) {
    setHighlightId(null);
    setStart(from);
    setEnd(to);
    void loadTrips(from, to);
  }

  // Live status changes. A trip already on screen changes in place; one that is not, but falls in
  // the searched range (a new booking, a reactivation), brings the list again in the background.
  const onStatusChanged = useEffectEvent((change: { tripId: number; status: string; isCancelled: boolean; date: string }) => {
    if (!loaded) return;
    if (loaded.trips.some((x) => x.id === change.tripId)) {
      setLoaded({
        ...loaded,
        trips: loaded.trips.map((x) => (x.id === change.tripId ? { ...x, status: change.status, isCancelled: change.isCancelled } : x)),
      });
      return;
    }
    const day = change.date.slice(0, 10);
    if (day >= loaded.start && day <= loaded.end) {
      void fetchTrips(loaded.start, loaded.end).then(setLoaded).catch(() => undefined);
    }
  });
  useEffect(() => onTripStatus((c) => onStatusChanged(c)), [onTripStatus]);

  // First load once the funding sources are known, as the original loaded catalogs before trips.
  const onFundingReady = useEffectEvent(() => void loadTrips());
  const onFundingFailed = useEffectEvent((message: string) => void feedback.alert(t("initFailed", { message })));
  const fundingReady = funding.isSuccess;
  const fundingError = funding.error?.message;
  useEffect(() => {
    if (fundingReady) onFundingReady();
  }, [fundingReady]);
  useEffect(() => {
    if (fundingError) onFundingFailed(fundingError);
  }, [fundingError]);

  async function cancelTrips(ids: string[]) {
    if (ids.length === 0) return;
    if (!(await feedback.confirm(t("confirmCancel", { count: ids.length })))) return;
    try {
      const result = await feedback.busy(async () => {
        const r = await api<{ success?: boolean; cancelledCount?: number; attempted?: number }>("BookingPortal/cancel-multiple", {
          method: "POST",
          body: JSON.stringify(ids),
        });
        await loadTrips();
        return r;
      });
      await feedback.alert(
        result?.attempted !== undefined && result.attempted < ids.length
          ? t("cancelPartial", { attempted: result.attempted, total: ids.length })
          : t("cancelDone"),
      );
    } catch (e) {
      await feedback.alert(t("cancelFailed", { message: errorText(e, e instanceof Error ? e.message : t("cancelUnavailable")) }));
    }
  }

  const allTrips = loaded?.trips ?? [];
  const trips = allTrips.filter((trip) => tripMatches(trip, filter, statusLabel));
  const highlightMissing = highlightId !== null && loaded !== null && !allTrips.some((x) => x.id === highlightId);

  // Brings the highlighted trip into view once the list has it. The phone cards and the table are
  // both rendered and one of them is hidden by CSS, so the visible one is the one with a layout box.
  useEffect(() => {
    if (highlightId === null || !loaded) return;
    const target = [...highlightRefs.current.entries()]
      .filter(([key]) => key.endsWith(`:${highlightId}`))
      .map(([, el]) => el)
      .find((el) => el.offsetParent !== null);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightId, loaded]);

  /** Registers a row or card under its layout ("card" or "row") so the highlight can find the visible one. */
  const highlightRef = (layout: string, id: number) => (el: HTMLElement | null) => {
    if (el) highlightRefs.current.set(`${layout}:${id}`, el);
    else highlightRefs.current.delete(`${layout}:${id}`);
  };
  const isHighlighted = (id: number) => id === highlightId;

  const summary = loaded ? summarize(loaded.trips, loaded.report) : null;
  const allChecked = trips.length > 0 && trips.every((x) => selected.has(x.tripId ?? ""));

  function toggle(id: string, on: boolean) {
    setSelected((s) => {
      const next = new Set(s);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  const tripDate = (trip: TripRead) => format.dateTime(new Date(trip.date), DATE_FORMAT);

  /** Track, edit and cancel: the same three buttons on the table and on the phone cards. */
  const rowActions = (trip: TripRead) => (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="sm" iconOnly icon={IconTrack} label={t("trackTrip")} onClick={() => setTrackingId(trip.id)} />
      <Button variant="ghost" size="sm" iconOnly icon={IconEdit} label={t("editTrip")} onClick={() => setModal({ open: true, trip })} />
      <Button variant="ghost" size="sm" iconOnly icon={IconCancelled} label={t("cancelTrip")} onClick={() => cancelTrips([trip.tripId ?? ""])}
        className="hover:!bg-danger-soft hover:!text-danger" />
    </div>
  );

  const route = (trip: TripRead) => (
    <div className="space-y-1.5">
      <p className="flex items-start gap-2 text-sm leading-snug">
        <IconPin size={15} aria-hidden className="mt-0.5 shrink-0 text-danger" />
        <span className="break-words">{trip.pickupAddress}</span>
      </p>
      <p className="flex items-start gap-2 text-sm leading-snug">
        <IconPin size={15} aria-hidden className="mt-0.5 shrink-0 text-info" />
        <span className="break-words">{trip.dropoffAddress}</span>
      </p>
    </div>
  );

  const provider = (trip: TripRead) => (
    <span className="mt-1 flex items-center gap-1.5 text-xs text-muted">
      <IconProvider size={12} aria-hidden />
      {trip.providerName ?? t("providerDefault")}
    </span>
  );

  const today = localToday();
  const highlightRow = "bg-amber-50 shadow-[inset_4px_0_0_#fbbf24]";

  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle")}
        actions={<>
          {/* Always on screen, as in the original portal: a key action nobody should have to look for.
              Disabled, with the reason, when the dates loaded have no billable rows to export. */}
          <Button variant="secondary" icon={IconExport} disabled={(loaded?.report.length ?? 0) === 0}
            title={(loaded?.report.length ?? 0) === 0 ? t("exportNothing") : undefined}
            onClick={() => downloadProductionCsv(loaded!.report, csvLocale, tCsv("fileName", { date: new Date().toISOString().split("T")[0] }))}>
            {t("exportReport")}
          </Button>
          <Button icon={IconPlus} onClick={() => {
            // The original re-read the funding source on every New Booking (app.js:593): an FS
            // linked by an admin a minute ago enables booking without signing in again.
            void funding.refetch();
            setModal({ open: true, trip: null });
          }}>
            {t("newBooking")}
          </Button>
        </>} />

      {/* Dates and search */}
      <Card className="mb-5">
        <div className="grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,11rem)_minmax(0,11rem)_auto_minmax(16rem,1fr)]">
          <Field label={t("startDate")} htmlFor="trips-start">
            <Input id="trips-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label={t("endDate")} htmlFor="trips-end">
            <Input id="trips-end" type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
          </Field>
          <div className="flex flex-wrap gap-2 sm:col-span-2 xl:col-span-1">
            {/* An end before the start makes the backend throw (TripService.GetByDateRangeAsync → 500). */}
            <Button icon={IconSearch} onClick={() => search()} disabled={!start || !end || end < start}>{t("search")}</Button>
            <Button variant="secondary" onClick={() => search(today, today)}>{t("today")}</Button>
            <Button variant="secondary" onClick={() => search(nextDay(today), nextDay(today))}>{t("tomorrow")}</Button>
          </div>
          {/* Find a trip among the loaded ones. Only in this browser: what is typed never leaves it. */}
          <div className="sm:col-span-2 xl:col-span-1">
            <label htmlFor="trips-filter" className="mb-1.5 block text-sm font-semibold text-slate-700">{t("filterLabel")}</label>
            <Input id="trips-filter" type="search" icon={IconSearch} value={filter} disabled={!loaded || allTrips.length === 0}
              onChange={(e) => {
                // A selection must never include trips the filter hides: "Cancel selected" would cancel them unseen.
                setFilter(e.target.value);
                setSelected(new Set());
              }}
              placeholder={t("filterPlaceholder")} />
          </div>
        </div>
      </Card>

      {highlightMissing && (
        <Notice tone="warning" className="mb-5 flex items-center gap-2">
          <IconWarning size={16} aria-hidden className="shrink-0" />
          {t("highlightMissing", { id: highlightId, date: format.dateTime(new Date(`${loaded!.start}T12:00:00`), DATE_FORMAT) })}
        </Notice>
      )}

      {/* Summary */}
      {summary && (
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icon={IconTrips} tone="bg-brand-50 text-brand" label={t("totalTrips")} value={summary.totalTrips} />
          <Stat icon={IconCheckCircle} tone="bg-success-soft text-success" label={t("billedTrips")} value={summary.billedTrips} />
          <Stat icon={IconCancelled} tone="bg-danger-soft text-danger" label={t("canceledTrips")} value={summary.canceledTrips} />
          <Stat icon={IconBilling} tone="bg-slate-100 text-navy" label={t("totalBilledValue")} value={summary.totalBilledValue} />
        </div>
      )}

      {/* The list */}
      <Card padded={false} className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
          <label className="flex items-center gap-2.5 text-sm font-semibold">
            <input type="checkbox" className="size-[18px] accent-[var(--brand)]" aria-label={t("selectAll")} checked={allChecked} disabled={trips.length === 0}
              onChange={(e) => setSelected(e.target.checked ? new Set(trips.map((x) => x.tripId ?? "")) : new Set())} />
            {selected.size > 0 ? t("selectedCount", { count: selected.size }) : t("selectAll")}
          </label>
          {selected.size > 0 && (
            <Button variant="danger-outline" size="sm" icon={IconCancelled} onClick={() => cancelTrips([...selected])}>
              {t("cancelSelected", { count: selected.size })}
            </Button>
          )}
          {loaded && (
            <span className="ml-auto text-sm text-muted" aria-live="polite">{t("filterCount", { shown: trips.length, total: allTrips.length })}</span>
          )}
        </div>

        {loaded && allTrips.length === 0 && (
          <EmptyState icon={IconTrips} title={t("emptyTitle")}>{t("emptyText")}</EmptyState>
        )}
        {filter && trips.length === 0 && allTrips.length > 0 && (
          <EmptyState icon={IconSearch} title={t("noMatches", { term: filter })} />
        )}

        {/* Phones and tablets: one card per trip, nothing to scroll sideways. */}
        <ul className="divide-y divide-border lg:hidden">
          {trips.map((trip) => (
            <li key={trip.id} ref={highlightRef("card", trip.id)} className={`p-4 ${isHighlighted(trip.id) ? highlightRow : ""}`}>
              <div className="flex items-start gap-3">
                <input type="checkbox" className="mt-1 size-[18px] accent-[var(--brand)]" aria-label={t("selectTrip", { id: trip.tripId || trip.id })}
                  checked={selected.has(trip.tripId ?? "")} onChange={(e) => toggle(trip.tripId ?? "", e.target.checked)} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">#{trip.tripId || trip.id}</span>
                    <span className="text-sm text-muted">{tripDate(trip)}{trip.fromTime ? ` · ${toTimeInput(trip.fromTime)}` : ""}</span>
                    <span className="ml-auto"><StatusBadge status={trip.status} /></span>
                  </div>
                  <p className="mt-2 font-semibold">{trip.customerName}</p>
                  {provider(trip)}
                  <div className="mt-3">{route(trip)}</div>
                  <div className="mt-2">{rowActions(trip)}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Wide screens: the table. */}
        {trips.length > 0 && (
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left">
              <thead className="bg-surface-2 text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="w-12 px-4 py-3"><span className="sr-only">{t("selectAll")}</span></th>
                  <th className="w-24 px-3">{t("colTripId")}</th>
                  <th className="w-28 px-3">{t("colDateTime")}</th>
                  <th className="w-44 px-3 xl:w-56">{t("colCustomer")}</th>
                  <th className="min-w-72 px-3">{t("colRoute")}</th>
                  <th className="w-32 px-3">{t("colStatus")}</th>
                  <th className="w-32 px-4 text-right">{t("colActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {trips.map((trip) => (
                  <tr key={trip.id} ref={highlightRef("row", trip.id)}
                    className={`align-top transition-colors hover:bg-surface-2 ${isHighlighted(trip.id) ? highlightRow : ""}`}>
                    <td className="px-4 py-3.5">
                      <input type="checkbox" className="size-[18px] accent-[var(--brand)]" aria-label={t("selectTrip", { id: trip.tripId || trip.id })}
                        checked={selected.has(trip.tripId ?? "")} onChange={(e) => toggle(trip.tripId ?? "", e.target.checked)} />
                    </td>
                    <td className="px-3 py-3.5 font-bold">#{trip.tripId || trip.id}</td>
                    <td className="px-3 py-3.5 text-sm">
                      <span className="block">{tripDate(trip)}</span>
                      {trip.fromTime && <span className="mt-0.5 block font-semibold text-foreground">{toTimeInput(trip.fromTime)}</span>}
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="block font-semibold">{trip.customerName}</span>
                      {provider(trip)}
                    </td>
                    <td className="px-3 py-3.5">{route(trip)}</td>
                    <td className="px-3 py-3.5"><StatusBadge status={trip.status} /></td>
                    <td className="px-4 py-2.5">{rowActions(trip)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Maps JavaScript loads only when a form or the tracking view opens, never with the dashboard. */}
      {trackingId !== null && (
        <APIProvider apiKey={mapsKey} language={locale} region="US">
          <TrackingModal tripId={trackingId} mapId={mapId} onClose={() => setTrackingId(null)} />
        </APIProvider>
      )}
      {modal.open && <APIProvider apiKey={mapsKey} language={locale} region="US"><TripModal
        key={modal.trip?.id ?? "new"}
        trip={modal.trip}
        customers={customers.data ?? []}
        spaceTypes={spaceTypes.data ?? []}
        funding={funding.data}
        mapId={mapId}
        onClose={() => setModal({ open: false, trip: null })}
        onSaved={async () => {
          // A booking can create the patient. The original loaded the patient list once at sign-in,
          // so editing that new trip opened with an empty patient and could save it that way.
          await customers.refetch();
          await loadTrips();
        }}
      /></APIProvider>}
    </>
  );
}

function Stat({ icon: Icon, tone, label, value }: { icon: IconComponent; tone: string; label: string; value: string | number }) {
  return (
    <Card className="flex items-center gap-3 !p-4">
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon size={20} aria-hidden /></span>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        <p className="text-xl font-bold leading-tight text-foreground sm:text-2xl">{value}</p>
      </div>
    </Card>
  );
}
