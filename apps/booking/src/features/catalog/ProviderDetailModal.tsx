"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent, type ReactNode } from "react";
import { useFeedback } from "@/components/Feedback";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Form";
import { IconBuilding, IconCheckCircle, IconClose, IconEdit, IconEmail, IconPhone, IconPin, IconUser, IconWebsite } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { Notice } from "@/components/ui/Surface";
import { useErrorText } from "@/i18n/useErrorText";
import { Badges } from "./CatalogBrowser";
import { useProviderActions, useProviderDetail, type ProviderDetail, type ProviderEdit } from "./catalogApi";

/**
 * One Provider's file. A clinic's admin contracts it or removes it, and corrects its contact
 * details, contracted or not (CATALOG_MODEL.md §7, C). What one clinic edits, everybody sees.
 */
export function ProviderDetailModal({ id, onClose }: { id: number; isClinicAdmin: boolean; onClose: () => void }) {
  const t = useTranslations("catalog");
  const tc = useTranslations("common");
  const locale = useLocale();
  const format = useFormatter();
  const feedback = useFeedback();
  const errorText = useErrorText();
  const detail = useProviderDetail(id);
  const { contract, edit } = useProviderActions(id);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProviderEdit | null>(null);
  const p = detail.data;

  async function toggleContract(on: boolean) {
    if (!on && !(await feedback.confirm(t("confirmRemove", { name: p?.name ?? "" })))) return;
    try {
      await contract.mutateAsync(on);
    } catch (e) {
      await feedback.alert(errorText(e, t("actionFailed")));
    }
  }

  function startEditing(provider: ProviderDetail) {
    setForm({
      name: provider.name ?? "",
      address: provider.address ?? "",
      city: provider.city ?? "",
      state: provider.state ?? "",
      zip: provider.zip ?? "",
      phone: provider.phone ?? "",
      email: provider.email ?? "",
      website: provider.website ?? "",
      contactName: provider.contactName ?? "",
    });
    setEditing(true);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    try {
      await edit.mutateAsync(form);
      setEditing(false);
    } catch (e) {
      await feedback.alert(errorText(e, t("actionFailed")));
    }
  }

  const footer = !p ? null : editing ? (
    <>
      <Button variant="secondary" onClick={() => setEditing(false)}>{tc("cancel")}</Button>
      <Button type="submit" loading={edit.isPending}>{t("save")}</Button>
    </>
  ) : (p.canContract || p.canEdit) ? (
    <>
      {p.canEdit && <Button variant="secondary" icon={IconEdit} onClick={() => startEditing(p)}>{t("edit")}</Button>}
      {p.canContract && (p.contracted ? (
        <Button variant="danger-outline" icon={IconClose} loading={contract.isPending} onClick={() => void toggleContract(false)}>{t("remove")}</Button>
      ) : (
        <Button variant="success" icon={IconCheckCircle} loading={contract.isPending} disabled={!p.isActive}
          title={!p.isActive ? t("inactiveCannotContract") : undefined} onClick={() => void toggleContract(true)}>{t("contract")}</Button>
      ))}
    </>
  ) : null;

  const field = (key: keyof ProviderEdit, label: string, type = "text", span = false) => (
    <Field label={label} htmlFor={`provider-${key}`} required={key === "name"} className={span ? "sm:col-span-2" : ""}>
      <Input id={`provider-${key}`} type={type} value={form?.[key] ?? ""} required={key === "name"}
        onChange={(e) => setForm((f) => (f ? { ...f, [key]: e.target.value } : f))} />
    </Field>
  );

  return (
    <Modal size="lg" icon={IconBuilding} labelledBy="provider-title" onClose={onClose} onSubmit={editing ? save : undefined}
      title={p?.name ?? tc("loading")}
      subtitle={p && <><span>{locale === "es" ? p.groupNameEs : p.groupNameEn}</span><Badges row={p} /></>}
      footer={footer}>
      {detail.isError && <Notice tone="danger">{t("loadFailed")}</Notice>}

      {p && !editing && (
        <div className="grid gap-6 md:grid-cols-2">
          <Section title={t("contact")}>
            <Row icon={IconPin} label={t("address")} value={[p.address, p.city, p.state, p.zip].filter(Boolean).join(", ")} />
            <Row label={t("county")} value={p.county} />
            <Row icon={IconPhone} label={t("phone")} value={p.phone && <a className="text-brand hover:underline" href={`tel:${p.phone}`}>{p.phone}</a>} />
            <Row icon={IconEmail} label={t("email")} value={p.email && <a className="break-all text-brand hover:underline" href={`mailto:${p.email}`}>{p.email}</a>} />
            <Row icon={IconWebsite} label={t("website")} value={p.website && <a className="break-all text-brand hover:underline" href={p.website.startsWith("http") ? p.website : `https://${p.website}`} target="_blank" rel="noopener noreferrer">{p.website}</a>} />
            <Row icon={IconUser} label={t("contactName")} value={p.contactName} />
          </Section>
          <Section title={t("regulatory")}>
            <Row label="NPI" value={p.npi} />
            <Row label={t("serviceLevel")} value={p.serviceLevel} />
            <Row label={t("coverageArea")} value={p.coverageArea} />
            <Row label={t("emsLicense")} value={p.emsLicense} />
            <Row label={t("licenseExpires")} value={p.licenseExpiresOn && format.dateTime(new Date(p.licenseExpiresOn), { dateStyle: "medium" })} />
            <Row label={t("planSegment")} value={p.planSegment} />
          </Section>
          {!p.operatesInRaphael && p.contracted && (
            <Notice tone="warning" className="md:col-span-2">{t("notOperatingYet")}</Notice>
          )}
        </div>
      )}

      {p && editing && form && (
        <div className="space-y-4">
          <Notice>{t("editWarning")}</Notice>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("name", t("name"), "text", true)}
            {field("address", t("street"), "text", true)}
            {field("city", t("city"))}
            <div className="grid grid-cols-2 gap-3">
              {field("state", t("state"))}
              {field("zip", t("zip"))}
            </div>
            {field("phone", t("phone"), "tel")}
            {field("email", t("email"), "email")}
            {field("website", t("website"))}
            {field("contactName", t("contactName"))}
          </div>
        </div>
      )}
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">{title}</h3>
      <dl className="space-y-2.5 text-[0.95rem]">{children}</dl>
    </div>
  );
}

function Row({ label, value, icon: Icon }: { label: string; value: ReactNode; icon?: typeof IconPin }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-2">
      <dt className="flex items-center gap-1.5 text-sm text-muted">{Icon && <Icon size={13} aria-hidden />}{label}</dt>
      <dd className="min-w-0 break-words">{value || "—"}</dd>
    </div>
  );
}
