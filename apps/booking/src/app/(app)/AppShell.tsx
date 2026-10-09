"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ComponentType, ReactNode } from "react";
import { UserMenu } from "@/features/account/UserMenu";
import { useNotifications } from "@/features/notifications/NotificationsProvider";
import { NotificationBell } from "@/features/realtime/NotificationBell";
import { IconAdmin, IconBell, IconCatalog, IconTrips } from "@/components/ui/Icon";
import { LanguageMenu } from "./LanguageMenu";

type IconComponent = ComponentType<{ size?: number | string; className?: string; "aria-hidden"?: boolean }>;

interface Section {
  href: string;
  key: "trips" | "catalog" | "notifications" | "admin";
  icon: IconComponent;
  adminOnly?: boolean;
}

/** The portal's sections. Each one is a page; more will come (members, settings…). */
const SECTIONS: Section[] = [
  { href: "/", key: "trips", icon: IconTrips },
  { href: "/catalog", key: "catalog", icon: IconCatalog },
  { href: "/notifications", key: "notifications", icon: IconBell },
  { href: "/admin", key: "admin", icon: IconAdmin, adminOnly: true },
];

/**
 * The frame of every signed-in page.
 * - From 1024 px: a dark sidebar with the sections, and a white top bar with language, bell and user.
 * - Below: a compact top bar and the sections as a bottom bar, under the thumb, as a phone app.
 * `isClinicAdmin` only decides whether Admin is drawn: the page and the backend check it again.
 */
export function AppShell({ username, isClinicAdmin, environmentBanner, children }: {
  username: string;
  isClinicAdmin: boolean;
  environmentBanner: ReactNode;
  children: ReactNode;
}) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { unread } = useNotifications();
  const sections = SECTIONS.filter((s) => !s.adminOnly || isClinicAdmin);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const badge = (key: Section["key"]) => (key === "notifications" && unread > 0 ? (unread > 99 ? "99+" : String(unread)) : null);

  return (
    <div className="min-h-dvh">
      {/* Sidebar: large screens */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-navy text-white lg:flex">
        <Brand />
        <nav aria-label={t("sections")} className="flex-1 space-y-1 px-3 py-4">
          {sections.map((s) => {
            const active = isActive(s.href);
            const count = badge(s.key);
            return (
              <Link key={s.href} href={s.href} aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] font-semibold transition-colors ${
                  active ? "bg-white/12 text-white shadow-[inset_3px_0_0_var(--brand-2)]" : "text-white/70 hover:bg-white/6 hover:text-white"
                }`}>
                <s.icon size={18} aria-hidden />
                <span className="flex-1">{t(`tabs.${s.key}`)}</span>
                {count && <span className="rounded-full bg-danger px-2 py-px text-xs font-bold text-white">{count}</span>}
              </Link>
            );
          })}
        </nav>
        <p className="px-6 pb-5 text-xs text-white/40">© Raphael · v{process.env.APP_VERSION}</p>
      </aside>

      <div className="flex min-h-dvh flex-col lg:pl-64">
        {environmentBanner}
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-surface/95 px-4 backdrop-blur sm:px-6">
          <div className="lg:hidden"><Brand compact /></div>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <LanguageMenu />
            <NotificationBell />
            <UserMenu username={username} />
          </div>
        </header>

        {/* Room at the bottom on phones for the section bar. */}
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-5 pb-28 sm:px-6 lg:px-8 lg:py-7 lg:pb-10">{children}</main>
      </div>

      {/* Bottom bar: phones and tablets */}
      <nav aria-label={t("sections")}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgb(15_31_46/0.06)] lg:hidden">
        <ul className="mx-auto flex max-w-xl">
          {sections.map((s) => {
            const active = isActive(s.href);
            const count = badge(s.key);
            return (
              <li key={s.href} className="flex-1">
                <Link href={s.href} aria-current={active ? "page" : undefined}
                  className={`relative flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold ${active ? "text-brand" : "text-muted"}`}>
                  {active && <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-brand" aria-hidden="true" />}
                  <span className="relative">
                    <s.icon size={21} aria-hidden />
                    {count && <span className="absolute -right-3 -top-2 min-w-5 rounded-full bg-danger px-1 text-center text-[0.65rem] font-bold leading-5 text-white">{count}</span>}
                  </span>
                  {t(`tabs.${s.key}`)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

/** The Raphael mark and the portal's name. */
function Brand({ compact }: { compact?: boolean }) {
  const t = useTranslations("nav");
  return (
    <Link href="/" className={`flex items-center gap-3 ${compact ? "" : "px-6 pb-2 pt-6"}`}>
      <span className={`flex items-center justify-center rounded-xl bg-white ${compact ? "size-9" : "size-10"}`}>
        <Image src="/brand/raphael-mark.png" alt="" width={28} height={28} priority unoptimized />
      </span>
      <span className="leading-tight">
        <span className={`block font-bold ${compact ? "text-base text-foreground" : "text-lg text-white"}`}>Raphael</span>
        <span className={`block text-xs ${compact ? "text-muted" : "text-white/60"}`}>{t("product")}</span>
      </span>
    </Link>
  );
}
