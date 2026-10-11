"use client";

import { APIProvider } from "@vis.gl/react-google-maps";
import { useRouter } from "next/navigation";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useEffect, useEffectEvent, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import {
  PhCaretDown, PhCircleNotch, PhDownloadSimple, PhFileCsv, PhRows, PhMagnifyingGlass, PhPlus, PhWarningCircle, PhXCircle,
} from "@/components/ui/Icon";
import { Menu } from "@/components/ui/Menu";
import { useOrganization } from "@/features/admin/adminApi";
import { useErrorText } from "@/i18n/useErrorText";
import { api } from "@/lib/bff";
import { useRealtime } from "@/features/realtime/RealtimeProvider";
import { reportFundingIds, useCustomers, useFundingContext, useSpaceTypes } from "./catalogs";
import { downloadProductionCsv, type CsvLocale, type ProductionRow } from "./productionReportCsv";
import { localToday, summarize } from "./rules";
import { byDayAndTime, toLine, type TripLine } from "./tripLines";
import { buildTripsCsv, downloadTripsCsv, tripsCsvFileName } from "./tripsCsv";
import { tripMatches } from "./tripFilter";
import { tripsCache, type LoadedTrips } from "./tripsCache";
import { LiveEtaTicker } from "@/features/tracking/LiveEtaTicker";
import { useLiveTrips } from "@/features/tracking/useLiveTrips";
import { CancelDialog, ToastBar, type Toast } from "./TripDialogs";
import { TripModal } from "./TripModal";
import { InProgressPanel, ListState, NeedsAttention, TableView, TimelineView, type TripActions } from "./TripViews";
import { useTripsView, ViewSwitch } from "./TripsView";
import type { TripRead } from "./types";

/** Day, month and year in the order the user reads them: 10/20/2026 in English, 20/10/2026 in Spanish. */
const DATE_FORMAT = { year: "numeric", month: "2-digit", day: "2-digit" } as const;
const MONO = "font-[family-name:var(--font-plex-mono)]";

interface BookingDashboardProps {
  isIntegrator: boolean;
  isClinicAdmin: boolean;
  mapsKey: string;
  mapId: string;
  /** A trip to show and highlight, from a notification's "View trip": its day is the one loaded. */
  focus: { tripId: number; date: string } | null;
}

type Loaded = LoadedTrips;

const LIST_STATE_KEY = "rb_trips_list";
/** The statuses in which the backend sends the vehicle's position (TripTracking.UnderWayStatuses). */
const UNDER_WAY = ["Started", "Arrived", "InProgress"];

/** What the list was showing when the user opened a trip's tracking page, or null. Read once, then forgotten. */
function readListState(): { start: string; end: string; filter: string; selected: string[] } | null {
  try {
    const raw = sessionStorage.getItem(LIST_STATE_KEY);
    sessionStorage.removeItem(LIST_STATE_KEY);
    const v = raw ? JSON.parse(raw) : null;
    return v && /^\d{4}-\d{2}-\d{2}$/.test(v.start) && /^\d{4}-\d{2}-\d{2}$/.test(v.end) ? v : null;
  } catch {
    return null;
  }
}

