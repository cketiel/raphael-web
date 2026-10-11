"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState, useSyncExternalStore, type ComponentType, type ReactNode } from "react";
import { PhBell, PhBuildings, PhCalendarBlank, PhShieldCheck } from "@/components/ui/Icon";
import { UserMenu, initials } from "@/features/account/UserMenu";
import { useOrganization } from "@/features/admin/adminApi";
import { TripsViewProvider, ViewSwitch } from "@/features/booking/TripsView";
import { tripsCache } from "@/features/booking/tripsCache";
import { useNotifications } from "@/features/notifications/NotificationsProvider";
import { ThemeToggle } from "@/features/preferences/ThemeToggle";
import { NotificationBell, STATUS_DOT } from "@/features/realtime/NotificationBell";
import { useRealtime } from "@/features/realtime/RealtimeProvider";
import { LanguageMenu, useChangeLanguage } from "./LanguageMenu";
import { PhGlobe, PhMoonStars, PhSun } from "@/components/ui/Icon";
import type { MenuItem } from "@/components/ui/Menu";
import { LOCALES } from "@/i18n/locale";
import { chooseTheme, currentTheme, subscribeTheme } from "@/lib/theme";

type PhIcon = ComponentType<{ size?: number | string; weight?: "regular" | "fill"; className?: string; "aria-hidden"?: boolean }>;

interface Section {
  href: string;
  key: "trips" | "catalog" | "notifications" | "admin";
  icon: PhIcon;
  adminOnly?: boolean;
}

/** The portal's sections. Each one is a page. */
const SECTIONS: Section[] = [
  { href: "/", key: "trips", icon: PhCalendarBlank },
  { href: "/catalog", key: "catalog", icon: PhBuildings },
  { href: "/notifications", key: "notifications", icon: PhBell },
  { href: "/admin", key: "admin", icon: PhShieldCheck, adminOnly: true },
];

