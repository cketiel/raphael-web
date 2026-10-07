"use client";

import type { Schemas } from "@raphael/api-client";
import { api } from "@/lib/bff";

export type PlaceDetails = Schemas["PlaceDetailsDto"];

/** Tells the backend what this browser bought from Google, so the usage panel sees it (MAPS_POLICY §4.1). */
export function reportUsage(sku: "DynamicMaps" | "PlacesAutocomplete" | "PlaceDetails", count = 1) {
  void api("routing/usage", { method: "POST", body: JSON.stringify({ items: [{ sku, count }] }) }).catch(() => undefined);
}

function component(place: google.maps.places.Place, type: string, short = false) {
  const c = place.addressComponents?.find((x) => x.types.includes(type));
  return (short ? c?.shortText : c?.longText) ?? null;
}

/**
 * The language Maps is loaded in (BookingDashboard passes it to the APIProvider). Google writes the address
 * in it, and the backend caches each language apart, so it goes with every lookup and store.
 */
export const MAPS_LANGUAGE = "en";

/**
 * Write-behind cache (MAPS_POLICY §5.1): ask the backend first; only when nobody has looked this
 * place up yet, buy it with the browser key and hand it to the backend so the next user gets it free.
 */
export async function resolvePlace(prediction: google.maps.places.PlacePrediction): Promise<PlaceDetails> {
  const cached = await api<PlaceDetails>(
    `routing/place/${encodeURIComponent(prediction.placeId)}?language=${MAPS_LANGUAGE}`,
  ).catch(() => null);
  if (cached?.status === "Ok") return cached;

  const place = prediction.toPlace();
  // Reported before the call, as Desktop does (raphael-maps.js:481): Google bills the request
  // even when it fails afterwards.
  reportUsage("PlaceDetails");
  await place.fetchFields({ fields: ["location", "formattedAddress", "addressComponents"] });

  const streetNumber = component(place, "street_number");
  const route = component(place, "route");
  const details: PlaceDetails = {
    placeId: prediction.placeId,
    latitude: place.location?.lat() ?? 0,
    longitude: place.location?.lng() ?? 0,
    formattedAddress: place.formattedAddress ?? prediction.text.text,
    street: [streetNumber, route].filter(Boolean).join(" ") || null,
    city: component(place, "locality") ?? component(place, "sublocality"),
    state: component(place, "administrative_area_level_1", true),
    zip: component(place, "postal_code"),
    language: MAPS_LANGUAGE,
    status: "Ok",
    source: "Google",
  };

  void api("routing/place", { method: "POST", body: JSON.stringify(details) }).catch(() => undefined);
  return details;
}
