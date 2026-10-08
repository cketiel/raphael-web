"use client";

import { APIProvider } from "@vis.gl/react-google-maps";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useEffect, useEffectEvent, useState } from "react";
import { useFeedback } from "@/components/Feedback";
import { useErrorText } from "@/i18n/useErrorText";
import { api } from "@/lib/bff";
import { useRealtime } from "@/features/realtime/RealtimeProvider";
import { TrackingModal } from "@/features/tracking/TrackingModal";
import { reportFundingIds, useCustomers, useFundingContext, useSpaceTypes } from "./catalogs";
import { downloadProductionCsv, type CsvLocale, type ProductionRow } from "./productionReportCsv";
import { localToday, statusBadgeClass, summarize, toTimeInput } from "./rules";
import { TripModal } from "./TripModal";
import type { TripRead } from "./types";

/** Day, month and year in the order the user reads them: 10/20/2026 in English, 20/10/2026 in Spanish. */
const DATE_FORMAT = { year: "numeric", month: "2-digit", day: "2-digit" } as const;

interface BookingDashboardProps {
  isIntegrator: boolean;
  mapsKey: string;
  mapId: string;
}

interface Loaded {
  trips: TripRead[];
  report: ProductionRow[];
  /** The range these trips were searched for: a live change outside it is not this list's business. */
  start: string;
  end: string;
}

