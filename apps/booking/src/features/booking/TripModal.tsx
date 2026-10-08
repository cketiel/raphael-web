"use client";

import type { Schemas } from "@raphael/api-client";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useFeedback } from "@/components/Feedback";
import { InfoTip } from "@/components/InfoTip";
import { useErrorText } from "@/i18n/useErrorText";
import { api } from "@/lib/bff";
import { AddressInput } from "@/features/maps/AddressInput";
import type { PlaceDetails } from "@/features/maps/places";
import { TripMap, type LatLng } from "@/features/maps/TripMap";
import type { Customer, FundingContext, SpaceType } from "./catalogs";
import {
  ATTACHMENT_EXTENSIONS, attachmentProblem, cityForSave, formatUsPhone, isValidDob, localToday,
  MIN_DOB, normalizeUsPhone, searchCustomers, toTimeInput,
} from "./rules";
import type { TripRead } from "./types";

/** Where a new booking's pins start (Booking Web app.js:10). */
const MIAMI: LatLng = { lat: 25.7617, lng: -80.1918 };

interface RoutePoint {
  address: string;
  coords: LatLng;
  city: string;
  /** True only when the coordinates belong to the text: chosen from suggestions, dragged, or loaded from the trip. */
  resolved: boolean;
}

interface FormState {
  internalId: string;
  custName: string;
  custPhone: string;
  custDOB: string;
  riderId: string;
  custGender: string;
  custAddress: string;
  custCity: string;
  custZip: string;
  tripDate: string;
  tripPickup: string;
  tripAppt: string;
  spaceType: string;
  fundingSource: string;
  pickupComment: string;
  dropoffComment: string;
  isRoundTrip: boolean;
  returnTime: string;
  roundTripPickupComment: string;
  roundTripDropoffComment: string;
}

const EMPTY_FORM: FormState = {
  internalId: "", custName: "", custPhone: "", custDOB: "", riderId: "", custGender: "Male",
  custAddress: "", custCity: "", custZip: "00000", tripDate: "", tripPickup: "", tripAppt: "",
  spaceType: "", fundingSource: "", pickupComment: "", dropoffComment: "", isRoundTrip: false,
  returnTime: "", roundTripPickupComment: "", roundTripDropoffComment: "",
};

const newPoint = (): RoutePoint => ({ address: "", coords: MIAMI, city: "N/A", resolved: false });

