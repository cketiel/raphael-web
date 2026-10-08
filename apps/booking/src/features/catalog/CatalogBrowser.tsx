"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Form";
import { IconBuilding, IconCatalog, IconCheckCircle, IconChevronLeft, IconChevronRight, IconPhone, IconPin, IconSearch } from "@/components/ui/Icon";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/Surface";
import { PAGE_SIZE, useCatalogCategories, useProviderSearch, type CatalogGroup, type ProviderRow, type ProviderSearch } from "./catalogApi";
import { ContractButton } from "./ContractButton";
import { ProviderDetailModal } from "./ProviderDetailModal";

const EMPTY: ProviderSearch = { term: "", groupId: null, countyId: null, city: "", contracted: null, page: 1 };

/** A value that settles 300 ms after the user stops typing: one search per pause, not per key. */
function useSettled<T>(value: T, ms = 300) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const handle = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(handle);
  }, [value, ms]);
  return settled;
}

/**
 * The catalog a clinic browses: built for several fixed categories with optional groups
 * (CATALOG_MODEL.md §4.4), though today the backend offers only Providers.
 */
export function CatalogBrowser({ isClinicAdmin }: { isClinicAdmin: boolean }) {
  const t = useTranslations("catalog");
  const locale = useLocale();
  const categories = useCatalogCategories();
  const [categoryKey, setCategoryKey] = useState("providers");
  const [filters, setFilters] = useState<ProviderSearch>(EMPTY);
  const [term, setTerm] = useState("");
  const settledTerm = useSettled(term);
  const [openId, setOpenId] = useState<number | null>(null);

  const search = { ...filters, term: settledTerm };
  const results = useProviderSearch(search);
  const page = results.data;

  const category = categories.data?.find((c) => c.key === categoryKey) ?? categories.data?.[0];
  const groupName = (g: Pick<CatalogGroup, "nameEn" | "nameEs">) => (locale === "es" ? g.nameEs : g.nameEn);
  const rowGroup = (r: ProviderRow) => (locale === "es" ? r.groupNameEs : r.groupNameEn);
  const groupCount = (id: number | undefined) => page?.groups?.find((f) => f.id === id)?.count ?? 0;
  const totalPages = page ? Math.max(1, Math.ceil((page.totalCount ?? 0) / PAGE_SIZE)) : 1;
  const place = (r: ProviderRow) => [r.city, r.county, r.state].filter(Boolean).join(", ");

  /** Any filter change starts again at page 1. */
  const set = (patch: Partial<ProviderSearch>) => setFilters((f) => ({ ...f, ...patch, page: patch.page ?? 1 }));

  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle")}
        actions={(categories.data?.length ?? 0) > 1 && (
          <div className="inline-flex overflow-hidden rounded-[var(--radius)] border border-border-strong bg-surface">
            {categories.data!.map((c) => (
              <button key={c.key} type="button" onClick={() => { setCategoryKey(c.key ?? ""); setFilters(EMPTY); }}
                className={`px-4 py-2 text-sm font-semibold ${c.key === category?.key ? "bg-brand text-white" : "hover:bg-surface-2"}`}>
                {locale === "es" ? c.nameEs : c.nameEn}
              </button>
            ))}
          </div>
        )} />

      {/* Filters */}
      <Card className="mb-5 space-y-4">
        <Input type="search" icon={IconSearch} value={term} onChange={(e) => { setTerm(e.target.value); set({}); }}
          placeholder={t("searchPlaceholder")} aria-label={t("searchPlaceholder")} />

        {(category?.groups?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label={t("groups")}>
            <Chip active={filters.groupId == null} onClick={() => set({ groupId: null })}>{t("allGroups")}</Chip>
            {category!.groups!.map((g) => (
              <Chip key={g.id} active={filters.groupId === g.id} onClick={() => set({ groupId: g.id ?? null })}>
                {groupName(g)} <span className="opacity-70">{groupCount(g.id)}</span>
              </Chip>
            ))}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(page?.counties?.length ?? 0) > 0 && (
            <Select value={filters.countyId ?? ""} onChange={(e) => set({ countyId: e.target.value ? Number(e.target.value) : null, city: "" })} aria-label={t("county")}>
              <option value="">{t("allCounties")}</option>
              {page!.counties!.map((c) => <option key={c.id} value={c.id ?? ""}>{c.label} ({c.count})</option>)}
            </Select>
          )}
          <Select value={filters.city} onChange={(e) => set({ city: e.target.value })} aria-label={t("city")}>
            <option value="">{t("allCities")}</option>
            {page?.cities?.map((c) => <option key={c.label} value={c.label ?? ""}>{c.label} ({c.count})</option>)}
          </Select>
          <div className="inline-flex h-10 overflow-hidden rounded-[var(--radius)] border border-border-strong" role="group" aria-label={t("contractedFilter")}>
            {([null, true, false] as const).map((v) => (
              <button key={String(v)} type="button" onClick={() => set({ contracted: v })} aria-pressed={filters.contracted === v}
                className={`flex-1 border-r border-border-strong px-3 text-sm font-semibold last:border-r-0 ${filters.contracted === v ? "bg-brand text-white" : "bg-surface hover:bg-surface-2"}`}>
                {v === null ? t("all") : v ? t("contracted") : t("notContracted")}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <p className="mb-3 px-1 text-sm text-muted" aria-live="polite">
        {results.isError ? t("loadFailed") : page ? t("summary", { total: page.totalCount ?? 0, contracted: page.contractedCount ?? 0 }) : t("loading")}
      </p>

      {page && (page.items?.length ?? 0) === 0 && (
        <Card><EmptyState icon={IconCatalog} title={t("emptyTitle")}>{t("emptyText")}</EmptyState></Card>
      )}

      {/* Phones and tablets: cards. */}
      <ul className="grid gap-3 md:grid-cols-2 lg:hidden">
        {page?.items?.map((r) => (
          <li key={r.id} className="flex flex-col rounded-2xl border border-border bg-surface shadow-card">
            <button type="button" onClick={() => setOpenId(r.id ?? null)} className="flex-1 p-4 text-left">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand"><IconBuilding size={18} aria-hidden /></span>
                <div className="min-w-0">
                  <p className="font-bold leading-snug">{r.name}</p>
                  <p className="text-sm text-muted">{rowGroup(r)}</p>
                </div>
              </div>
              <p className="mt-3 flex items-center gap-2 text-sm"><IconPin size={13} aria-hidden className="text-muted" />{place(r) || "—"}</p>
              {r.phone && <p className="mt-1 flex items-center gap-2 text-sm"><IconPhone size={13} aria-hidden className="text-muted" />{r.phone}</p>}
              <Badges row={r} />
            </button>
            {isClinicAdmin && <div className="flex justify-end border-t border-border px-4 py-2.5"><ContractButton row={r} /></div>}
          </li>
        ))}
      </ul>

      {/* Wide screens: the table. */}
      {(page?.items?.length ?? 0) > 0 && (
        <Card padded={false} className="hidden overflow-hidden lg:block">
          <table className="w-full text-left">
            <thead className="bg-surface-2 text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3">{t("colName")}</th>
                <th className="px-3">{t("colGroup")}</th>
                <th className="px-3">{t("colPlace")}</th>
                <th className="px-3">{t("colPhone")}</th>
                <th className="px-3">{t("colStatus")}</th>
                {isClinicAdmin && <th className="px-5 text-right">{t("colActions")}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {page!.items!.map((r) => (
                <tr key={r.id} onClick={() => setOpenId(r.id ?? null)} className="cursor-pointer transition-colors hover:bg-surface-2">
                  <td className="px-5 py-3">
                    <button type="button" className="flex items-center gap-3 text-left font-semibold hover:text-brand"
                      onClick={(e) => { e.stopPropagation(); setOpenId(r.id ?? null); }}>
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand"><IconBuilding size={15} aria-hidden /></span>
                      {r.name}
                    </button>
                  </td>
                  <td className="px-3 text-sm">{rowGroup(r)}</td>
                  <td className="px-3 text-sm">{place(r)}</td>
                  <td className="whitespace-nowrap px-3 text-sm">{r.phone}</td>
                  <td className="px-3"><Badges row={r} inline /></td>
                  {isClinicAdmin && <td className="px-5 text-right"><ContractButton row={r} /></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {page && (page.totalCount ?? 0) > PAGE_SIZE && (
        <div className="mt-5 flex items-center justify-center gap-3 text-sm">
          <Button variant="secondary" icon={IconChevronLeft} disabled={filters.page <= 1} onClick={() => set({ page: filters.page - 1 })}>{t("previous")}</Button>
          <span className="font-semibold">{t("pageOf", { page: filters.page, pages: totalPages })}</span>
          <Button variant="secondary" disabled={filters.page >= totalPages} onClick={() => set({ page: filters.page + 1 })}>
            {t("next")}<IconChevronRight size={16} aria-hidden />
          </Button>
        </div>
      )}

      {openId != null && <ProviderDetailModal id={openId} isClinicAdmin={isClinicAdmin} onClose={() => setOpenId(null)} />}
    </>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors ${
        active ? "border-brand bg-brand text-white" : "border-border-strong bg-surface hover:border-brand-500 hover:text-brand"
      }`}>
      {children}
    </button>
  );
}

/** Contracted, operates in Raphael, inactive: what a clinic needs to see at a glance. */
export function Badges({ row, inline }: { row: Pick<ProviderRow, "contracted" | "operatesInRaphael" | "isActive">; inline?: boolean }) {
  const t = useTranslations("catalog");
  if (!row.contracted && !row.operatesInRaphael && row.isActive) return inline ? <span className="text-sm text-muted">—</span> : null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${inline ? "" : "mt-3"}`}>
      {row.contracted && <Badge tone="success" icon={IconCheckCircle}>{t("contracted")}</Badge>}
      {row.operatesInRaphael && <Badge tone="info">{t("operates")}</Badge>}
      {!row.isActive && <Badge tone="danger">{t("inactive")}</Badge>}
    </div>
  );
}
