import { getTranslations } from "next-intl/server";
import { BookingDashboard } from "@/features/booking/BookingDashboard";
import { getSession } from "@/server/session";

/** Trips: the signed-in layout has already checked the session and drawn the header. */
export default async function TripsPage() {
  const session = await getSession();
  const t = await getTranslations();
  // Read at request time, not at build time: changing the key in Azure's App Settings needs a
  // restart, never a rebuild (CLIENT_CONFIG_POLICY). Public by Google's design: the referrer
  // restriction and the daily quota are what protect it.
  const mapsKey = process.env.GOOGLE_MAPS_BROWSER_KEY ?? "";
  const mapId = process.env.GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

  return mapsKey ? (
    <BookingDashboard isIntegrator={session.user?.integratorId != null} mapsKey={mapsKey} mapId={mapId} />
  ) : (
    <p className="p-6 text-sm text-red-600">{t("nav.mapsKeyMissing")}</p>
  );
}