/** The day after a "YYYY-MM-DD", in the same calendar. */
function nextDay(day: string) {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "HH:mm" of this browser's clock: the NOW line compares it with the trips' wall-clock times. */
function clockNow() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function BookingDashboard({ isIntegrator, isClinicAdmin, mapsKey, mapId, focus }: BookingDashboardProps) {
  const t = useTranslations("dashboard");
  const tStatus = useTranslations("status");
  const tCsv = useTranslations("csv");
  const format = useFormatter();
  const locale = useLocale();
  const errorText = useErrorText();
  const customers = useCustomers();
  const spaceTypes = useSpaceTypes();
  const funding = useFundingContext(isIntegrator);
  // The organization's name for the export; shared with the sidebar's query, so no second request.
  const organization = useOrganization(isClinicAdmin);
  const { view } = useTripsView();

  const router = useRouter();
  // Back from a trip's tracking page finds the list as it was left: same dates, search and selection.
  const [restored] = useState(() => (focus ? null : readListState()));
  const [start, setStart] = useState(() => focus?.date ?? restored?.start ?? localToday());
  const [end, setEnd] = useState(() => focus?.date ?? restored?.end ?? localToday());
  const [filter, setFilter] = useState(() => restored?.filter ?? "");
  const [highlightId, setHighlightId] = useState<number | null>(focus?.tripId ?? null);
  const highlightRefs = useRef(new Map<string, HTMLElement>());
  // The list this tab already holds for this range, if any: shown at once, never asked again for
  // nothing (tripsCache). A stale one is shown too, and refreshed once in the background.
  const [cachedAtStart] = useState(() => tripsCache.get(focus?.date ?? restored?.start ?? localToday(), focus?.date ?? restored?.end ?? localToday()));
  const [loaded, setLoaded] = useState<Loaded | null>(() => cachedAtStart?.data ?? null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(cachedAtStart ? "ready" : "loading");
  /** When the list was last asked for: a live change right after a load does not ask again. */
  const lastLoadAt = useRef(0);
  // One search at a time: Search, Today and Tomorrow are off while one is on its way.
  const [searching, setSearching] = useState(false);
  const restoredSelection = useRef<string[] | null>(restored?.selected ?? null);
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(() => (cachedAtStart && restored?.selected
    ? new Set(restored.selected.filter((id) => cachedAtStart.data.trips.some((x) => x.tripId === id)))
    : new Set()));
  const [modal, setModal] = useState<{ open: boolean; trip: TripRead | null }>({ open: false, trip: null });
  const [asking, setAsking] = useState<TripLine[] | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [now, setNow] = useState<string | null>(null);
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

  // The NOW line moves with the minute; only in the browser, where the reader's clock is.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(clockNow());
    // Once a minute, on the minute: the list is not re-drawn more often than the line can move.
    let id: ReturnType<typeof setInterval> | undefined;
    const first = setTimeout(() => {
      setNow(clockNow());
      id = setInterval(() => setNow(clockNow()), 60_000);
    }, 60_000 - (Date.now() % 60_000));
    return () => { clearTimeout(first); if (id) clearInterval(id); };
  }, []);

  // Every list shown is the one kept for the way back.
  useEffect(() => {
    if (loaded) tripsCache.set(loaded);
  }, [loaded]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(id);
  }, [toast]);

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

  /** Kept for this tab only: the way back from the tracking page. */
  function saveListState() {
    try {
      sessionStorage.setItem(LIST_STATE_KEY, JSON.stringify({ start, end, filter, selected: [...selected] }));
    } catch { /* storage blocked: the list simply starts on today */ }
  }

  /** Loads a range. The filters stay as they are on a failure: nothing typed is lost. */
  async function loadTrips(from = start, to = end, quiet = false) {
    if (!from || !to) return;
    if (!quiet) setLoadState("loading");
    setSearching(true);
    lastLoadAt.current = Date.now();
    try {
      const data = await fetchTrips(from, to);
      setLoaded(data);
      // The selection survives the trip to the tracking page and back, but only for trips still listed.
      const keep = restoredSelection.current;
      restoredSelection.current = null;
      setSelected(keep ? new Set(keep.filter((id) => data.trips.some((x) => x.tripId === id))) : new Set());
      setLoadState("ready");
    } catch (e) {
      setLoadError(errorText(e, t("loadFailed")));
      setLoadState("error");
    } finally {
      setSearching(false);
    }
  }

  /** A search the user asks for is a new list: the highlighted trip from a notification is done with. */
  function search(from = start, to = end) {
    if (searching) return;
    setHighlightId(null);
    setStart(from);
    setEnd(to);
    void loadTrips(from, to);
  }

  // Live status changes. A trip already on screen changes in place; one that is not, but falls in
  // the searched range (a new booking, a reactivation by the office), brings the list again in the background.
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
    // A new trip in the range. Not when the list was just loaded: saving a booking already brought it.
    if (day >= loaded.start && day <= loaded.end && Date.now() - lastLoadAt.current > 5_000) {
      lastLoadAt.current = Date.now();
      void fetchTrips(loaded.start, loaded.end).then(setLoaded).catch(() => undefined);
    }
  });
  useEffect(() => onTripStatus((c) => onStatusChanged(c)), [onTripStatus]);

  // First load once the funding sources are known, as the original loaded catalogs before trips.
  // Quiet: the list already starts in its loading state.
  // Not at all when this range is already held and fresh; in the background when it is held but stale.
  const onFundingReady = useEffectEvent(() => {
    if (cachedAtStart && !cachedAtStart.stale) return;
    void Promise.resolve().then(() => loadTrips(start, end, true));
  });
  const fundingReady = funding.isSuccess;
  const fundingError = funding.error?.message;
  useEffect(() => {
    if (fundingReady) onFundingReady();
  }, [fundingReady]);

  async function confirmCancel(lines: TripLine[]) {
    const ids = lines.map((l) => l.trip.tripId ?? "").filter(Boolean);
    setCancelling(true);
    try {
      const r = await api<{ success?: boolean; cancelledCount?: number; attempted?: number }>("BookingPortal/cancel-multiple", {
        method: "POST",
        body: JSON.stringify(ids),
      });
      // All canceled: they change in place, no list to ask for. A partial cancel asks once, to show
      // which ones the backend refused.
      if (r?.attempted !== undefined && r.attempted < ids.length) await loadTrips(start, end, true);
      else if (loaded) {
        const gone = new Set(ids);
        setLoaded({ ...loaded, trips: loaded.trips.map((x) => (x.tripId && gone.has(x.tripId) ? { ...x, status: "Canceled", isCancelled: true } : x)) });
        setSelected(new Set());
      }
      setToast(r?.attempted !== undefined && r.attempted < ids.length
        ? { tone: "warning", text: t("cancelPartial", { attempted: r.attempted, total: ids.length }) }
        : { tone: "success", text: t("toastCanceled", { count: ids.length }) });
    } catch (e) {
      setToast({ tone: "error", text: t("cancelFailed", { message: errorText(e, e instanceof Error ? e.message : t("cancelUnavailable")) }) });
    } finally {
      setCancelling(false);
      setAsking(null);
    }
  }

  const allLines = (loaded?.trips ?? []).map(toLine).sort(byDayAndTime);
  // The trips under way follow their vehicles live: phase, miles to go and the route's ETAs.
  const underWayIds = allLines.filter((l) => !l.canceled && UNDER_WAY.includes(l.trip.status ?? "")).map((l) => l.trip.id);
  const livePositions = useLiveTrips(underWayIds);
  const lines = allLines.filter((l) => tripMatches(l.trip, filter, statusLabel));
  const highlightMissing = highlightId !== null && loaded !== null && !allLines.some((l) => l.trip.id === highlightId);
  const multiDay = !!loaded && loaded.start !== loaded.end;

  // Brings the highlighted trip into view once the list has it. Rows, phone cards and timeline cards
  // are all keyed; the visible one is the one with a layout box.
  useEffect(() => {
    if (highlightId === null || !loaded) return;
    const target = [...highlightRefs.current.entries()]
      .filter(([key]) => key.endsWith(`:${highlightId}`))
      .map(([, el]) => el)
      .find((el) => el.offsetParent !== null);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightId, loaded, view]);

  const selectable = lines.filter((l) => !l.canceled);
  const allChecked = selectable.length > 0 && selectable.every((l) => selected.has(l.trip.tripId ?? ""));
  const summary = loaded ? summarize(loaded.trips, loaded.report) : null;

  const actions: TripActions = {
    selected,
    live: livePositions,
    highlightId,
    toggle: (l) => setSelected((s) => {
      const id = l.trip.tripId ?? "";
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    }),
    // Tracking is a page of its own (/trips/40233): it can be linked, and Back returns here as it was.
    track: (l) => { saveListState(); router.push(`/trips/${l.trip.id}`); },
    edit: (l) => setModal({ open: true, trip: l.trip }),
    cancel: (l) => setAsking([l]),
    rowRef: (layout, id) => (el) => {
      if (el) highlightRefs.current.set(`${layout}:${id}`, el);
      else highlightRefs.current.delete(`${layout}:${id}`);
    },
  };

  // NOW goes before the first trip of today still to come, only when the range includes today.
  const today = localToday();
  const tomorrow = nextDay(today);
  const includesToday = !!loaded && loaded.start <= today && loaded.end >= today && now !== null;
  const nowIndex = includesToday
    ? (() => {
      const i = lines.findIndex((l) => l.day > today || (l.day === today && (l.time ?? "99:99") > now!));
      return i === -1 ? lines.length : i;
    })()
    : -1;

  const day = (d: string) => format.dateTime(new Date(`${d}T12:00:00`), { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).replace(/[,.]/g, "");
  const rangeLabel = loaded ? (loaded.start === loaded.end ? day(loaded.start) : `${day(loaded.start)} → ${day(loaded.end)}`) : "";
  const countLabel = filter
    ? t("recordsFiltered", { shown: lines.length, total: allLines.length })
    : t("records", { count: allLines.length });

  const footer = loaded && lines.length > 0
    ? <div className={`${MONO} px-[26px] pb-[26px] pt-4 text-xs uppercase text-[var(--ds-on-surface-variant)]`}>{t("endOfRecords", { shown: lines.length, total: allLines.length })}</div>
    : null;

  /**
   * The trips of the range loaded, all of them and whatever the search box says, as a SafeRide2 file
   * the Desktop can import (tripsCsv.ts). Built in this browser: the patients' data goes nowhere else.
   */
  function exportTrips() {
    if (!loaded) return;
    const patients = new Map((customers.data ?? []).map((c) => [c.id ?? -1, { riderId: c.riderId, dob: c.dob }]));
    downloadTripsCsv(buildTripsCsv(loaded.trips, patients, organization.data?.name ?? ""), tripsCsvFileName(loaded.start, loaded.end));
  }

  const newBooking = () => {
    // The original re-read the funding source on every New Booking (app.js:593): an FS
    // linked by an admin a minute ago enables booking without signing in again.
    void funding.refetch();
    setModal({ open: true, trip: null });
  };

  // What goes where the list would be when there is no list to draw.
  let state: ReactNode = null;
  if (loadState === "loading" && !loaded && !fundingError) state = <ListState kind="loading" view={view} />;
  else if (loadState === "error" || (fundingError && !loaded)) {
    state = <ListState kind="error" view={view} title={view === "timeline" && loaded ? t("liveInterrupted") : t("loadErrorTitle")}
      text={fundingError && !loaded ? t("initFailed", { message: fundingError }) : loadError}
      action={<DsButton kind="primary" onClick={() => void loadTrips()}>{t("retry")}</DsButton>} />;
  } else if (loaded && allLines.length === 0) {
    state = <ListState kind="empty" view={view} title={t("emptyDay", { date: rangeLabel })} text={t("emptyText")}
      action={<DsButton kind="tonal" onClick={newBooking}>{t("newBooking")}</DsButton>} />;
  } else if (loaded && filter && lines.length === 0) {
    state = <ListState kind="empty" view={view} title={t("noMatches", { term: filter })} text={t("noMatchesText", { total: allLines.length })}
      action={<DsButton kind="tonal" onClick={() => setFilter("")}>{t("clearSearch")}</DsButton>} />;
  }

  const inProgress = allLines.find((l) => l.key === "inprogress") ?? null;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[var(--ds-surface)]">
      {/* Title and the two main actions */}
      <div className="flex flex-wrap items-end gap-4 border-b border-[var(--ds-outline-variant)] px-4 pb-3.5 pt-5 sm:px-[26px]">
        <div className="min-w-0">
          <h1 className="text-[29px] font-semibold leading-[1.05] tracking-[-0.02em]">{t("title")}</h1>
          <div className={`${MONO} mt-1.5 text-[12.5px] uppercase text-[var(--ds-on-surface-variant)]`}>
            {loaded ? `${rangeLabel} · ${countLabel}` : " "}
          </div>
        </div>
        <ViewSwitch className="w-full sm:w-auto lg:hidden [&>button]:flex-1 [&>button]:justify-center" />
        <div className="flex w-full gap-2.5 sm:ml-auto sm:w-auto">
          {/* Always on screen, as in the original portal. Each option says why when there is nothing to export. */}
          <Menu look="ds" width={260} align="left" label={t("export")}
            buttonClassName="flex h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-[var(--ds-outline)] px-[18px] text-[13.5px] font-semibold text-[var(--ds-on-surface)] hover:bg-[var(--ds-selected)] sm:w-auto"
            trigger={<><PhDownloadSimple size={17} aria-hidden />{t("export")}<PhCaretDown size={12} aria-hidden /></>}
            items={[
              {
                key: "trips", label: t("exportTrips"), icon: PhRows,
                disabled: allLines.length === 0, hint: allLines.length === 0 ? t("exportTripsNothing") : undefined,
                onSelect: exportTrips,
              },
              {
                key: "report", label: t("exportReport"), icon: PhFileCsv,
                disabled: (loaded?.report.length ?? 0) === 0, hint: (loaded?.report.length ?? 0) === 0 ? t("exportNothing") : undefined,
                onSelect: () => downloadProductionCsv(loaded!.report, csvLocale, tCsv("fileName", { date: new Date().toISOString().split("T")[0] })),
              },
            ]} />
          <DsButton kind="tonal" icon={<PhPlus size={16} weight="bold" aria-hidden />} className="flex-1 sm:flex-none" onClick={newBooking}>
            {t("newBooking")}
          </DsButton>
        </div>
      </div>

      {/* Dates and search */}
      <div className="flex flex-wrap items-center gap-2.5 border-b border-[var(--ds-outline-variant)] bg-[var(--ds-subtle)] px-4 py-3 sm:px-[26px]">
        <label className="flex items-center gap-2">
          <span className={`${MONO} text-[11px] uppercase tracking-[0.1em] text-[var(--ds-on-surface-variant)]`}>{t("from")}</span>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} aria-label={t("startDate")}
            className={`${MONO} h-11 rounded-lg border border-[var(--ds-outline)] bg-[var(--ds-surface)] px-3 text-sm text-[var(--ds-on-surface)]`} />
        </label>
        <label className="flex items-center gap-2">
          <span className={`${MONO} text-[11px] uppercase tracking-[0.1em] text-[var(--ds-on-surface-variant)]`}>{t("to")}</span>
          <input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} aria-label={t("endDate")}
            className={`${MONO} h-11 rounded-lg border border-[var(--ds-outline)] bg-[var(--ds-surface)] px-3 text-sm text-[var(--ds-on-surface)]`} />
        </label>
        {/* An end before the start makes the backend throw (TripService.GetByDateRangeAsync → 500). */}
        <DsButton kind="primary" onClick={() => search()} disabled={searching || !start || !end || end < start} aria-busy={searching}
          icon={searching ? <PhCircleNotch size={16} className="animate-spin" aria-hidden /> : undefined}>{t("search")}</DsButton>
        <div className="flex h-11 overflow-hidden rounded-lg border border-[var(--ds-outline)]">
          {[[today, t("today")], [tomorrow, t("tomorrow")]].map(([d, label], i) => {
            const on = loaded?.start === d && loaded?.end === d;
            return (
              <button key={d} type="button" aria-pressed={on} disabled={searching} onClick={() => search(d, d)}
                className={`px-4 disabled:opacity-45 text-[13.5px] ${i === 0 ? "border-r border-[var(--ds-outline)]" : ""} ${on
                  ? "bg-[var(--ds-primary-container)] font-semibold text-[var(--ds-primary)]" : "font-medium text-[var(--ds-on-surface-variant)] hover:bg-[var(--ds-selected)]"}`}>
                {label}
              </button>
            );
          })}
        </div>
        {/* Find a trip among the loaded ones. Only in this browser: what is typed never leaves it. */}
        <div className="flex h-11 min-w-[240px] flex-1 items-center gap-[9px] rounded-lg border border-[var(--ds-outline)] bg-[var(--ds-surface)] px-3">
          <PhMagnifyingGlass size={17} aria-hidden className="text-[var(--ds-on-surface-variant)]" />
          <input type="search" value={filter} disabled={!loaded || allLines.length === 0} aria-label={t("filterLabel")}
            onChange={(e) => {
              // A selection must never include trips the filter hides: "Cancel selected" would cancel them unseen.
              setFilter(e.target.value);
              setSelected(new Set());
            }}
            placeholder={t("filterPlaceholder")}
            className="min-w-0 flex-1 bg-transparent text-sm text-[var(--ds-on-surface)] outline-none placeholder:text-[var(--ds-on-surface-variant)] [&::-webkit-search-cancel-button]:hidden" />
          {filter && (
            <button type="button" aria-label={t("clearSearch")} onClick={() => setFilter("")} className="flex text-[var(--ds-on-surface-variant)]">
              <PhXCircle size={17} aria-hidden />
            </button>
          )}
        </div>
      </div>

      {highlightMissing && (
        <div className="flex items-center gap-3 border-b border-[var(--ds-outline-variant)] bg-[var(--ds-warn-bg)] px-4 py-3 text-[13.5px] sm:px-[26px]">
          <PhWarningCircle size={20} weight="fill" aria-hidden className="shrink-0 text-[var(--ds-late-mark)]" />
          {t("highlightMissing", { id: highlightId, date: format.dateTime(new Date(`${loaded!.start}T12:00:00`), DATE_FORMAT) })}
        </div>
      )}

      {/* Summary band: the one warm note of the screen */}
      {summary && (
        <div className="flex flex-wrap items-center gap-y-3 border-b border-[var(--ds-outline-variant)] bg-[var(--ds-summary)] px-4 py-4 sm:px-[26px]">
          <div className="grid w-full grid-cols-2 gap-y-3 md:flex md:w-auto">
            <Stat label={t("bandTotal")} value={summary.totalTrips} first />
            <Stat label={t("bandBillable")} value={summary.billedTrips} />
            <Stat label={t("bandCanceled")} value={summary.canceledTrips} tone="text-[var(--ds-error)]" />
            <Stat label={t("bandBilledValue")} value={summary.totalBilledValue} tone="text-[var(--ds-money)]" />
          </div>
          <div className="ml-auto flex items-center gap-2.5">
            <span className={`${MONO} text-[12.5px] uppercase`}>{t("selectedShort", { count: selected.size })}</span>
            <button type="button" disabled={selected.size === 0}
              onClick={() => setAsking(allLines.filter((l) => selected.has(l.trip.tripId ?? "")))}
              className="h-11 rounded-lg border border-[var(--ds-error)] px-[15px] text-[13.5px] font-semibold text-[var(--ds-error)] disabled:opacity-40">
              {t("cancelSelectedShort")}
            </button>
          </div>
        </div>
      )}

      {/* The list, in the chosen view */}
      {state ?? (loaded && (view === "table"
        ? <TableView lines={lines} a={actions} multiDay={multiDay} allChecked={allChecked} footer={footer}
          onToggleAll={() => setSelected(allChecked ? new Set() : new Set(selectable.map((l) => l.trip.tripId ?? "")))} />
        : <TimelineView lines={lines} a={actions} multiDay={multiDay} nowIndex={nowIndex} nowTime={now ?? ""} footer={footer}
          peek={inProgress && (
            <div className="rounded-xl p-[11px] text-[#f2f8fb] [background:var(--ds-live-panel)]">
              <LiveEtaTicker trip={inProgress.trip} position={livePositions.get(inProgress.trip.id) ?? null} size="md" compact />
            </div>
          )}
          aside={<>
            <InProgressPanel line={inProgress} position={inProgress ? livePositions.get(inProgress.trip.id) ?? null : null} onTrack={(l) => { saveListState(); router.push(`/trips/${l.trip.id}`); }} />
            <NeedsAttention lines={allLines} onPick={(l) => { setFilter(""); setHighlightId(l.trip.id); }} />
          </>} />))}

      {asking && (
        <CancelDialog lines={asking} busy={cancelling} onKeep={() => setAsking(null)} onConfirm={() => void confirmCancel(asking)} />
      )}
      {toast && <ToastBar toast={toast} onClose={() => setToast(null)} />}

      {/* Maps JavaScript loads only when the form opens, never with the dashboard. */}
      {modal.open && <APIProvider apiKey={mapsKey} language={locale} region="US"><TripModal
        key={modal.trip?.id ?? "new"}
        trip={modal.trip}
        customers={customers.data ?? []}
        spaceTypes={spaceTypes.data ?? []}
        funding={funding.data}
        mapId={mapId}
        onClose={() => setModal({ open: false, trip: null })}
        onSaved={async (patientChanged) => {
          // The patient list is asked again only when this booking created or changed the patient.
          if (patientChanged) await customers.refetch();
          await loadTrips(start, end, true);
        }}
      /></APIProvider>}
    </div>
  );
}

