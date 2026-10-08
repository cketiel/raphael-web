import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FeedbackProvider } from "@/components/Feedback";
import { BookingDashboard } from "@/features/booking/BookingDashboard";
import { NotificationBell } from "@/features/realtime/NotificationBell";
import { RealtimeProvider } from "@/features/realtime/RealtimeProvider";
import { selectEnvironment } from "@/server/environments";
import { getSession } from "@/server/session";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SignOutButton } from "./SignOutButton";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session.user || !session.refreshToken) redirect("/login");

  const t = await getTranslations();
  const environment = selectEnvironment();
  // Read at request time, not at build time: changing the key in Azure's App Settings needs a
  // restart, never a rebuild (CLIENT_CONFIG_POLICY). Public by Google's design: the referrer
  // restriction and the daily quota are what protect it.
  const mapsKey = process.env.GOOGLE_MAPS_BROWSER_KEY ?? "";
  const mapId = process.env.GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

  return (
    <FeedbackProvider>
      <RealtimeProvider>
        {environment.name !== "PROD" && (
          <div className="bg-amber-400 px-4 py-1 text-center text-xs font-bold text-amber-950">
            {t("nav.environment", { name: environment.name })}
          </div>
        )}
        <nav className="flex flex-wrap items-center gap-2 bg-navy px-4 py-3 text-white shadow-sm sm:gap-4 sm:px-6">
          <span className="mr-auto font-bold sm:mr-0">{t("common.appName")}</span>
          <span className="ml-auto hidden text-sm font-bold sm:inline">{t("nav.user", { name: session.user.username })}</span>
          <NotificationBell />
          <LanguageSwitcher />
          <SignOutButton />
        </nav>
        {mapsKey ? (
          <BookingDashboard isIntegrator={session.user.integratorId != null} mapsKey={mapsKey} mapId={mapId} />
        ) : (
          <p className="p-6 text-sm text-red-600">{t("nav.mapsKeyMissing")}</p>
        )}
      </RealtimeProvider>
    </FeedbackProvider>
  );
}
