"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useFeedback } from "@/components/Feedback";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Form";
import {
  IconBuilding, IconCatalog, IconCheckCircle, IconChevronLeft, IconChevronRight, IconEdit, IconEmail, IconPhone, IconPin, IconSearch, IconUser, IconWebsite,
} from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { Badge, Card, EmptyState, Notice, PageHeader } from "@/components/ui/Surface";
import { useErrorText } from "@/i18n/useErrorText";
import {
  INTEGRATOR_PAGE_SIZE, useIntegratorDetail, useIntegratorEdit, useIntegratorSearch,
  type IntegratorDetail, type IntegratorEdit, type IntegratorRow, type IntegratorSearch,
} from "./providerPortalApi";

const EMPTY: IntegratorSearch = { term: "", groupId: null, mine: false, page: 1 };

/**
 * The catalog an external Provider browses: the Integrators (clinics, hospitals, residences), with
 * "my clinics" for the ones that contracted it. It contracts nothing; it may correct any entry's
 * contact details, which every app then sees (decided 2026-10-11).
 */
export function IntegratorCatalog() {
  const t = useTranslations("providerPortal");
  const locale = useLocale();
  const [filters, setFilters] = useState<IntegratorSearch>(EMPTY);
  const [term, setTerm] = useState("");
  const [settled, setSettled] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  useEffect(() => {
    const handle = setTimeout(() => setSettled(term), 300);
    return () => clearTimeout(handle);
  }, [term]);

  const results = useIntegratorSearch({ ...filters, term: settled });
  const page = results.data;
  const totalPages = page ? Math.max(1, Math.ceil((page.totalCount ?? 0) / INTEGRATOR_PAGE_SIZE)) : 1;
  const set = (patch: Partial<IntegratorSearch>) => setFilters((f) => ({ ...f, ...patch, page: patch.page ?? 1 }));
  const group = (r: IntegratorRow) => (locale === "es" ? r.groupNameEs : r.groupNameEn);
  const place = (r: IntegratorRow) => [r.city, r.county, r.state].filter(Boolean).join(", ");

  return (
    <>
      <PageHeader title={t("catalogTitle")} description={t("catalogSubtitle")} />

      <Card className="mb-5 space-y-4">
        <Input type="search" icon={IconSearch} value={term} onChange={(e) => { setTerm(e.target.value); set({}); }}
          placeholder={t("searchPlaceholder")} aria-label={t("searchPlaceholder")} />
        <div className="flex flex-wrap items-center gap-2">
          {[false, true].map((mine) => (
            <button key={String(mine)} type="button" aria-pressed={filters.mine === mine} onClick={() => set({ mine })}
              className={`inline-flex h-9 items-center rounded-full border px-3.5 text-sm font-semibold ${filters.mine === mine ? "border-brand bg-brand text-white" : "border-border-strong bg-surface hover:text-brand"}`}>
              {mine ? t("myClinics") : t("allIntegrators")}
            </button>
          ))}
          {(page?.groups?.length ?? 0) > 1 && <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />}
          {(page?.groups?.length ?? 0) > 1 && page!.groups!.map((g) => (
            <button key={g.id} type="button" aria-pressed={filters.groupId === g.id} onClick={() => set({ groupId: filters.groupId === g.id ? null : g.id ?? null })}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold ${filters.groupId === g.id ? "border-brand bg-brand text-white" : "border-border-strong bg-surface hover:text-brand"}`}>
              {g.label} <span className="opacity-70">{g.count}</span>
            </button>
          ))}
        </div>
      </Card>

      <p className="mb-3 px-1 text-sm text-muted" aria-live="polite">
        {results.isError ? t("loadFailed") : page ? t("summary", { total: page.totalCount ?? 0, mine: page.mineCount ?? 0 }) : t("loading")}
      </p>

      {page && (page.items?.length ?? 0) === 0 && (
        <Card><EmptyState icon={IconCatalog} title={t("emptyTitle")}>{t("emptyText")}</EmptyState></Card>
      )}

      {(page?.items?.length ?? 0) > 0 && (
        <Card padded={false} className="overflow-hidden">
          <ul className="divide-y divide-border">
            {page!.items!.map((r) => (
              <li key={r.id}>
                <button type="button" onClick={() => setOpenId(r.id ?? null)} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-surface-2">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand"><IconBuilding size={16} aria-hidden /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{r.name}</span>
                    <span className="block truncate text-sm text-muted">{[group(r), place(r)].filter(Boolean).join(" · ")}</span>
                  </span>
                  {r.phone && <span className="hidden whitespace-nowrap text-sm md:inline">{r.phone}</span>}
                  {r.isMyClinic && <Badge tone="success" icon={IconCheckCircle}>{t("myClinic")}</Badge>}
                  {!r.isActive && <Badge tone="danger">{t("inactive")}</Badge>}
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {page && (page.totalCount ?? 0) > INTEGRATOR_PAGE_SIZE && (
        <div className="mt-5 flex items-center justify-center gap-3 text-sm">
          <Button variant="secondary" icon={IconChevronLeft} disabled={filters.page <= 1} onClick={() => set({ page: filters.page - 1 })}>{t("previous")}</Button>
          <span className="font-semibold">{t("pageOf", { page: filters.page, pages: totalPages })}</span>
          <Button variant="secondary" disabled={filters.page >= totalPages} onClick={() => set({ page: filters.page + 1 })}>
            {t("next")}<IconChevronRight size={16} aria-hidden />
          </Button>
        </div>
      )}

      {openId != null && <IntegratorModal id={openId} onClose={() => setOpenId(null)} />}
    </>
  );
}

/** One Integrator's file, and the form to correct its contact details. */
function IntegratorModal({ id, onClose }: { id: number; onClose: () => void }) {
  const t = useTranslations("providerPortal");
  const tc = useTranslations("common");
  const locale = useLocale();
  const feedback = useFeedback();
  const errorText = useErrorText();
  const detail = useIntegratorDetail(id);
  const edit = useIntegratorEdit(id);
  const [form, setForm] = useState<IntegratorEdit | null>(null);
  const p = detail.data;

  function start(d: IntegratorDetail) {
    setForm({
      name: d.name ?? "", address: d.address ?? "", city: d.city ?? "", state: d.state ?? "", zip: d.zip ?? "",
      phone: d.phone ?? "", email: d.email ?? "", website: d.website ?? "", contactName: d.contactName ?? "",
    });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    try {
      await edit.mutateAsync(form);
      setForm(null);
    } catch (e) {
      await feedback.alert(errorText(e, t("failed")));
    }
  }

  const field = (key: keyof IntegratorEdit, label: string, type = "text", span = false) => (
    <Field label={label} htmlFor={`int-${key}`} required={key === "name"} className={span ? "sm:col-span-2" : ""}>
      <Input id={`int-${key}`} type={type} value={form?.[key] ?? ""} required={key === "name"}
        onChange={(e) => setForm((f) => (f ? { ...f, [key]: e.target.value } : f))} />
    </Field>
  );

  return (
    <Modal size="lg" icon={IconBuilding} labelledBy="integrator-title" onClose={onClose} onSubmit={form ? save : undefined}
      title={p?.name ?? tc("loading")}
      subtitle={p && <span>{locale === "es" ? p.groupNameEs : p.groupNameEn}</span>}
      footer={!p ? null : form ? <>
        <Button variant="secondary" onClick={() => setForm(null)}>{tc("cancel")}</Button>
        <Button type="submit" loading={edit.isPending}>{t("save")}</Button>
      </> : <Button variant="secondary" icon={IconEdit} onClick={() => start(p)}>{t("editContact")}</Button>}>
      {detail.isError && <Notice tone="danger">{t("loadFailed")}</Notice>}
      {p && !form && (
        <dl className="grid gap-2.5 text-[0.95rem] sm:grid-cols-2">
          <Row icon={IconPin} label={t("address")} value={[p.address, p.city, p.state, p.zip].filter(Boolean).join(", ")} />
          <Row label={t("county")} value={p.county} />
          <Row icon={IconPhone} label={t("phone")} value={p.phone} />
          <Row icon={IconEmail} label={t("email")} value={p.email} />
          <Row icon={IconWebsite} label={t("website")} value={p.website} />
          <Row icon={IconUser} label={t("contactName")} value={p.contactName} />
          <Row label={t("facilityType")} value={p.facilityType} />
          <Row label={t("beds")} value={p.beds != null ? String(p.beds) : null} />
        </dl>
      )}
      {p && form && (
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

function Row({ label, value, icon: Icon }: { label: string; value: ReactNode; icon?: typeof IconPin }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-2">
      <dt className="flex items-center gap-1.5 text-sm text-muted">{Icon && <Icon size={13} aria-hidden />}{label}</dt>
      <dd className="min-w-0 break-words">{value || "—"}</dd>
    </div>
  );
}
