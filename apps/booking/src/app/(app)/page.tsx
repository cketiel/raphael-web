import { getTranslations } from "next-intl/server";
import { BookingDashboard } from "@/features/booking/BookingDashboard";
import { getSession } from "@/server/session";

/** "?trip=40108&date=2026-10-08", from a notification's "View trip". Anything else is ignored. */
function readFocus(params: Record<string, string | string[] | undefined>) {
  const trip = typeof params.trip === "string" && /^\d{1,10}$/.test(params.trip) ? Number(params.trip) : null;
  const date = typeof params.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : null;
  return trip && date ? { tripId: trip, date } : null;
}

/** Trips: the signed-in layout has already checked the session and drawn the header. */
export default async function TripsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getSession();
  const t = await getTranslations();
  const focus = readFocus(await searchParams);
  // Read at request time, not at build time: changing the key in Azure's App Settings needs a
  // restart, never a rebuild (CLIENT_CONFIG_POLICY). Public by Google's design: the referrer
  // restriction and the daily quota are what protect it.
  const mapsKey = process.env.GOOGLE_MAPS_BROWSER_KEY ?? "";
  const mapId = process.env.GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

  return mapsKey ? (
    <BookingDashboard
      // A new "View trip" is a new list: remounting loads its day instead of keeping the previous one.
      key={focus ? `${focus.tripId}-${focus.date}` : "today"}
      focus={focus}
      isIntegrator={session.user?.integratorId != null} mapsKey={mapsKey} mapId={mapId} />
  ) : (
    <p className="p-6 text-sm text-red-600">{t("nav.mapsKeyMissing")}</p>
  );
}
