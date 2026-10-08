"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

/** The portal's sections. More will come (members, settings…): one entry each. */
const TABS = [
  { href: "/", key: "trips" },
  { href: "/catalog", key: "catalog" },
] as const;

export function NavTabs() {
  const t = useTranslations("nav.tabs");
  const pathname = usePathname();

  return (
    <div className="border-b border-border bg-surface px-3 sm:px-6">
      <ul className="flex gap-1 overflow-x-auto" role="tablist">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1 sm:flex-none">
              <Link href={tab.href} role="tab" aria-selected={active}
                className={`block whitespace-nowrap border-b-2 px-4 py-3 text-center text-sm font-semibold ${
                  active ? "border-brand text-brand" : "border-transparent text-muted hover:text-foreground"
                }`}>
                {t(tab.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
