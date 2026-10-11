import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { FeedbackProvider } from "@/components/Feedback";
import { ForcePasswordChange } from "@/features/account/ForcePasswordChange";
import { NotificationsProvider } from "@/features/notifications/NotificationsProvider";
import { RealtimeProvider } from "@/features/realtime/RealtimeProvider";
import { selectEnvironment } from "@/server/environments";
import { getSession, portalKind } from "@/server/session";
import { AppShell, NAV_COOKIE } from "./AppShell";

/** Every signed-in page: the frame (sections, top bar) and the live channels, opened once. */
export default async function SignedInLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session.user || !session.refreshToken) redirect("/login");

  // A password a clinic set for an external Provider's user: nothing else until its owner changes it.
  // The backend refuses every other call anyway; this only spares the user a page of errors.
  if (session.user.mustChangePassword) {
    return <FeedbackProvider><ForcePasswordChange /></FeedbackProvider>;
  }

  const t = await getTranslations();
  const environment = selectEnvironment();
  // A clinic's admin: role 1 with an integrator (CATALOG_MODEL.md, "Administrador de una clínica").
  const isClinicAdmin = session.user.role === "1" && session.user.integratorId != null;
  // An external Provider's user: its trips and nothing else. No live channels: it has no group to
  // hear, and its token stays on the server.
  const isProvider = portalKind(session.user) === "provider";

  return (
    <FeedbackProvider>
      <RealtimeProvider enabled={!isProvider}>
        <NotificationsProvider userId={session.user.userId} enabled={!isProvider}>
          <AppShell username={session.user.username} isClinicAdmin={isClinicAdmin} isProvider={isProvider}
            // Read on the server, as the theme is: the page never flashes the wide menu before folding it.
            navCollapsed={(await cookies()).get(NAV_COOKIE)?.value === "rail"}
            environmentBanner={environment.name !== "PROD" && (
              <div className="bg-amber-400 px-4 py-1 text-center text-xs font-bold text-amber-950">
                {t("nav.environment", { name: environment.name })}
              </div>
            )}>
            {children}
          </AppShell>
        </NotificationsProvider>
      </RealtimeProvider>
    </FeedbackProvider>
  );
}