/**
 * The frame of every signed-in page (design: Navigation, "one menu, three forms"):
 * - From 1280 px: the ocean sidebar of 260 px, and a white top bar.
 * - 1024 to 1279: the sidebar narrows to a 76 px rail of icons with short labels.
 * - 768 to 1023: the navigation climbs into an ocean header, the sections as tabs under the brand.
 * - Below 768: an ocean header with the brand, and the sections as a bottom bar under the thumb.
 * The four sections are one tap away at every size. `isClinicAdmin` only decides whether Admin is
 * drawn: the page and the backend check it again.
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
  const { status, onTripStatus } = useRealtime();
  // The Trips list kept for the way back stays true while it is not on screen (tripsCache).
  useEffect(() => onTripStatus((c) => tripsCache.applyStatus(c)), [onTripStatus]);
  // Only a clinic's admin can read the organization's record; anyone else has no source for its name yet.
  const organization = useOrganization(isClinicAdmin);
  const orgName = organization.data?.name ?? null;
  // While the name is on its way the place stays empty; red is only for "this user has no source".
  const orgLoading = isClinicAdmin && organization.isLoading;
  const roleLabel = isClinicAdmin ? t("roleAdmin") : t("roleUser");

  const sections = SECTIONS.filter((s) => !s.adminOnly || isClinicAdmin);
  // A trip's tracking page (/trips/40233) belongs to Trips.
  const isActive = (href: string) => (href === "/" ? pathname === "/" || pathname.startsWith("/trips/") : pathname.startsWith(href));
  const badge = (key: Section["key"]) => (key === "notifications" && unread > 0 ? (unread > 99 ? "99+" : String(unread)) : null);
  const onTrips = pathname === "/";
  // The tracking page is as tall as the window: the map fills what the header leaves.
  const fullHeight = pathname.startsWith("/trips/");

  // Below 640 px the header has no room for the theme and language buttons: they go in the user menu.
  const tTheme = useTranslations("theme");
  const tLang = useTranslations("language");
  const theme = useSyncExternalStore(subscribeTheme, currentTheme, () => "light" as const);
  const language = useChangeLanguage();
  const phoneExtras: MenuItem[] = [
    {
      key: "theme", separated: true,
      label: theme === "dark" ? tTheme("light") : tTheme("dark"),
      icon: theme === "dark" ? PhSun : PhMoonStars,
      onSelect: () => chooseTheme(theme === "dark" ? "light" : "dark"),
    },
    ...LOCALES.map((l, i) => ({
      key: `lang-${l}`, label: tLang(l), icon: i === 0 ? PhGlobe : undefined,
      selected: l === language.locale, onSelect: () => void language.change(l),
    })),
  ];

  const userMenu = (variant: "topbar" | "sidebar") => (
    <UserMenu username={username} roleLabel={roleLabel} variant={variant}
      organization={{ name: orgName, canOpen: isClinicAdmin }} />
  );

  return (
    <TripsViewProvider>
      <div className={`flex ${fullHeight ? "h-dvh" : "min-h-dvh"} bg-[var(--ds-background)] font-[family-name:var(--font-plex-sans)] text-[var(--ds-on-surface)] [color-scheme:var(--ds-color-scheme)]`}>
        {/* Sidebar, 1280 px and up */}
        <aside className="sticky top-0 hidden h-dvh w-[260px] shrink-0 flex-col overflow-y-auto bg-[linear-gradient(180deg,#0a4a66_0%,#073a52_55%,#05293a_100%)] xl:flex">
          <div className="pointer-events-none absolute left-[130px] top-[-40px] h-[200px] w-[260px] -translate-x-1/2 bg-[radial-gradient(circle,rgb(110_195_224/0.3),transparent_68%)]" />
          <Link href="/" className="relative flex flex-col items-center gap-2.5 px-[22px] pb-5 pt-[26px]">
            <Image src="/brand/raphael-pin.png" alt="" width={43} height={54} priority unoptimized className="h-[54px] w-[43px]" />
            <span className="pl-[0.26em] text-[17px] font-semibold tracking-[0.26em] text-white">RAPHAEL</span>
            <OrgName name={orgName} loading={orgLoading} className="text-center text-xs leading-[1.45] text-[var(--ds-on-brand-variant)]" />
          </Link>
          <div className="mx-[22px] mb-4 mt-1.5 h-px bg-[linear-gradient(90deg,transparent,rgb(154_213_236/0.34),transparent)]" />
          <nav aria-label={t("sections")} className="relative flex flex-col gap-[5px] px-3.5">
            {sections.map((s) => {
              const active = isActive(s.href);
              const count = badge(s.key);
              return (
                <Link key={s.href} href={s.href} aria-current={active ? "page" : undefined}
                  className={`relative flex h-12 items-center gap-3 rounded-[9px] px-3.5 ${active
                    ? "bg-[rgb(109_189_221/0.22)] text-white shadow-[inset_0_0_0_1px_rgb(154_213_236/0.34),0_0_24px_rgb(110_195_224/0.18)]"
                    : "text-[var(--ds-on-brand-variant)] hover:bg-white/5 hover:text-white"}`}>
                  {active && <span aria-hidden="true" className="absolute bottom-2.5 left-0 top-2.5 w-1 rounded-r bg-[#6ec3e0] shadow-[0_0_12px_rgb(110_195_224/0.8)]" />}
                  <s.icon size={20} weight={active ? "fill" : "regular"} aria-hidden className={active ? "text-[#9bdcf2]" : ""} />
                  <span className={`text-[15px] ${active ? "font-semibold" : "font-medium"}`}>{t(`tabs.${s.key}`)}</span>
                  {count && <span className="ml-auto flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-[#c0392b] px-[7px] text-xs font-bold text-white">{count}</span>}
                </Link>
              );
            })}
          </nav>
          <div className="relative mt-auto flex flex-col gap-3 px-4 pb-5 pt-[18px]">
            <div className="flex h-9 items-center gap-2 rounded-lg bg-white/[0.08] px-3 text-xs font-medium text-[var(--ds-on-brand-variant)]">
              <span aria-hidden="true" className={`ds-pulse size-2 rounded-full ${STATUS_DOT[status]}`} />
              {t(`live.${status}`)}
            </div>
            {userMenu("sidebar")}
          </div>
        </aside>

        {/* Rail, 1024 to 1279 px */}
        <aside className="sticky top-0 hidden h-dvh w-[76px] shrink-0 flex-col items-center gap-2 bg-[linear-gradient(180deg,#0a4a66,#073a52_55%,#05293a)] pb-3.5 pt-4 lg:flex xl:hidden">
          <Link href="/" aria-label="Raphael"><Image src="/brand/raphael-pin.png" alt="" width={34} height={43} unoptimized className="h-[43px] w-[34px]" /></Link>
          <div className="mb-1.5 mt-2.5 h-px w-9 bg-[rgb(154_213_236/0.34)]" />
          <nav aria-label={t("sections")} className="flex flex-col items-center gap-2">
            {sections.map((s) => {
              const active = isActive(s.href);
              const count = badge(s.key);
              return (
                <Link key={s.href} href={s.href} aria-current={active ? "page" : undefined}
                  className={`relative flex size-14 flex-col items-center justify-center gap-0.5 rounded-[11px] ${active
                    ? "bg-[rgb(109_189_221/0.22)] shadow-[inset_0_0_0_1px_rgb(154_213_236/0.34)]" : "hover:bg-white/5"}`}>
                  {active && <span aria-hidden="true" className="absolute -left-2.5 bottom-3 top-3 w-1 rounded-r bg-[#6ec3e0] shadow-[0_0_10px_rgb(110_195_224/0.8)]" />}
                  <s.icon size={21} weight={active ? "fill" : "regular"} aria-hidden className={active ? "text-[#9bdcf2]" : "text-[var(--ds-on-brand-variant)]"} />
                  <span className={`text-[9.5px] font-semibold ${active ? "text-white" : "text-[var(--ds-on-brand-variant)]"}`}>{t(`short.${s.key}`)}</span>
                  {count && <span className="absolute right-[9px] top-2 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#c0392b] px-1 text-[10px] font-bold text-white">{count}</span>}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto flex flex-col items-center gap-2.5">
            <span aria-hidden="true" title={t(`live.${status}`)} className={`ds-pulse size-2 rounded-full ${STATUS_DOT[status]}`} />
            <span className="flex size-11 items-center justify-center rounded-full bg-[linear-gradient(140deg,#5ab6dd,#0a5c7e)] text-[13px] font-bold text-white" aria-hidden="true">{initials(username)}</span>
          </div>
        </aside>

        <div className={`flex min-w-0 flex-1 flex-col ${fullHeight ? "h-dvh" : ""}`}>
          {environmentBanner}

          {/* Ocean header, below 1024 px: the brand, the controls and, on tablets, the sections as tabs. */}
          <header className="sticky top-0 z-30 bg-[linear-gradient(135deg,#0a4a66,#05293a)] lg:hidden">
            <div className="flex h-16 items-center gap-2 px-4">
              <Link href="/" className="flex min-w-0 items-center gap-2.5">
                <Image src="/brand/raphael-pin.png" alt="" width={26} height={33} unoptimized className="h-[33px] w-[26px]" />
                <span className="min-w-0 leading-tight">
                  <span className="block text-sm font-semibold tracking-[0.2em] text-white">RAPHAEL</span>
                  <OrgName name={orgName} loading={orgLoading} className="block truncate text-[11px] text-[var(--ds-on-brand-variant)]" />
                </span>
              </Link>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="hidden sm:block"><ThemeToggle onBrand /></div>
                <div className="hidden sm:block"><LanguageMenu onBrand /></div>
                <NotificationBell onBrand />
                <div className="sm:hidden">
                  <UserMenu username={username} roleLabel={roleLabel} variant="brand" extra={phoneExtras} organization={{ name: orgName, canOpen: isClinicAdmin }} />
                </div>
                <div className="hidden sm:block">
                  <UserMenu username={username} roleLabel={roleLabel} variant="brand" organization={{ name: orgName, canOpen: isClinicAdmin }} />
                </div>
              </div>
            </div>
            <nav aria-label={t("sections")} className="hidden gap-1.5 px-4 md:flex">
              {sections.map((s) => {
                const active = isActive(s.href);
                const count = badge(s.key);
                return (
                  <Link key={s.href} href={s.href} aria-current={active ? "page" : undefined}
                    className={`flex h-12 items-center gap-2 rounded-t-[10px] px-3.5 text-sm font-semibold ${active
                      ? "bg-[var(--ds-background)] text-[var(--ds-primary)]" : "text-white hover:bg-white/10"}`}>
                    <s.icon size={18} weight={active ? "fill" : "regular"} aria-hidden />
                    {t(`tabs.${s.key}`)}
                    {count && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c0392b] px-1.5 text-[11px] font-bold text-white">{count}</span>}
                  </Link>
                );
              })}
            </nav>
          </header>

          {/* Top bar, 1024 px and up */}
          <header className="sticky top-0 z-30 hidden h-[68px] shrink-0 items-center gap-3.5 border-b border-[var(--ds-outline-variant)] bg-[var(--ds-surface)] px-[26px] lg:flex">
            <LiveClock />
            <div className="ml-auto flex items-center gap-3">
              {onTrips && <ViewSwitch />}
              <ThemeToggle />
              <LanguageMenu />
              <NotificationBell />
              {userMenu("topbar")}
            </div>
          </header>

          {/* Room at the bottom on phones for the section bar. */}
          <main className="flex min-h-0 flex-1 flex-col pb-[84px] md:pb-0">
            {/* Trips draws edge to edge, as designed; the pages not rebuilt yet keep their old margins. */}
            {onTrips || fullHeight ? children : <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">{children}</div>}
          </main>
        </div>

        {/* Bottom bar, below 768 px */}
        <nav aria-label={t("sections")}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--ds-outline-variant)] bg-[var(--ds-surface)] px-2 pb-[max(6px,env(safe-area-inset-bottom))] pt-2 md:hidden">
          <ul className="grid grid-flow-col auto-cols-fr gap-1">
            {sections.map((s) => {
              const active = isActive(s.href);
              const count = badge(s.key);
              return (
                <li key={s.href}>
                  <Link href={s.href} aria-current={active ? "page" : undefined}
                    className={`flex h-14 flex-col items-center justify-center gap-[3px] rounded-xl ${active ? "bg-[var(--ds-primary-container)] text-[var(--ds-primary)]" : "text-[var(--ds-on-surface-variant)]"}`}>
                    <span className="relative">
                      <s.icon size={22} weight={active ? "fill" : "regular"} aria-hidden />
                      {count && <span className="absolute -right-[7px] -top-[3px] flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--ds-badge)] px-1 text-[9.5px] font-bold text-white">{count}</span>}
                    </span>
                    <span className={`text-[10.5px] ${active ? "font-bold" : "font-medium"}`}>{t(`short.${s.key}`)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </TripsViewProvider>
  );
}

/** The organization's name, or a red placeholder while it has no source for this user. */
function OrgName({ name, loading, className }: { name: string | null; loading: boolean; className: string }) {
  const t = useTranslations("nav");
  if (loading) return <span className={className}>&nbsp;</span>;
  return name
    ? <span className={className}>{name}</span>
    : <span className={`${className} !text-red-400`}>{t("organizationUnknown")}</span>;
}

/** "TUE 20 OCT 2026 · 09:40", in the reader's language and their own clock, 24 h. */
function LiveClock() {
  const format = useFormatter();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // The clock only exists in the browser: the server's time zone is not the reader's.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);
  if (!now) return <span className="h-4" />;
  const day = format.dateTime(now, { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).replace(/[,.]/g, "");
  const time = format.dateTime(now, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  return (
    <time dateTime={now.toISOString()} className="font-[family-name:var(--font-plex-mono)] text-[12.5px] uppercase text-[var(--ds-on-surface-variant)]">
      {day} · {time}
    </time>
  );
}
