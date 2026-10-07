"use client";

import { useState, type FormEvent } from "react";

// Both environments declared; the build picks one explicitly (CLIENT_CONFIG_POLICY §2.1).
const API = {
  dev: "https://app-raphael-dev-scus.azurewebsites.net",
  prod: "https://api.raphaeldh.com",
}[process.env.NEXT_PUBLIC_RAPHAEL_API_ENV === "dev" ? "dev" : "prod"];

interface EtaRow {
  eventType: number;
  address: string;
  eta: string | null;
  perform: string | null;
  performed: boolean;
  driver: string | null;
  vehicle: string | null;
  patient: string | null;
}

/**
 * Proof of concept for the static export only. The full port (profile search, grouping and the
 * three status groups) comes later. React escapes everything it renders.
 */
export function EtaSearch() {
  const [rows, setRows] = useState<EtaRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const tripId = String(new FormData(event.currentTarget).get("tripId") ?? "").trim();
    if (!tripId) return;
    setError(null);
    const response = await fetch(`${API}/api/Schedules/patient-eta?${new URLSearchParams({ tripId })}`).catch(() => null);
    if (!response) return setError("We could not reach the tracking service. Try again in a moment.");
    if (response.status === 404) return setRows([]);
    if (!response.ok) return setError("Something went wrong. Try again in a moment.");
    setRows(await response.json());
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mt-6 flex gap-2">
        <input name="tripId" placeholder="Trip ID" className="flex-1 rounded-lg border px-3 py-2" />
        <button className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white">Search</button>
      </form>
      {error && <p role="alert" className="mt-4 text-red-600">{error}</p>}
      {rows?.length === 0 && <p className="mt-4">No results.</p>}
      <ul className="mt-4 space-y-3">
        {rows?.map((r, i) => (
          <li key={i} className="rounded-xl border p-4">
            <p className="font-semibold">{r.eventType === 1 ? "Pickup" : "Dropoff"} · {(r.performed ? r.perform : r.eta)?.slice(0, 5)}</p>
            <p className="text-sm">{r.address}</p>
            <p className="text-sm text-slate-500">{r.driver} · {r.vehicle}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
