"use client";

import { APIProvider } from "@vis.gl/react-google-maps";
import { useEffect, useEffectEvent, useState } from "react";
import { useFeedback } from "@/components/Feedback";
import { api, BffError } from "@/lib/bff";
import { reportFundingIds, useCustomers, useFundingContext, useSpaceTypes } from "./catalogs";
import { downloadProductionCsv, type ProductionRow } from "./productionReportCsv";
import { localToday, statusBadgeClass, summarize, toTimeInput } from "./rules";
import { MAPS_LANGUAGE } from "@/features/maps/places";
import { TripModal } from "./TripModal";
import type { TripRead } from "./types";

interface BookingDashboardProps {
  isIntegrator: boolean;
  mapsKey: string;
  mapId: string;
}

interface Loaded {
  trips: TripRead[];
  report: ProductionRow[];
}

export function BookingDashboard({ isIntegrator, mapsKey, mapId }: BookingDashboardProps) {
  const feedback = useFeedback();
  const customers = useCustomers();
  const spaceTypes = useSpaceTypes();
  const funding = useFundingContext(isIntegrator);

  const [start, setStart] = useState(localToday);
  const [end, setEnd] = useState(localToday);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<{ open: boolean; trip: TripRead | null }>({ open: false, trip: null });

  const fundingIds = reportFundingIds(funding.data);

  /** my-trips, then the production report for the same range (Booking Web app.js:159-179). */
  async function loadTrips() {
    if (!start || !end) return;
    await feedback.busy(async () => {
      try {
        const query = new URLSearchParams({ startDate: start, endDate: end });
        const trips = await api<TripRead[]>(`BookingPortal/my-trips?${query}`);
        // Without funding sources the backend would apply no filter at all, so the report is not asked for.
        const report = fundingIds.length
          ? await api<ProductionRow[]>(`Schedules/reports/production-range?${query}&fundingSourceIds=${fundingIds.join(",")}`)
          : [];
        setLoaded({ trips: trips ?? [], report: report ?? [] });
        setSelected(new Set());
      } catch (e) {
        await feedback.alert(e instanceof BffError ? e.message : "Unable to load trips right now.");
      }
    });
  }

  // First load once the funding sources are known, as the original loaded catalogs before trips.
  const onFundingReady = useEffectEvent(() => void loadTrips());
  const onFundingFailed = useEffectEvent((message: string) => void feedback.alert(`Initialization failure: ${message}`));
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
    if (!(await feedback.confirm(`Are you sure you want to cancel ${ids.length} trip(s)?`))) return;
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
          ? `Process completed. ${result.attempted} of ${ids.length} trip(s) could be canceled; the rest are in a status that does not allow it.`
          : "Process completed successfully.",
      );
    } catch (e) {
      await feedback.alert(`Error: ${e instanceof Error ? e.message : "Unable to cancel right now."}`);
    }
  }

  const trips = loaded?.trips ?? [];
  const summary = loaded ? summarize(loaded.trips, loaded.report) : null;
  const allChecked = trips.length > 0 && trips.every((t) => selected.has(t.tripId ?? ""));

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
      <div className="w-full px-6 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-slate-600">Trip Management</h1>
          <div className="flex gap-2">
            {selected.size > 0 && (
              <button onClick={() => cancelTrips([...selected])}
                className="rounded-lg bg-[#dc3545] px-4 py-2 text-sm font-bold text-white shadow-sm">
                Cancel Selected ({selected.size})
              </button>
            )}
            <button onClick={() => {
                // The original re-read the funding source on every New Booking (app.js:593): an FS
                // linked by an admin a minute ago enables booking without signing in again.
                void funding.refetch();
                setModal({ open: true, trip: null });
              }}
              className="rounded-lg bg-[#198754] px-4 py-2 text-sm font-bold text-white shadow-sm">
              + New Booking
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-2xl bg-surface p-5 shadow-sm">
          <div className="grid items-end gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[1fr_1fr_1.4fr]">
            <label className="text-xs font-bold">Start Date
              <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm font-normal" />
            </label>
            <label className="text-xs font-bold">End Date
              <input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm font-normal" />
            </label>
            <div className="flex gap-2">
              {/* An end before the start makes the backend throw (TripService.GetByDateRangeAsync → 500). */}
              <button onClick={() => void loadTrips()} disabled={!start || !end || end < start}
                className="w-full rounded-lg bg-brand py-2 text-sm font-bold text-white disabled:opacity-50">
                Search
              </button>
              {(loaded?.report.length ?? 0) > 0 && (
                <button onClick={() => downloadProductionCsv(loaded!.report)}
                  className="w-full rounded-lg border border-[#198754] py-2 text-sm font-bold text-[#198754] hover:bg-[#198754] hover:text-white">
                  Export Report
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="mb-6 grid gap-3 md:grid-cols-4">
            <Stat label="Total Trips" value={summary.totalTrips} className="bg-[#0d6efd]" />
            <Stat label="Billed Trips" value={summary.billedTrips} className="bg-[#198754]" />
            <Stat label="Canceled Trips" value={summary.canceledTrips} className="bg-[#dc3545]" />
            <Stat label="Total Billed Value" value={summary.totalBilledValue} className="bg-[#212529]" />
          </div>
        )}

        {/* Trips table */}
        <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold">
                <tr>
                  <th className="w-[3%] min-w-10 px-3 py-3">
                    <input type="checkbox" aria-label="Select all trips" checked={allChecked}
                      onChange={(e) => setSelected(e.target.checked ? new Set(trips.map((t) => t.tripId ?? "")) : new Set())} />
                  </th>
                  <th className="w-[8%] min-w-[90px] px-3">Trip ID</th>
                  <th className="w-[12%] min-w-[120px] px-3">Date / Time</th>
                  <th className="w-[15%] min-w-[150px] px-3">Customer</th>
                  <th className="px-3">Route Details</th>
                  <th className="w-[10%] min-w-[100px] px-3 text-center">Status</th>
                  <th className="w-[10%] min-w-[100px] px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((t) => (
                  <tr key={t.id} className="border-t border-border hover:bg-slate-50">
                    <td className="px-3 py-3">
                      <input type="checkbox" aria-label={`Select trip ${t.tripId || t.id}`} checked={selected.has(t.tripId ?? "")}
                        onChange={(e) => toggle(t.tripId ?? "", e.target.checked)} />
                    </td>
                    <td className="px-3 font-bold">#{t.tripId || t.id}</td>
                    <td className="px-3 text-xs">
                      {new Date(t.date).toLocaleDateString()}
                      <br />
                      {t.fromTime && <span className="mt-1 inline-block rounded border border-border bg-slate-50 px-1.5 py-0.5">{toTimeInput(t.fromTime)}</span>}
                    </td>
                    <td className="px-3 text-xs font-bold">{t.customerName}</td>
                    <td className="px-3 py-2">
                      <span className="block break-words text-[0.85rem] leading-tight"><span className="text-[#dc3545]">●</span> {t.pickupAddress}</span>
                      <span className="mt-1 block break-words text-[0.85rem] leading-tight"><span className="text-[#0d6efd]">●</span> {t.dropoffAddress}</span>
                    </td>
                    <td className="px-3 text-center">
                      <span className={`inline-block min-w-[90px] rounded-full px-3 py-1.5 text-[0.75rem] font-semibold uppercase tracking-wide shadow-sm ${statusBadgeClass(t.status)}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-3 text-center">
                      <div className="inline-flex overflow-hidden rounded-lg border border-border shadow-sm">
                        <button onClick={() => setModal({ open: true, trip: t })} title="Edit Trip" aria-label="Edit Trip"
                          className="px-2.5 py-1 text-slate-600 hover:bg-slate-100">✎</button>
                        <button onClick={() => cancelTrips([t.tripId ?? ""])} title="Cancel Trip" aria-label="Cancel Trip"
                          className="border-l border-border px-2.5 py-1 text-[#dc3545] hover:bg-red-50">✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Maps JavaScript loads only when the form opens, never with the dashboard. */}
      {modal.open && <APIProvider apiKey={mapsKey} language={MAPS_LANGUAGE} region="US"><TripModal
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
