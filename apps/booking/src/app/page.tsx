import { redirect } from "next/navigation";
import { FeedbackProvider } from "@/components/Feedback";
import { BookingDashboard } from "@/features/booking/BookingDashboard";
import { selectEnvironment } from "@/server/environments";
import { getSession } from "@/server/session";
import { SignOutButton } from "./SignOutButton";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session.user || !session.refreshToken) redirect("/login");

  const environment = selectEnvironment();
  // Read at request time, not at build time: changing the key in Azure's App Settings needs a
  // restart, never a rebuild (CLIENT_CONFIG_POLICY). Public by Google's design: the referrer
  // restriction and the daily quota are what protect it.
  const mapsKey = process.env.GOOGLE_MAPS_BROWSER_KEY ?? "";
  const mapId = process.env.GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

  return (
    <FeedbackProvider>
      {environment.name !== "PROD" && (
        <div className="bg-amber-400 px-4 py-1 text-center text-xs font-bold text-amber-950">
          {environment.name} environment — not production
        </div>
      )}
      <nav className="flex items-center gap-4 bg-navy px-6 py-3 text-white shadow-sm">
        <span className="font-bold">Raphael Booking Portal</span>
        <span className="ml-auto text-sm font-bold">User: {session.user.username}</span>
        <SignOutButton />
      </nav>
      {mapsKey ? (
        <BookingDashboard isIntegrator={session.user.integratorId != null} mapsKey={mapsKey} mapId={mapId} />
      ) : (
        <p className="p-6 text-sm text-red-600">GOOGLE_MAPS_BROWSER_KEY is not configured on the server.</p>
      )}
    </FeedbackProvider>
  );
}