function Stat({ label, value, tone = "", first }: { label: string; value: string | number; tone?: string; first?: boolean }) {
  return (
    <div className={`md:px-[34px] ${first ? "md:pl-0" : "md:border-l md:border-[var(--ds-summary-rule)]"}`}>
      <div className={`${MONO} text-[11px] uppercase tracking-[0.12em] text-[var(--ds-on-surface-variant)]`}>{label}</div>
      <div className={`mt-1 text-[26px] font-semibold leading-[1.1] tracking-[-0.02em] md:text-[31px] ${tone}`}>{value}</div>
    </div>
  );
}

/** The design's buttons: filled, tonal (New Booking), outline (Export). All 44 px. */
function DsButton({ kind, icon, children, className = "", ...rest }: {
  kind: "primary" | "tonal" | "outline"; icon?: ReactNode; children: ReactNode; className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">) {
  const look = {
    primary: "border-0 bg-[var(--ds-primary)] text-[var(--ds-on-primary)] font-bold",
    tonal: "border-[1.5px] border-[var(--ds-primary)] bg-[var(--ds-primary-container)] text-[var(--ds-primary)]",
    outline: "border border-[var(--ds-outline)] text-[var(--ds-on-surface)] hover:bg-[var(--ds-selected)]",
  }[kind];
  return (
    <button type="button" {...rest}
      className={`flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-[18px] text-[13.5px] font-semibold disabled:cursor-not-allowed disabled:opacity-45 ${look} ${className}`}>
      {icon}{children}
    </button>
  );
}
