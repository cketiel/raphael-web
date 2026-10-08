"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { BillingSection } from "./BillingSection";
import { OrganizationSection } from "./OrganizationSection";
import { UsersSection } from "./UsersSection";

const SECTIONS = ["users", "organization", "billing"] as const;
type Section = (typeof SECTIONS)[number];

/** The clinic's administration: its users, its own record and API key, and what it is billed with. */
export function AdminPage() {
  const t = useTranslations("admin");
  const [section, setSection] = useState<Section>("users");

  return (
    <div className="w-full px-3 py-4 sm:px-6 sm:py-6">
      <h1 className="mb-4 text-xl font-bold text-slate-600">{t("title")}</h1>

      <div className="mb-4 overflow-x-auto [scrollbar-width:none]">
        <ul className="flex min-w-max gap-1 rounded-xl bg-surface p-1 shadow-sm" role="tablist" aria-label={t("title")}>
          {SECTIONS.map((key) => (
            <li key={key}>
              <button type="button" role="tab" aria-selected={key === section} onClick={() => setSection(key)}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold ${
                  key === section ? "bg-brand text-white" : "text-muted hover:bg-slate-50 hover:text-foreground"
                }`}>
                {t(`sections.${key}`)}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {section === "users" && <UsersSection />}
      {section === "organization" && <OrganizationSection />}
      {section === "billing" && <BillingSection />}
    </div>
  );
}
