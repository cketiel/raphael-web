import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { FeedbackProvider } from "@/components/Feedback";
import { UserMenu } from "@/features/account/UserMenu";
import { NotificationsProvider } from "@/features/notifications/NotificationsProvider";
import { NotificationBell } from "@/features/realtime/NotificationBell";
import { RealtimeProvider } from "@/features/realtime/RealtimeProvider";
import { selectEnvironment } from "@/server/environments";
import { getSession } from "@/server/session";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NavTabs } from "./NavTabs";

/** Every signed-in page: the header, the section tabs and the live channels, opened once. */
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
          {environment.name !== "PROD" && (
            <div className="bg-amber-400 px-4 py-1 text-center text-xs font-bold text-amber-950">
              {t("nav.environment", { name: environment.name })}
            </div>
          )}
          <nav className="flex flex-wrap items-center gap-2 bg-navy px-4 py-3 text-white shadow-sm sm:gap-4 sm:px-6">
            <span className="mr-auto font-bold">{t("common.appName")}</span>
            <NotificationBell />
            <LanguageSwitcher />
            <UserMenu username={session.user.username} />
          </nav>
          <NavTabs isClinicAdmin={isClinicAdmin} />
          {children}
        </NotificationsProvider>
      </RealtimeProvider>
    </FeedbackProvider>
  );
}
