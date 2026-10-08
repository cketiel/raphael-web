"use client";

import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { CONTROL } from "@/components/ui/Form";
import { IconCheckCircle, IconPin } from "@/components/ui/Icon";
import { reportUsage, resolvePlace, type PlaceDetails } from "./places";

const DEBOUNCE_MS = 250;
const MIN_CHARS = 3;

interface AddressInputProps {
  id: string;
  value: string;
  placeholder: string;
  /** Pin colour: red for the pickup, blue for the drop-off, as on the map. */
  tone: "pickup" | "dropoff";
  /** The coordinates belong to the text: chosen from the suggestions, dragged on the map, or saved with the trip. */
  resolved: boolean;
  required?: boolean;
  /** The user typed: the text no longer matches the coordinates until a suggestion is chosen. */
  onTextChange: (text: string) => void;
  onPlace: (place: PlaceDetails) => void;
}

/**
 * Address box with Places (New) suggestions and our own list, as Desktop does (MAPS_POLICY §6.1):
 * session token, 250 ms debounce, 3 characters minimum, US only.
 * Choosing a suggestion goes through the backend place cache first (places.ts).
 *
 * The list is a combobox: arrows move, Enter chooses, Escape closes. Each suggestion shows the place
 * on one line and its address on the next, the way people look for a clinic or a home.
 */
export function AddressInput({ id, value, placeholder, tone, resolved, required, onTextChange, onPlace }: AddressInputProps) {
  const places = useMapsLibrary("places");
  const locale = useLocale();
  const t = useTranslations("trip");
  const listId = useId();
  const [suggestions, setSuggestions] = useState<google.maps.places.PlacePrediction[]>([]);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState(false);
  const [active, setActive] = useState(-1);
  const sessionRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  const searchable = !!places && typed && value.trim().length >= MIN_CHARS;
  const visible = searchable ? suggestions : [];
  const showList = open && visible.length > 0;

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
      setActive(-1);
      setOpen(true);
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [places, value, searchable]);

  async function choose(prediction: google.maps.places.PlacePrediction) {
    setOpen(false);
    setTyped(false);
    const details = await resolvePlace(prediction, locale);
    sessionRef.current = null; // Google bills the session; it ends with the choice.
    onPlace(details);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showList) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % visible.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a <= 0 ? visible.length - 1 : a - 1)); }
    else if (e.key === "Enter" && active >= 0) { e.preventDefault(); void choose(visible[active]); }
    else if (e.key === "Escape") { e.stopPropagation(); setOpen(false); }
  }

  const pinColor = tone === "pickup" ? "text-danger" : "text-info";

  return (
    <div className="relative">
      <span className={`pointer-events-none absolute inset-y-0 left-3 flex items-center ${pinColor}`}><IconPin size={18} aria-hidden /></span>
      <input id={id} value={value} placeholder={placeholder} required={required} autoComplete="off"
        role="combobox" aria-expanded={showList} aria-controls={listId} aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        onChange={(e) => { setTyped(true); onTextChange(e.target.value); }}
        onKeyDown={onKeyDown}
        onFocus={() => setOpen(visible.length > 0)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={`${CONTROL} h-11 pl-10 pr-10`} />
      {/* Confirmed: the pin on the map is this address. */}
      {resolved && value && (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-success" title={t("addressConfirmed")}>
          <IconCheckCircle size={16} aria-hidden />
          <span className="sr-only">{t("addressConfirmed")}</span>
        </span>
      )}
      {showList && (
        <div className="absolute z-[2000] mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-pop">
          <ul id={listId} role="listbox" className="max-h-72 overflow-y-auto py-1">
            {visible.map((p, i) => (
              <li key={p.placeId} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                <button type="button" tabIndex={-1} onMouseDown={(e) => e.preventDefault()} onClick={() => void choose(p)} onMouseEnter={() => setActive(i)}
                  className={`flex w-full items-start gap-3 px-3.5 py-2.5 text-left ${i === active ? "bg-brand-50" : ""}`}>
                  <IconPin size={16} aria-hidden className="mt-0.5 shrink-0 text-slate-400" />
                  <span className="min-w-0">
                    <span className="block truncate text-[0.95rem] font-semibold text-foreground">{p.mainText?.text ?? p.text.text}</span>
                    {p.secondaryText?.text && <span className="block truncate text-sm text-muted">{p.secondaryText.text}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {/* Google requires its attribution wherever its suggestions are listed. */}
          <p className="border-t border-border bg-surface-2 px-3.5 py-1.5 text-right text-[0.7rem] text-muted">Powered by Google</p>
        </div>
      )}
    </div>
  );
}
