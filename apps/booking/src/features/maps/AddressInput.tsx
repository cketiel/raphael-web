"use client";

import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { reportUsage, resolvePlace, type PlaceDetails } from "./places";

const DEBOUNCE_MS = 250;
const MIN_CHARS = 3;

interface AddressInputProps {
  id: string;
  value: string;
  placeholder: string;
  icon: ReactNode;
  required?: boolean;
  /** The user typed: the text no longer matches the coordinates until a suggestion is chosen. */
  onTextChange: (text: string) => void;
  onPlace: (place: PlaceDetails) => void;
}

/**
 * Address box with Places (New) suggestions and our own list, as Desktop does (MAPS_POLICY §6.1):
 * session token, 250 ms debounce, 3 characters minimum, US only.
 * Choosing a suggestion goes through the backend place cache first (places.ts).
 */
export function AddressInput({ id, value, placeholder, icon, required, onTextChange, onPlace }: AddressInputProps) {
  const places = useMapsLibrary("places");
  const [suggestions, setSuggestions] = useState<google.maps.places.PlacePrediction[]>([]);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState(false);
  const sessionRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  const searchable = !!places && typed && value.trim().length >= MIN_CHARS;
  const visible = searchable ? suggestions : [];

  useEffect(() => {
    if (!places || !searchable) return;
    const handle = setTimeout(async () => {
      if (!sessionRef.current) sessionRef.current = new places.AutocompleteSessionToken();
      // One report per request, exactly as Desktop meters it (raphael-maps.js:421), so the
      // Admin › Google Maps panel adds both apps up on the same basis.
      reportUsage("PlacesAutocomplete");
      const result = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: value,
        sessionToken: sessionRef.current,
        includedRegionCodes: ["us"],
      }).catch(() => ({ suggestions: [] }));
      setSuggestions(result.suggestions.flatMap((s) => (s.placePrediction ? [s.placePrediction] : [])));
      setOpen(true);
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [places, value, searchable]);

  async function choose(prediction: google.maps.places.PlacePrediction) {
    setOpen(false);
    setTyped(false);
    const details = await resolvePlace(prediction);
    sessionRef.current = null; // Google bills the session; it ends with the choice.
    onPlace(details);
  }

  return (
    <div className="relative">
      <div className="flex overflow-hidden rounded-lg border border-border focus-within:border-brand">
        <span className="flex items-center bg-white px-3" aria-hidden="true">{icon}</span>
        <input id={id} value={value} placeholder={placeholder} required={required} autoComplete="off"
          onChange={(e) => { setTyped(true); onTextChange(e.target.value); }}
          onFocus={() => setOpen(visible.length > 0)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="w-full px-3 py-2 text-sm outline-none" />
      </div>
      {open && visible.length > 0 && (
        <ul className="absolute z-[2000] mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-surface shadow-lg">
          {visible.map((p) => (
            <li key={p.placeId}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => choose(p)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100">
                {p.text.text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
