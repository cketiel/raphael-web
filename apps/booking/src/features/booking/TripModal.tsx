"use client";

import type { Schemas } from "@raphael/api-client";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useFeedback } from "@/components/Feedback";
import { InfoTip } from "@/components/InfoTip";
import { Button } from "@/components/ui/Button";
import { Check, Field, FormSection, Input, Select, Textarea } from "@/components/ui/Form";
import {
  IconAttachment, IconCheckCircle, IconMap, IconPatient, IconPhone, IconRoundTrip, IconSearch, IconTrips,
} from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { useErrorText } from "@/i18n/useErrorText";
import { api } from "@/lib/bff";
import { AddressInput } from "@/features/maps/AddressInput";
import type { PlaceDetails } from "@/features/maps/places";
import { TripMap, type LatLng } from "@/features/maps/TripMap";
import { useAssignableProviders } from "@/features/catalog/catalogApi";
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
  /** After a save. `patientChanged`: the booking created the patient or changed its record. */
  onSaved: (patientChanged: boolean) => Promise<void>;
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
  // "" is Raphael, the default: the trip stays with the super broker.
  const [providerId, setProviderId] = useState(() => (trip?.providerId != null ? String(trip.providerId) : ""));
  // Only a clinic chooses among its contracted Providers; a broker user does not get the list.
  const isClinic = funding?.kind === "integrator" || funding?.kind === "integrator-unlinked";
  const assignable = useAssignableProviders();
  const providerOptions = [
    ...(assignable.data ?? []).map((p) => ({ id: String(p.providerId), name: p.name ?? "" })),
    // The office may have given the trip to a Provider this clinic has not contracted: it stays an option.
    ...(trip?.providerId != null && !(assignable.data ?? []).some((p) => p.providerId === trip.providerId)
      ? [{ id: String(trip.providerId), name: trip.providerName ?? `#${trip.providerId}` }]
      : []),
  ];
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
    if (isClinic) {
      // Always explicit: without SetProvider the backend leaves the trip's Provider as it is.
      data.append("SetProvider", "true");
      if (providerId) data.append("ProviderId", providerId);
    }

    // The backend creates or updates the patient from these fields. Only then is the patient list
    // stale: hundreds of rows are not asked for again after every booking.
    const known = customers.find((c) => (c.riderId ?? "") === form.riderId);
    const patientChanged = !known
      || (known.fullName ?? "") !== form.custName
      || (known.phone ?? "").replace(/\D/g, "").slice(-10) !== phone
      || (known.dob ?? "").slice(0, 10) !== form.custDOB
      || (known.gender ?? "") !== form.custGender
      || (known.address ?? "") !== form.custAddress
      || (known.city ?? "") !== form.custCity
      || (known.zip ?? "") !== form.custZip;

    try {
      await feedback.busy(async () => {
        await api("BookingPortal/sync-single", { method: "POST", body: data });
        onClose();
        await onSaved(patientChanged);
      });
      await feedback.alert(t("saved"));
    } catch (e) {
      await feedback.alert(errorText(e, t("saveFailed")));
    }
  }

  const fileAccept = `${ATTACHMENT_EXTENSIONS.join(",")},application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document`;

  return (
    <Modal size="xl" icon={IconTrips} labelledBy="trip-modal-title" onClose={onClose} onSubmit={save}
      title={trip ? t("editTitle", { id: trip.tripId || trip.id }) : t("title")}
      subtitle={trip ? trip.customerName : t("subtitle")}
      footer={<>
        {bookingDisabled && <p className="mr-auto text-sm text-danger">{t("fundingMissing")}</p>}
        <Button variant="secondary" onClick={onClose}>{tc("close")}</Button>
        <Button type="submit" icon={IconCheckCircle} disabled={bookingDisabled || !funding} className="min-w-44">{t("save")}</Button>
      </>}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
        {/* Left column: patient, logistics and route */}
        <div className="space-y-7">
          <FormSection step={1} title={t("patientSection")}>
            <div className="relative mb-3">
              <Input icon={IconSearch} placeholder={t("searchPatient")} autoComplete="off" required aria-label={t("searchPatient")}
                value={form.custName}
                onChange={(e) => { set("custName", e.target.value); setSuggestOpen(true); }}
                onBlur={() => setTimeout(() => setSuggestOpen(false), 150)} />
              {suggestOpen && customerMatches.length > 0 && (
                <ul className="absolute z-[1060] mt-1.5 max-h-64 w-full overflow-y-auto rounded-xl border border-border bg-surface py-1 shadow-pop">
                  {customerMatches.map((c) => (
                    <li key={c.id}>
                      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => selectCustomer(c)}
                        className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-brand-50">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700"><IconPatient size={14} aria-hidden /></span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{c.fullName}</span>
                          <span className="block text-sm text-muted">{t("riderIdShort", { id: c.riderId || tc("notAvailable") })}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("phone")} htmlFor="trip-phone" required>
                <Input id="trip-phone" type="tel" inputMode="tel" autoComplete="off" icon={IconPhone} placeholder="(786) 555-0100" required value={form.custPhone}
                  onChange={(e) => set("custPhone", e.target.value)}
                  onBlur={() => { const p = normalizeUsPhone(form.custPhone); if (p) set("custPhone", formatUsPhone(p)); }} />
              </Field>
              <Field label={t("dob")} htmlFor="trip-dob" required>
                <Input id="trip-dob" type="date" required min={MIN_DOB} max={localToday()} value={form.custDOB} onChange={(e) => set("custDOB", e.target.value)} />
              </Field>
              <Field label={t("riderId")} htmlFor="trip-rider">
                <Input id="trip-rider" placeholder={t("riderId")} value={form.riderId} onChange={(e) => set("riderId", e.target.value)} />
              </Field>
              <Field label={t("gender")} htmlFor="trip-gender" required>
                <Select id="trip-gender" required value={form.custGender} onChange={(e) => set("custGender", e.target.value)}>
                  <option value="" disabled hidden>{t("genderSelect")}</option>
                  <option value="Male">{t("male")}</option>
                  <option value="Female">{t("female")}</option>
                </Select>
              </Field>
              <Field label={t("homeAddress")} htmlFor="trip-home" required className="col-span-2">
                <Input id="trip-home" placeholder={t("homeAddress")} required value={form.custAddress} onChange={(e) => set("custAddress", e.target.value)} />
              </Field>
              <Field label={t("city")} htmlFor="trip-city" required>
                <Input id="trip-city" placeholder={t("city")} required value={form.custCity} onChange={(e) => set("custCity", e.target.value)} />
              </Field>
              <Field label={t("zip")} htmlFor="trip-zip" required>
                <Input id="trip-zip" placeholder={t("zip")} required value={form.custZip} onChange={(e) => set("custZip", e.target.value)} />
              </Field>
            </div>
          </FormSection>

          <FormSection step={2} title={t("logisticsSection")}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label={t("date")} htmlFor="trip-date" required className="col-span-2">
                <Input id="trip-date" type="date" required value={form.tripDate} onChange={(e) => set("tripDate", e.target.value)} />
              </Field>
              <Field label={t("pickupTime")} htmlFor="trip-pickup-time" required>
                <Input id="trip-pickup-time" type="time" required value={form.tripPickup} onChange={(e) => set("tripPickup", e.target.value)} />
              </Field>
              <Field label={t("apptTime")} htmlFor="trip-appt-time">
                <Input id="trip-appt-time" type="time" value={form.tripAppt} onChange={(e) => set("tripAppt", e.target.value)} />
              </Field>
              <Field label={t("spaceType")} htmlFor="trip-space" required className="col-span-2"
                tip={<InfoTip label={t("spaceTypeHelp")}><b>AMB:</b> {t("spaceTypeAmb")}<br /><b>WCH:</b> {t("spaceTypeWch")}<br /><b>STR:</b> {t("spaceTypeStr")}</InfoTip>}>
                <Input id="trip-space" list="spaceList" placeholder={t("spaceTypePlaceholder")} required value={form.spaceType} onChange={(e) => set("spaceType", e.target.value)} />
                <datalist id="spaceList">{spaceTypes.map((s) => <option key={s.id} value={s.name} />)}</datalist>
              </Field>
              <Field label={t("fundingSource")} htmlFor="trip-funding" className="col-span-2"
                error={bookingDisabled ? t("fundingMissing") : undefined}>
                {funding?.kind === "broker" ? (
                  <>
                    <Input id="trip-funding" list="fundingList" placeholder={t("fundingPlaceholder")} value={form.fundingSource} onChange={(e) => set("fundingSource", e.target.value)} />
                    <datalist id="fundingList">{funding.all.map((f) => <option key={f.id} value={f.name} />)}</datalist>
                  </>
                ) : (
                  <Input id="trip-funding" readOnly value={fundingName} placeholder={bookingDisabled ? t("fundingDisabled") : tc("loading")}
                    aria-invalid={bookingDisabled} />
                )}
              </Field>
              {isClinic && (
                <Field label={t("provider")} htmlFor="trip-provider" className="col-span-2 sm:col-span-4"
                  hint={!assignable.isLoading && providerOptions.length === 0 ? t("providerNoneContracted") : undefined}>
                  <Select id="trip-provider" value={providerId} onChange={(e) => setProviderId(e.target.value)}>
                    <option value="">{t("providerDefault")}</option>
                    {providerOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </Select>
                </Field>
              )}
            </div>
          </FormSection>

          <FormSection step={3} title={t("routeSection")}>
            <div className="space-y-4">
              <div>
                <label htmlFor="pickupAddr" className="mb-1.5 block text-sm font-semibold text-slate-700">{t("pickupAddress")}<span className="text-danger" aria-hidden="true"> *</span></label>
                <AddressInput id="pickupAddr" tone="pickup" resolved={pickup.resolved} placeholder={t("addressPlaceholder")} required value={pickup.address}
                  onTextChange={(text) => setPickup((p) => ({ ...p, address: text, resolved: false }))}
                  onPlace={(p) => placeChosen("pickup", p)} />
                <p className="mt-1.5 text-sm text-muted">{t.rich("cityValue", { city: cityText(pickup.city), b: (chunks) => <b className="text-foreground">{chunks}</b> })}</p>
              </div>
              <div>
                <label htmlFor="dropoffAddr" className="mb-1.5 block text-sm font-semibold text-slate-700">{t("dropoffAddress")}<span className="text-danger" aria-hidden="true"> *</span></label>
                <AddressInput id="dropoffAddr" tone="dropoff" resolved={dropoff.resolved} placeholder={t("addressPlaceholder")} required value={dropoff.address}
                  onTextChange={(text) => setDropoff((p) => ({ ...p, address: text, resolved: false }))}
                  onPlace={(p) => placeChosen("dropoff", p)} />
                <p className="mt-1.5 text-sm text-muted">{t.rich("cityValue", { city: cityText(dropoff.city), b: (chunks) => <b className="text-foreground">{chunks}</b> })}</p>
              </div>

              {/* Only when booking: nothing links a return to its outbound trip, so an edit cannot
                  find the one already booked. The backend refuses it too; the return is edited on its own. */}
              {!trip && (
                <div className="rounded-xl border border-border bg-surface-2 px-4 py-2">
                  <Check role="switch" label={<span className="flex items-center gap-2 font-semibold"><IconRoundTrip size={16} aria-hidden className="text-brand" />{t("roundTrip")}</span>}
                    checked={form.isRoundTrip} onChange={(e) => set("isRoundTrip", e.target.checked)} />
                  {form.isRoundTrip && (
                    // Required here and by the backend, which used to skip a return without a time and say nothing.
                    <Field label={t("returnTime")} htmlFor="trip-return" required className="mb-2 mt-1 max-w-48">
                      <Input id="trip-return" type="time" required value={form.returnTime} onChange={(e) => set("returnTime", e.target.value)} />
                    </Field>
                  )}
                </div>
              )}
            </div>
          </FormSection>
        </div>

        {/* Right column: map and notes */}
        <div className="space-y-5 lg:border-l lg:border-border lg:pl-8">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <IconMap size={16} aria-hidden className="text-brand" />
              <p className="font-bold">{t("mapTitle")}</p>
              <span className="ml-auto rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-800">
                {t.rich("distanceValue", { distance, b: (chunks) => <b>{chunks}</b> })}
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border border-border">
              <TripMap mapId={mapId} pickup={pickup.coords} dropoff={dropoff.coords} polyline={polyline} onPinMoved={pinMoved} />
            </div>
            <p className="mt-1.5 text-xs text-muted">{t("mapHint")}</p>
          </div>

          <Field label={t("pickupInstructions")} htmlFor="trip-pickup-notes"
            tip={<InfoTip label={t("pickupExamples")}>{t.rich("pickupExamplesText", { br: () => <br /> })}</InfoTip>}>
            <Textarea id="trip-pickup-notes" rows={2} placeholder={t("pickupPlaceholder")} value={form.pickupComment} onChange={(e) => set("pickupComment", e.target.value)} />
          </Field>
          <Field label={t("dropoffInstructions")} htmlFor="trip-dropoff-notes"
            tip={<InfoTip label={t("dropoffExamples")}>{t.rich("dropoffExamplesText", { br: () => <br /> })}</InfoTip>}>
            <Textarea id="trip-dropoff-notes" rows={2} placeholder={t("dropoffPlaceholder")} value={form.dropoffComment} onChange={(e) => set("dropoffComment", e.target.value)} />
          </Field>

          {form.isRoundTrip && (
            <div className="space-y-3 rounded-xl border border-brand-200 bg-brand-50/60 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-brand-800"><IconRoundTrip size={15} aria-hidden />{t("returnNotes")}</p>
              <Textarea rows={2} aria-label={t("returnPickupPlaceholder")} placeholder={t("returnPickupPlaceholder")} value={form.roundTripPickupComment} onChange={(e) => set("roundTripPickupComment", e.target.value)} />
              <Textarea rows={2} aria-label={t("returnDropoffPlaceholder")} placeholder={t("returnDropoffPlaceholder")} value={form.roundTripDropoffComment} onChange={(e) => set("roundTripDropoffComment", e.target.value)} />
            </div>
          )}

          <Field label={<span className="flex items-center gap-1.5"><IconAttachment size={14} aria-hidden />{t("attachment")}</span>} htmlFor="trip-file" hint={t("attachmentHint")}>
            <input id="trip-file" ref={fileRef} type="file" accept={fileAccept}
              onChange={async (e) => {
                const problem = attachmentProblem(e.target.files?.[0]);
                if (problem) { e.target.value = ""; await feedback.alert(t(problem)); }
              }}
              className="block w-full rounded-[var(--radius)] border border-dashed border-border-strong bg-surface px-3 py-2.5 text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:font-semibold file:text-brand-800 hover:border-brand-500" />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
