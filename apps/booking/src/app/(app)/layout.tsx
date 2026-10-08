import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { FeedbackProvider } from "@/components/Feedback";
import { NotificationsProvider } from "@/features/notifications/NotificationsProvider";
import { RealtimeProvider } from "@/features/realtime/RealtimeProvider";
import { selectEnvironment } from "@/server/environments";
import { getSession } from "@/server/session";
import { AppShell } from "./AppShell";

/** Every signed-in page: the frame (sections, top bar) and the live channels, opened once. */
export default async function SignedInLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session.user || !session.refreshToken) redirect("/login");

  const t = await getTranslations();
  const environment = selectEnvironment();
  // A clinic's admin: role 1 with an integrator (CATALOG_MODEL.md, "Administrador de una clínica").
  const isClinicAdmin = session.user.role === "1" && session.user.integratorId != null;

  return (
    <FeedbackProvider>
      <RealtimeProvider>
        <NotificationsProvider userId={session.user.userId}>
          <AppShell username={session.user.username} isClinicAdmin={isClinicAdmin}
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
