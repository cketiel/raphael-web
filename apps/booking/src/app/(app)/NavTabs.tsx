"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useNotifications } from "@/features/notifications/NotificationsProvider";

/** The portal's sections. More will come (members, settings…): one entry each. */
const TABS = [
  { href: "/", key: "trips" },
  { href: "/catalog", key: "catalog" },
  { href: "/notifications", key: "notifications" },
  { href: "/admin", key: "admin", adminOnly: true },
] as const;

/** `isClinicAdmin` only decides whether the Admin tab is drawn: the page and the backend check it again. */
export function NavTabs({ isClinicAdmin }: { isClinicAdmin: boolean }) {
  const t = useTranslations("nav.tabs");
  const pathname = usePathname();
  const { unread } = useNotifications();

  return (
    <div className="border-b border-border bg-surface px-3 sm:px-6">
      <ul className="flex gap-1 overflow-x-auto" role="tablist">
        {TABS.filter((tab) => !("adminOnly" in tab) || isClinicAdmin).map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1 sm:flex-none">
              <Link href={tab.href} role="tab" aria-selected={active}
                className={`block whitespace-nowrap border-b-2 px-4 py-3 text-center text-sm font-semibold ${
                  active ? "border-brand text-brand" : "border-transparent text-muted hover:text-foreground"
                }`}>
                {t(tab.key)}
                {tab.key === "notifications" && unread > 0 && (
                  <span className="ml-1.5 rounded-full bg-red-600 px-1.5 py-0.5 text-[0.7rem] font-bold text-white">{unread > 99 ? "99+" : unread}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
