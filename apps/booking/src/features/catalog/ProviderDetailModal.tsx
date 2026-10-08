"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent, type ReactNode } from "react";
import { useFeedback } from "@/components/Feedback";
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
  const p = detail.data;

  async function toggleContract(on: boolean) {
    if (!on && !(await feedback.confirm(t("confirmRemove", { name: p?.name ?? "" })))) return;
    try {
      await contract.mutateAsync(on);
    } catch (e) {
      await feedback.alert(errorText(e, t("actionFailed")));
    }
  }

  return (
    <div className="fixed inset-0 z-[1050] flex items-stretch justify-center bg-slate-900/50 sm:items-start sm:overflow-y-auto sm:p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="provider-title"
        className="flex w-full flex-col bg-surface shadow-2xl sm:my-6 sm:max-w-3xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-border bg-slate-50 px-4 py-3 sm:rounded-t-2xl sm:px-6 sm:py-4">
          <div className="min-w-0">
            <h2 id="provider-title" className="break-words text-lg font-bold text-brand">{p?.name ?? tc("loading")}</h2>
            {p && <p className="text-xs text-muted">{locale === "es" ? p.groupNameEs : p.groupNameEn}</p>}
            {p && <Badges row={p} />}
          </div>
          <button type="button" onClick={onClose} aria-label={tc("close")} className="text-2xl leading-none text-muted hover:text-foreground">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {detail.isError && <p className="text-sm text-red-600">{t("loadFailed")}</p>}
          {p && !editing && (
            <div className="grid gap-6 md:grid-cols-2">
              <Section title={t("contact")}>
                <Row label={t("address")} value={[p.address, p.city, p.state, p.zip].filter(Boolean).join(", ")} />
                <Row label={t("county")} value={p.county} />
                <Row label={t("phone")} value={p.phone && <a className="text-brand hover:underline" href={`tel:${p.phone}`}>{p.phone}</a>} />
                <Row label={t("email")} value={p.email && <a className="break-all text-brand hover:underline" href={`mailto:${p.email}`}>{p.email}</a>} />
                <Row label={t("website")} value={p.website && <a className="break-all text-brand hover:underline" href={p.website.startsWith("http") ? p.website : `https://${p.website}`} target="_blank" rel="noopener noreferrer">{p.website}</a>} />
                <Row label={t("contactName")} value={p.contactName} />
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
                <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 md:col-span-2">{t("notOperatingYet")}</p>
              )}
            </div>
          )}
          {p && editing && <EditForm provider={p} saving={edit.isPending}
            onCancel={() => setEditing(false)}
            onSave={async (body) => {
              try {
                await edit.mutateAsync(body);
                setEditing(false);
              } catch (e) {
                await feedback.alert(errorText(e, t("actionFailed")));
              }
            }} />}
        </div>

        {p && !editing && (p.canContract || p.canEdit) && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-border bg-slate-50 px-4 py-3 sm:rounded-b-2xl sm:px-6">
            {p.canEdit && (
              <button type="button" onClick={() => setEditing(true)} className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-bold">{t("edit")}</button>
            )}
            {p.canContract && (p.contracted ? (
              <button type="button" disabled={contract.isPending} onClick={() => void toggleContract(false)}
                className="rounded-lg border border-[#dc3545] px-4 py-2 text-sm font-bold text-[#dc3545] disabled:opacity-50">{t("remove")}</button>
            ) : (
              <button type="button" disabled={contract.isPending || !p.isActive} onClick={() => void toggleContract(true)}
                title={!p.isActive ? t("inactiveCannotContract") : undefined}
                className="rounded-lg bg-[#198754] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{t("contract")}</button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EditForm({ provider, saving, onCancel, onSave }: {
  provider: ProviderDetail;
  saving: boolean;
  onCancel: () => void;
  onSave: (body: ProviderEdit) => Promise<void>;
}) {
  const t = useTranslations("catalog");
  const tc = useTranslations("common");
  const [form, setForm] = useState<ProviderEdit>({
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
  const field = (key: keyof ProviderEdit, label: string, type = "text", span = "") => (
    <label className={`block text-xs font-semibold text-muted ${span}`}>{label}
      <input type={type} value={form[key] ?? ""} required={key === "name"} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-brand" />
    </label>
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSave(form);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">{t("editWarning")}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {field("name", t("name"), "text", "sm:col-span-2")}
        {field("address", t("street"), "text", "sm:col-span-2")}
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
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg bg-slate-500 px-4 py-2 text-sm font-bold text-white">{tc("cancel")}</button>
        <button type="submit" disabled={saving} className="rounded-lg bg-brand px-6 py-2 text-sm font-bold text-white disabled:opacity-50">{saving ? t("saving") : t("save")}</button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-bold">{title}</h3>
      <dl className="space-y-1.5 text-sm">{children}</dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-2">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-words">{value || "—"}</dd>
    </div>
  );
}