export function BookingDashboard({ isIntegrator, mapsKey, mapId }: BookingDashboardProps) {
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

  const [start, setStart] = useState(localToday);
  const [end, setEnd] = useState(localToday);
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

  async function loadTrips() {
    if (!start || !end) return;
    await feedback.busy(async () => {
      try {
        setLoaded(await fetchTrips(start, end));
        setSelected(new Set());
      } catch (e) {
        await feedback.alert(errorText(e, t("loadFailed")));
      }
    });
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

  const trips = loaded?.trips ?? [];
  const summary = loaded ? summarize(loaded.trips, loaded.report) : null;
  const allChecked = trips.length > 0 && trips.every((x) => selected.has(x.tripId ?? ""));

  /** Track, edit and cancel: the same three buttons on the table and on the phone cards. */
  const rowActions = (trip: TripRead) => (
      <div className="inline-flex overflow-hidden rounded-lg border border-border shadow-sm">
        <button onClick={() => setTrackingId(trip.id)} title={t("trackTrip")} aria-label={t("trackTrip")}
          className="px-2.5 py-1 text-[#198754] hover:bg-emerald-50">📍</button>
        <button onClick={() => setModal({ open: true, trip })} title={t("editTrip")} aria-label={t("editTrip")}
          className="border-l border-border px-2.5 py-1 text-slate-600 hover:bg-slate-100">✎</button>
        <button onClick={() => cancelTrips([trip.tripId ?? ""])} title={t("cancelTrip")} aria-label={t("cancelTrip")}
          className="border-l border-border px-2.5 py-1 text-[#dc3545] hover:bg-red-50">✕</button>
      </div>
  );

  function toggle(id: string, on: boolean) {
    setSelected((s) => {
      const next = new Set(s);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  return (
    <>
      <div className="w-full px-3 py-4 sm:px-6 sm:py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-slate-600">{t("title")}</h1>
          <div className="flex gap-2">
            {selected.size > 0 && (
              <button onClick={() => cancelTrips([...selected])}
                className="rounded-lg bg-[#dc3545] px-4 py-2 text-sm font-bold text-white shadow-sm">
                {t("cancelSelected", { count: selected.size })}
              </button>
            )}
            <button onClick={() => {
                // The original re-read the funding source on every New Booking (app.js:593): an FS
                // linked by an admin a minute ago enables booking without signing in again.
                void funding.refetch();
                setModal({ open: true, trip: null });
              }}
              className="rounded-lg bg-[#198754] px-4 py-2 text-sm font-bold text-white shadow-sm">
              {t("newBooking")}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-2xl bg-surface p-5 shadow-sm">
          <div className="grid items-end gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[1fr_1fr_1.4fr]">
            <label className="text-xs font-bold">{t("startDate")}
              <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm font-normal" />
            </label>
            <label className="text-xs font-bold">{t("endDate")}
              <input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm font-normal" />
            </label>
            <div className="flex gap-2">
              {/* An end before the start makes the backend throw (TripService.GetByDateRangeAsync → 500). */}
              <button onClick={() => void loadTrips()} disabled={!start || !end || end < start}
                className="w-full rounded-lg bg-brand py-2 text-sm font-bold text-white disabled:opacity-50">
                {t("search")}
              </button>
              {(loaded?.report.length ?? 0) > 0 && (
                <button onClick={() => downloadProductionCsv(loaded!.report, csvLocale, tCsv("fileName", { date: new Date().toISOString().split("T")[0] }))}
                  className="w-full rounded-lg border border-[#198754] py-2 text-sm font-bold text-[#198754] hover:bg-[#198754] hover:text-white">
                  {t("exportReport")}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="mb-6 grid gap-3 md:grid-cols-4">
            <Stat label={t("totalTrips")} value={summary.totalTrips} className="bg-[#0d6efd]" />
            <Stat label={t("billedTrips")} value={summary.billedTrips} className="bg-[#198754]" />
            <Stat label={t("canceledTrips")} value={summary.canceledTrips} className="bg-[#dc3545]" />
            <Stat label={t("totalBilledValue")} value={summary.totalBilledValue} className="bg-[#212529]" />
          </div>
        )}

        {/* Phones and tablets: one card per trip, nothing to scroll sideways. */}
        <ul className="grid gap-3 md:grid-cols-2 lg:hidden">
          {trips.length > 0 && (
            <li className="flex items-center gap-2 px-1 text-sm md:col-span-2">
              <input type="checkbox" aria-label={t("selectAll")} checked={allChecked}
                onChange={(e) => setSelected(e.target.checked ? new Set(trips.map((x) => x.tripId ?? "")) : new Set())} />
              <span className="text-muted">{t("selectAll")}</span>
            </li>
          )}
          {trips.map((trip) => (
            <li key={trip.id} className="rounded-2xl bg-surface p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <input type="checkbox" className="mt-1" aria-label={t("selectTrip", { id: trip.tripId || trip.id })} checked={selected.has(trip.tripId ?? "")}
                  onChange={(e) => toggle(trip.tripId ?? "", e.target.checked)} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold">#{trip.tripId || trip.id}</span>
                    <span className={`rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide ${statusBadgeClass(trip.status)}`}>
                      {statusLabel(trip.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {format.dateTime(new Date(trip.date), DATE_FORMAT)}{trip.fromTime ? ` · ${toTimeInput(trip.fromTime)}` : ""}
                  </p>
                  <p className="mt-1 text-sm font-bold">{trip.customerName}</p>
                  <p className="text-xs text-muted">{t("providerLabel", { name: trip.providerName ?? t("providerDefault") })}</p>
                  <p className="mt-2 break-words text-[0.85rem] leading-tight"><span className="text-[#dc3545]">●</span> {trip.pickupAddress}</p>
                  <p className="mt-1 break-words text-[0.85rem] leading-tight"><span className="text-[#0d6efd]">●</span> {trip.dropoffAddress}</p>
                  <div className="mt-3 flex justify-end">{rowActions(trip)}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Wide screens: the table. Below 1024 px its route column wraps an address over seven lines. */}
        <div className="hidden overflow-hidden rounded-2xl bg-surface shadow-sm lg:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold">
                <tr>
                  <th className="w-[3%] min-w-10 px-3 py-3">
                    <input type="checkbox" aria-label={t("selectAll")} checked={allChecked}
                      onChange={(e) => setSelected(e.target.checked ? new Set(trips.map((x) => x.tripId ?? "")) : new Set())} />
                  </th>
                  <th className="w-[8%] min-w-[90px] px-3">{t("colTripId")}</th>
                  <th className="w-[12%] min-w-[120px] px-3">{t("colDateTime")}</th>
                  <th className="w-[15%] min-w-[150px] px-3">{t("colCustomer")}</th>
                  <th className="px-3">{t("colRoute")}</th>
                  <th className="w-[10%] min-w-[100px] px-3 text-center">{t("colStatus")}</th>
                  <th className="w-[10%] min-w-[100px] px-3 text-center">{t("colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip) => (
                  <tr key={trip.id} className="border-t border-border hover:bg-slate-50">
                    <td className="px-3 py-3">
                      <input type="checkbox" aria-label={t("selectTrip", { id: trip.tripId || trip.id })} checked={selected.has(trip.tripId ?? "")}
                        onChange={(e) => toggle(trip.tripId ?? "", e.target.checked)} />
                    </td>
                    <td className="px-3 font-bold">#{trip.tripId || trip.id}</td>
                    <td className="px-3 text-xs">
                      {format.dateTime(new Date(trip.date), DATE_FORMAT)}
                      <br />
                      {trip.fromTime && <span className="mt-1 inline-block rounded border border-border bg-slate-50 px-1.5 py-0.5">{toTimeInput(trip.fromTime)}</span>}
                    </td>
                    <td className="px-3 text-xs">
                      <span className="font-bold">{trip.customerName}</span>
                      <span className="mt-1 block text-muted">{t("providerLabel", { name: trip.providerName ?? t("providerDefault") })}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="block break-words text-[0.85rem] leading-tight"><span className="text-[#dc3545]">●</span> {trip.pickupAddress}</span>
                      <span className="mt-1 block break-words text-[0.85rem] leading-tight"><span className="text-[#0d6efd]">●</span> {trip.dropoffAddress}</span>
                    </td>
                    <td className="px-3 text-center">
                      <span className={`inline-block min-w-[90px] rounded-full px-3 py-1.5 text-[0.75rem] font-semibold uppercase tracking-wide shadow-sm ${statusBadgeClass(trip.status)}`}>
                        {statusLabel(trip.status)}
                      </span>
                    </td>
                    <td className="px-3 text-center">
                      {rowActions(trip)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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

function Stat({ label, value, className }: { label: string; value: string | number; className: string }) {
  return (
    <div className={`rounded-2xl p-5 text-white shadow-sm ${className}`}>
      <p className="text-xs font-bold uppercase opacity-75">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
