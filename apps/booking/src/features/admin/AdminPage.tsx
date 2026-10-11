"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { IconBilling, IconBuilding, IconUsers } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/Surface";
import { Tabs } from "@/components/ui/Tabs";
import { BillingSection } from "./BillingSection";
import { OrganizationSection } from "./OrganizationSection";
import { UsersSection } from "./UsersSection";

const SECTIONS = [
  { key: "users", icon: IconUsers },
  { key: "organization", icon: IconBuilding },
  { key: "billing", icon: IconBilling },
] as const;
type Section = (typeof SECTIONS)[number]["key"];

/** The clinic's administration: its users, its own record and API key, and what it is billed with. */
export function AdminPage() {
  const t = useTranslations("admin");
  // "?section=organization" from the user menu opens that tab directly.
  const router = useRouter();
  const asked = useSearchParams().get("section");
  const [section, setSection] = useState<Section>(SECTIONS.some((s) => s.key === asked) ? (asked as Section) : "users");
  // Asked again while already on Admin (the menu, from another tab): follow it.
  const [lastAsked, setLastAsked] = useState(asked);
  if (asked !== lastAsked) {
    setLastAsked(asked);
    if (SECTIONS.some((s) => s.key === asked)) setSection(asked as Section);
  }

  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle")} />
      <Tabs label={t("title")} value={section}
        // The tab goes in the address, so the menu's "Organization" always lands, and a reload stays.
        onChange={(k) => { setSection(k); router.replace(`/admin?section=${k}`, { scroll: false }); }}
        items={SECTIONS.map((s) => ({ key: s.key, label: t(`sections.${s.key}`), icon: s.icon }))} />

      {section === "users" && <UsersSection />}
      {section === "organization" && <OrganizationSection />}
      {section === "billing" && <BillingSection />}
    </>
  );
}
