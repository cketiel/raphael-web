"use client";

import { useTranslations } from "next-intl";
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
  const [section, setSection] = useState<Section>("users");

  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle")} />
      <Tabs label={t("title")} value={section} onChange={setSection}
        items={SECTIONS.map((s) => ({ key: s.key, label: t(`sections.${s.key}`), icon: s.icon }))} />

      {section === "users" && <UsersSection />}
      {section === "organization" && <OrganizationSection />}
      {section === "billing" && <BillingSection />}
    </>
  );
}
