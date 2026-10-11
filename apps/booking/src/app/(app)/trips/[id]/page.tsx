import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { TripTrackingPage } from "@/features/tracking/TripTrackingPage";

/**
 * One trip's tracking, as a page of its own: /trips/40233. The id is the trip's database id; the
 * backend answers 404 for a trip that is not this clinic's, so nothing more is checked here.
 */
export default async function TripTrackingRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d{1,10}$/.test(id)) notFound();
  const t = await getTranslations();
  // Read at request time, as on Trips: changing the key in App Settings needs a restart, never a rebuild.
  const mapsKey = process.env.GOOGLE_MAPS_BROWSER_KEY ?? "";
  return mapsKey
    ? <TripTrackingPage tripId={Number(id)} mapsKey={mapsKey} />
    : <p className="p-6 text-sm text-red-600">{t("nav.mapsKeyMissing")}</p>;
}