interface TripModalProps {
  /** The trip being edited, or null for a new booking. */
  trip: TripRead | null;
  customers: Customer[];
  spaceTypes: SpaceType[];
  funding: FundingContext | undefined;
  mapId: string;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

/**
 * The form as it opens. The parent mounts the modal afresh on every opening, so each one starts
 * clean. The original only reset the form for new bookings: an edit inherited the previous trip's
 * city, distance, round-trip switch and attachment, and could save them.
 */
function initialForm(trip: TripRead | null, customers: Customer[]): FormState {
  if (!trip) return EMPTY_FORM;
  const base: FormState = {
    ...EMPTY_FORM,
    internalId: String(trip.id),
    custName: trip.customerName ?? "",
    tripDate: trip.date.split("T")[0],
    tripPickup: toTimeInput(trip.fromTime),
    tripAppt: toTimeInput(trip.toTime),
    spaceType: trip.spaceTypeName ?? "",
    fundingSource: trip.fundingSourceName ?? "",
    pickupComment: trip.pickupComment ?? "",
    dropoffComment: trip.dropoffComment ?? "",
  };
  // The patient's own fields come from the customer list, as in the original (app.js:646-647).
  const c = customers.find((x) => x.id === trip.customerId);
  return c ? { ...base, ...customerFields(c, base.custDOB), custName: c.fullName || base.custName } : base;
}

function customerFields(c: Customer, currentDob: string) {
  return {
    custName: c.fullName || "",
    custPhone: formatUsPhone(c.phone || ""),
    riderId: c.riderId || "",
    // The backend stores "Unknown" for customers created by the portal. The original select had
    // only Male/Female, so such a value left it empty and "required" forced a choice. Same here.
    custGender: !c.gender ? "Male" : c.gender === "Male" || c.gender === "Female" ? c.gender : "",
    custAddress: c.address || "",
    custCity: c.city || "",
    custZip: c.zip || "00000",
    custDOB: c.dob ? c.dob.split("T")[0] : currentDob,
  };
}

function initialPoint(trip: TripRead | null, which: "pickup" | "dropoff"): RoutePoint {
  if (!trip) return newPoint();
  return which === "pickup"
    ? { address: trip.pickupAddress ?? "", coords: { lat: trip.pickupLatitude, lng: trip.pickupLongitude }, city: trip.pickupCity || "N/A", resolved: true }
    : { address: trip.dropoffAddress ?? "", coords: { lat: trip.dropoffLatitude, lng: trip.dropoffLongitude }, city: trip.dropoffCity || "N/A", resolved: true };
}

interface LegResult {
  key: string;
  polyline: string | null;
}

export function TripModal({ trip, customers, spaceTypes, funding, mapId, onClose, onSaved }: TripModalProps) {
  const feedback = useFeedback();
  const t = useTranslations("trip");
  const tc = useTranslations("common");
  const errorText = useErrorText();
  /** "N/A" is the form's own marker for "Google gave no town"; it is shown in the user's language. */
  const cityText = (city: string) => (city === "N/A" ? tc("notAvailable") : city);
  const [form, setForm] = useState<FormState>(() => initialForm(trip, customers));
  const [pickup, setPickup] = useState<RoutePoint>(() => initialPoint(trip, "pickup"));
  const [dropoff, setDropoff] = useState<RoutePoint>(() => initialPoint(trip, "dropoff"));
  const [distance, setDistance] = useState(() => (trip?.distance != null ? String(trip.distance) : "0"));
  const [leg, setLeg] = useState<LegResult | null>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const fundingName =
    funding?.kind === "integrator" ? funding.linked.name : funding?.kind === "integrator-unlinked" ? "" : form.fundingSource;
  const bookingDisabled = funding?.kind === "integrator-unlinked";

  // Saving sends whatever the form holds, so a missing city is an erased city: the original
  // overwrote it with "N/A" on every edit. my-trips returns the cities since backend B5; a trip that
  // still has none (saved blank, or read from a backend before B5) gets it looked up again from the
  // stored coordinates, through the backend cache. The address text is left exactly as it was saved.
  useEffect(() => {
    if (!trip) return;
    let cancelled = false;
    const lookUp = async (coords: LatLng, setter: typeof setPickup) => {
      const r = await api<Schemas["ReverseGeocodeResultDto"]>("routing/reverse-geocode", {
        method: "POST",
        body: JSON.stringify({ latitude: coords.lat, longitude: coords.lng } satisfies Schemas["ReverseGeocodeRequestDto"]),
      }).catch(() => null);
      if (!cancelled && r?.status === "Ok" && r.city) {
        setter((p) => (p.city === "N/A" && p.coords === coords ? { ...p, city: r.city! } : p));
      }
    };
    if (!trip.pickupCity) void lookUp(pickup.coords, setPickup);
    if (!trip.dropoffCity) void lookUp(dropoff.coords, setDropoff);
    return () => { cancelled = true; };
    // Once per opening: the coordinates are the ones the trip was saved with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectCustomer(c: Customer) {
    setForm((f) => ({ ...f, ...customerFields(c, f.custDOB) }));
    setSuggestOpen(false);
  }

  // Road distance and shape from the backend cache, priced at the trip's own date and pickup time.
  const samePoint = pickup.coords.lat === dropoff.coords.lat && pickup.coords.lng === dropoff.coords.lng;
  const legKey = `${pickup.coords.lat},${pickup.coords.lng}|${dropoff.coords.lat},${dropoff.coords.lng}|${form.tripDate}|${form.tripPickup}`;
  // Only the answer for the points on screen is drawn; a stale one is ignored rather than cleared.
  const polyline = !samePoint && leg?.key === legKey ? leg.polyline : null;

  useEffect(() => {
    if (samePoint) return;
    const body: Schemas["RouteLegsRequestDto"] = {
      legs: [{
        originLat: pickup.coords.lat, originLng: pickup.coords.lng,
        destLat: dropoff.coords.lat, destLng: dropoff.coords.lng,
        date: form.tripDate || null,
        departureTime: form.tripPickup ? `${form.tripPickup}:00` : null,
        includePolyline: true,
      }],
    };
    let cancelled = false;
    api<Schemas["RouteLegsResponseDto"]>("routing/legs", { method: "POST", body: JSON.stringify(body) })
      .then((r) => {
        const answer = r.legs?.[0];
        if (cancelled || !answer || answer.status !== "Ok") return;
        setDistance((answer.distanceMiles ?? 0).toFixed(2));
        setLeg({ key: legKey, polyline: answer.encodedPolyline ?? null });
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
    // legKey already encodes every input of the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legKey, samePoint]);

  function placeChosen(which: "pickup" | "dropoff", p: PlaceDetails) {
    const point: RoutePoint = {
      address: p.formattedAddress ?? "",
      coords: { lat: p.latitude ?? MIAMI.lat, lng: p.longitude ?? MIAMI.lng },
      city: p.city || "N/A",
      resolved: true,
    };
    (which === "pickup" ? setPickup : setDropoff)(point);
  }

  async function pinMoved(which: "pickup" | "dropoff", position: LatLng) {
    const setter = which === "pickup" ? setPickup : setDropoff;
    setter((p) => ({ ...p, coords: position }));
    // Address of the dropped pin through the backend cache, never the browser Geocoder (MAPS_POLICY §4).
    const r = await api<Schemas["ReverseGeocodeResultDto"]>("routing/reverse-geocode", {
      method: "POST",
      body: JSON.stringify({ latitude: position.lat, longitude: position.lng } satisfies Schemas["ReverseGeocodeRequestDto"]),
    }).catch(() => null);
    if (r?.status === "Ok" && r.formattedAddress) {
      setter({ address: r.formattedAddress, coords: position, city: r.city || "N/A", resolved: true });
    }
  }

  const customerMatches = searchCustomers(customers, form.custName);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // An address typed without choosing a suggestion kept the previous coordinates (Miami for a new
    // booking) and was saved that way: a trip routed to the wrong place. It is not accepted any more.
    if (!pickup.resolved || !dropoff.resolved) {
      await feedback.alert(t("needResolvedAddresses"));
      return;
    }
    const phone = normalizeUsPhone(form.custPhone);
    if (!phone) {
      await feedback.alert(t("invalidPhone"));
      return;
    }
    if (!isValidDob(form.custDOB)) {
      await feedback.alert(t("invalidDob"));
      return;
    }
    const file = fileRef.current?.files?.[0];
    const fileProblem = attachmentProblem(file);
    if (fileProblem) {
      await feedback.alert(t(fileProblem));
      return;
    }
    if (spaceTypes.length > 0 && !spaceTypes.some((s) => s.name === form.spaceType)) {
      await feedback.alert(t("chooseSpaceType"));
      return;
    }
    if (funding?.kind === "broker" && !funding.all.some((f) => f.name === form.fundingSource)) {
      await feedback.alert(t("chooseFundingSource"));
      return;
    }

    // Field names and values exactly as the original sent them (Booking Web app.js:426-471).
    const data = new FormData();
    data.append("InternalId", form.internalId);
    data.append("TripId", form.internalId || "NEW"); // satisfies [Required] on the DTO
    data.append("Date", form.tripDate);
    data.append("FromTime", form.tripPickup);
    data.append("ToTime", form.tripAppt);
    data.append("SpaceTypeName", form.spaceType);
    data.append("FundingSourceName", fundingName);
    data.append("CustomerFullName", form.custName);
    data.append("CustomerPhone", phone); // 10 digits, the way the backend's existing records hold it
    data.append("CustomerDOB", form.custDOB);
    data.append("CustomerGender", form.custGender);
    data.append("RiderId", form.riderId);
    data.append("CustomerAddress", form.custAddress);
    data.append("CustomerCity", form.custCity);
    data.append("CustomerZip", form.custZip);
    data.append("PickupAddress", pickup.address);
    data.append("PickupLatitude", String(pickup.coords.lat));
    data.append("PickupLongitude", String(pickup.coords.lng));
    data.append("PickupCity", cityForSave(pickup.city));
    data.append("DropoffAddress", dropoff.address);
    data.append("DropoffLatitude", String(dropoff.coords.lat));
    data.append("DropoffLongitude", String(dropoff.coords.lng));
    data.append("DropoffCity", cityForSave(dropoff.city));
    data.append("Distance", distance);
    data.append("PickupComment", form.pickupComment);
    data.append("DropoffComment", form.dropoffComment);
    data.append("IsRoundTrip", String(form.isRoundTrip));
    if (form.isRoundTrip) {
      data.append("ReturnTime", form.returnTime);
      data.append("RoundTripPickupComment", form.roundTripPickupComment);
      data.append("RoundTripDropoffComment", form.roundTripDropoffComment);
    }
    if (file) data.append("Attachment", file);

    try {
      await feedback.busy(async () => {
        await api("BookingPortal/sync-single", { method: "POST", body: data });
        onClose();
        await onSaved();
      });
      await feedback.alert(t("saved"));
    } catch (e) {
      await feedback.alert(errorText(e, t("saveFailed")));
    }
  }

  const input = "w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand";
  const small = "text-xs font-semibold text-muted";

  return (
    <div className="fixed inset-0 z-[1050] flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4" role="presentation">
      <form onSubmit={save} role="dialog" aria-modal="true" aria-labelledby="trip-modal-title"
        className="my-6 w-full max-w-6xl rounded-2xl bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border bg-slate-50 px-6 py-4">
          <h2 id="trip-modal-title" className="text-lg font-bold text-brand">{t("title")}</h2>
          <button type="button" onClick={onClose} aria-label={tc("close")} className="text-2xl leading-none text-muted hover:text-foreground">×</button>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-2">
          {/* Left column: patient and trip details */}
          <div>
            <Section title={t("patientSection")}>
              <div className="relative mb-2">
                <input className={input} placeholder={t("searchPatient")} autoComplete="off" required
                  value={form.custName}
                  onChange={(e) => { set("custName", e.target.value); setSuggestOpen(true); }}
                  onBlur={() => setTimeout(() => setSuggestOpen(false), 150)} />
                {suggestOpen && customerMatches.length > 0 && (
                  <ul className="absolute z-[1060] mt-1 max-h-[250px] w-full overflow-y-auto rounded-lg border border-border bg-surface shadow-lg">
                    {customerMatches.map((c) => (
                      <li key={c.id}>
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => selectCustomer(c)}
                          className="w-full px-3 py-2 text-left hover:bg-slate-100">
                          <span className="block text-sm font-bold text-brand">{c.fullName}</span>
                          <span className="text-xs text-muted">{t("riderIdShort", { id: c.riderId || tc("notAvailable") })}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label={t("phone")} className={small}><input type="tel" inputMode="tel" autoComplete="off" className={input} placeholder="(786) 555-0100" required value={form.custPhone}
                  onChange={(e) => set("custPhone", e.target.value)}
                  onBlur={() => { const p = normalizeUsPhone(form.custPhone); if (p) set("custPhone", formatUsPhone(p)); }} /></Field>
                <Field label={t("dob")} className={small}><input type="date" className={input} required min={MIN_DOB} max={localToday()} value={form.custDOB} onChange={(e) => set("custDOB", e.target.value)} /></Field>
                <Field label={t("riderId")} className={small}><input className={input} placeholder={t("riderId")} value={form.riderId} onChange={(e) => set("riderId", e.target.value)} /></Field>
                <Field label={t("gender")} className={small}>
                  <select className={input} required value={form.custGender} onChange={(e) => set("custGender", e.target.value)}>
                    <option value="" disabled hidden>{t("genderSelect")}</option>
                    <option value="Male">{t("male")}</option>
                    <option value="Female">{t("female")}</option>
                  </select>
                </Field>
                <Field label={t("homeAddress")} className={`${small} col-span-2`}><input className={input} placeholder={t("homeAddress")} required value={form.custAddress} onChange={(e) => set("custAddress", e.target.value)} /></Field>
                <Field label={t("city")} className={small}><input className={input} placeholder={t("city")} required value={form.custCity} onChange={(e) => set("custCity", e.target.value)} /></Field>
                <Field label={t("zip")} className={small}><input className={input} placeholder={t("zip")} required value={form.custZip} onChange={(e) => set("custZip", e.target.value)} /></Field>
              </div>
            </Section>

            <Section title={t("logisticsSection")}>
              <div className="grid grid-cols-4 gap-2">
                <Field label={t("date")} className="col-span-2 text-xs font-semibold"><input type="date" className={input} required value={form.tripDate} onChange={(e) => set("tripDate", e.target.value)} /></Field>
                <Field label={t("pickupTime")} className="text-xs font-semibold"><input type="time" className={input} required value={form.tripPickup} onChange={(e) => set("tripPickup", e.target.value)} /></Field>
                <Field label={t("apptTime")} className="text-xs font-semibold"><input type="time" className={input} value={form.tripAppt} onChange={(e) => set("tripAppt", e.target.value)} /></Field>
                <Field className="col-span-2 text-xs font-semibold"
                  label={<>{t("spaceType")}<InfoTip label={t("spaceTypeHelp")}><b>AMB:</b> {t("spaceTypeAmb")}<br /><b>WCH:</b> {t("spaceTypeWch")}<br /><b>STR:</b> {t("spaceTypeStr")}</InfoTip></>}>
                  <input list="spaceList" className={input} placeholder={t("spaceTypePlaceholder")} required value={form.spaceType} onChange={(e) => set("spaceType", e.target.value)} />
                  <datalist id="spaceList">{spaceTypes.map((s) => <option key={s.id} value={s.name} />)}</datalist>
                </Field>
                <Field label={t("fundingSource")} className="col-span-2 text-xs font-semibold">
                  {funding?.kind === "broker" ? (
                    <>
                      <input list="fundingList" className={input} placeholder={t("fundingPlaceholder")} value={form.fundingSource} onChange={(e) => set("fundingSource", e.target.value)} />
                      <datalist id="fundingList">{funding.all.map((f) => <option key={f.id} value={f.name} />)}</datalist>
                    </>
                  ) : (
                    <>
                      <input readOnly value={fundingName} placeholder={bookingDisabled ? t("fundingDisabled") : tc("loading")}
                        aria-invalid={bookingDisabled}
                        className={`${input} bg-slate-100 ${bookingDisabled ? "border-red-500" : ""}`} />
                      {bookingDisabled && (
                        <p className="mt-1 text-[0.7rem] text-red-600">{t("fundingMissing")}</p>
                      )}
                    </>
                  )}
                </Field>
              </div>
            </Section>

            <Section title={t("routeSection")}>
              <AddressInput id="pickupAddr" placeholder={t("pickupAddress")} required value={pickup.address}
                icon={<span className="text-[#dc3545]">●</span>}
                onTextChange={(text) => setPickup((p) => ({ ...p, address: text, resolved: false }))}
                onPlace={(p) => placeChosen("pickup", p)} />
              <div className="mt-1 mb-3 flex justify-between px-1 text-xs text-muted">
                <span>{t.rich("cityValue", { city: cityText(pickup.city), b: (chunks) => <b>{chunks}</b> })}</span>
                <span>{t.rich("distanceValue", { distance, b: (chunks) => <b>{chunks}</b> })}</span>
              </div>
              <AddressInput id="dropoffAddr" placeholder={t("dropoffAddress")} required value={dropoff.address}
                icon={<span className="text-[#0d6efd]">●</span>}
                onTextChange={(text) => setDropoff((p) => ({ ...p, address: text, resolved: false }))}
                onPlace={(p) => placeChosen("dropoff", p)} />
              <div className="mt-1 mb-3 px-1 text-xs text-muted">{t.rich("cityValue", { city: cityText(dropoff.city), b: (chunks) => <b>{chunks}</b> })}</div>

              {/* Only when booking: nothing links a return to its outbound trip, so an edit cannot
                  find the one already booked. The backend refuses it too; the return is edited on its own. */}
              {!trip && (
                <div className="rounded-lg border border-border bg-slate-50 p-2">
                  <label className="flex items-center gap-2 text-sm font-bold">
                    <input type="checkbox" role="switch" checked={form.isRoundTrip} onChange={(e) => set("isRoundTrip", e.target.checked)} />
                    {t("roundTrip")}
                  </label>
                  {form.isRoundTrip && (
                    // Required here and by the backend, which used to skip a return without a time and say nothing.
                    <input type="time" aria-label={t("returnTime")} required className={`${input} mt-2`} value={form.returnTime} onChange={(e) => set("returnTime", e.target.value)} />
                  )}
                </div>
              )}
            </Section>
          </div>

          {/* Right column: map and notes */}
          <div className="md:border-l md:border-border md:pl-6">
            <p className="mb-2 text-sm font-bold text-muted">{t("mapTitle")}</p>
            <TripMap mapId={mapId} pickup={pickup.coords} dropoff={dropoff.coords} polyline={polyline} onPinMoved={pinMoved} />

            <div className="mt-3 space-y-2">
              <Field className={small}
                label={<>{t("pickupInstructions")}<InfoTip label={t("pickupExamples")}>{t.rich("pickupExamplesText", { br: () => <br /> })}</InfoTip></>}>
                <textarea className={input} rows={2} placeholder={t("pickupPlaceholder")} value={form.pickupComment} onChange={(e) => set("pickupComment", e.target.value)} />
              </Field>
              <Field className={small}
                label={<>{t("dropoffInstructions")}<InfoTip label={t("dropoffExamples")}>{t.rich("dropoffExamplesText", { br: () => <br /> })}</InfoTip></>}>
                <textarea className={input} rows={2} placeholder={t("dropoffPlaceholder")} value={form.dropoffComment} onChange={(e) => set("dropoffComment", e.target.value)} />
              </Field>

              {form.isRoundTrip && (
                <div className="rounded-lg border border-border bg-slate-50 p-2">
                  <p className="text-xs font-bold text-brand">{t("returnNotes")}</p>
                  <textarea className={`${input} mt-1`} rows={1} placeholder={t("returnPickupPlaceholder")} value={form.roundTripPickupComment} onChange={(e) => set("roundTripPickupComment", e.target.value)} />
                  <textarea className={`${input} mt-2`} rows={1} placeholder={t("returnDropoffPlaceholder")} value={form.roundTripDropoffComment} onChange={(e) => set("roundTripDropoffComment", e.target.value)} />
                </div>
              )}

              <Field label={t("attachment")} className={small}>
                <input ref={fileRef} type="file" accept={`${ATTACHMENT_EXTENSIONS.join(",")},application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document`}
                  onChange={async (e) => {
                    const problem = attachmentProblem(e.target.files?.[0]);
                    if (problem) { e.target.value = ""; await feedback.alert(t(problem)); }
                  }}
                  className={`${input} file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1`} />
              </Field>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border bg-slate-50 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg bg-slate-500 px-4 py-2 text-sm font-bold text-white">{tc("close")}</button>
          <button type="submit" disabled={bookingDisabled || !funding}
            className="rounded-lg bg-brand px-10 py-2 text-sm font-bold uppercase text-white shadow-sm disabled:opacity-50">
            {t("save")}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="mb-4">
      <legend className="mb-2 text-sm font-bold">{title}</legend>
      {children}
    </fieldset>
  );
}

function Field({ label, className, children }: { label: ReactNode; className?: string; children: ReactNode }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1 block">{label}</span>
      {children}
    </label>
  );
}
