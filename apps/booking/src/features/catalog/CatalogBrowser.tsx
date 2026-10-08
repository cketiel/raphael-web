"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { PAGE_SIZE, useCatalogCategories, useProviderSearch, type CatalogGroup, type ProviderRow, type ProviderSearch } from "./catalogApi";
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

  /** Any filter change starts again at page 1. */
  const set = (patch: Partial<ProviderSearch>) => setFilters((f) => ({ ...f, ...patch, page: patch.page ?? 1 }));

  const input = "w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand";

  return (
    <div className="w-full px-3 py-4 sm:px-6 sm:py-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-xl font-bold text-slate-600">{t("title")}</h1>
        {/* One button per category; with a single category it reads as a label. */}
        {(categories.data?.length ?? 0) > 1 && (
          <div className="inline-flex overflow-hidden rounded-lg border border-border">
            {categories.data!.map((c) => (
              <button key={c.key} type="button" onClick={() => { setCategoryKey(c.key ?? ""); setFilters(EMPTY); }}
                className={`px-4 py-2 text-sm font-semibold ${c.key === category?.key ? "bg-brand text-white" : "bg-surface"}`}>
                {locale === "es" ? c.nameEs : c.nameEn}
              </button>
            ))}
          </div>
        )}
        {(categories.data?.length ?? 0) === 1 && category && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold">{locale === "es" ? category.nameEs : category.nameEn}</span>
        )}
      </div>

      {/* Filters */}
      <div className="mb-4 space-y-3 rounded-2xl bg-surface p-4 shadow-sm sm:p-5">
        <input type="search" value={term} onChange={(e) => { setTerm(e.target.value); set({}); }}
          placeholder={t("searchPlaceholder")} aria-label={t("searchPlaceholder")} className={input} />

        {(category?.groups?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label={t("groups")}>
            <Chip active={filters.groupId == null} onClick={() => set({ groupId: null })}>{t("allGroups")}</Chip>
            {category!.groups!.map((g) => (
              <Chip key={g.id} active={filters.groupId === g.id} onClick={() => set({ groupId: g.id ?? null })}>
                {groupName(g)} <span className="opacity-70">({groupCount(g.id)})</span>
              </Chip>
            ))}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(page?.counties?.length ?? 0) > 0 && (
            <select value={filters.countyId ?? ""} onChange={(e) => set({ countyId: e.target.value ? Number(e.target.value) : null, city: "" })}
              aria-label={t("county")} className={input}>
              <option value="">{t("allCounties")}</option>
              {page!.counties!.map((c) => <option key={c.id} value={c.id ?? ""}>{c.label} ({c.count})</option>)}
            </select>
          )}
          <select value={filters.city} onChange={(e) => set({ city: e.target.value })} aria-label={t("city")} className={input}>
            <option value="">{t("allCities")}</option>
            {page?.cities?.map((c) => <option key={c.label} value={c.label ?? ""}>{c.label} ({c.count})</option>)}
          </select>
          <div className="inline-flex overflow-hidden rounded-lg border border-border" role="group" aria-label={t("contractedFilter")}>
            {([null, true, false] as const).map((v) => (
              <button key={String(v)} type="button" onClick={() => set({ contracted: v })}
                className={`flex-1 px-3 py-2 text-sm font-semibold ${filters.contracted === v ? "bg-brand text-white" : "bg-surface"}`}>
                {v === null ? t("all") : v ? t("contracted") : t("notContracted")}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mb-3 px-1 text-sm text-muted" aria-live="polite">
        {results.isError ? t("loadFailed") : page ? t("summary", { total: page.totalCount ?? 0, contracted: page.contractedCount ?? 0 }) : t("loading")}
      </p>

      {/* Phones and tablets: cards. */}
      <ul className="grid gap-3 md:grid-cols-2 lg:hidden">
        {page?.items?.map((r) => (
          <li key={r.id}>
            <button type="button" onClick={() => setOpenId(r.id ?? null)} className="w-full rounded-2xl bg-surface p-4 text-left shadow-sm hover:ring-2 hover:ring-brand/30">
              <p className="font-bold">{r.name}</p>
              <p className="mt-0.5 text-xs text-muted">{rowGroup(r)}</p>
              <p className="mt-2 text-sm">{[r.city, r.county, r.state].filter(Boolean).join(", ")}</p>
              {r.phone && <p className="text-sm text-muted">{r.phone}</p>}
              <Badges row={r} />
            </button>
          </li>
        ))}
      </ul>

      {/* Wide screens: the table. */}
      <div className="hidden overflow-hidden rounded-2xl bg-surface shadow-sm lg:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold">
            <tr>
              <th className="px-4 py-3">{t("colName")}</th>
              <th className="px-4">{t("colGroup")}</th>
              <th className="px-4">{t("colPlace")}</th>
              <th className="px-4">{t("colPhone")}</th>
              <th className="px-4">{t("colStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {page?.items?.map((r) => (
              <tr key={r.id} onClick={() => setOpenId(r.id ?? null)} className="cursor-pointer border-t border-border hover:bg-slate-50">
                <td className="px-4 py-3 font-bold">
                  <button type="button" className="text-left hover:underline" onClick={(e) => { e.stopPropagation(); setOpenId(r.id ?? null); }}>{r.name}</button>
                </td>
                <td className="px-4 text-xs">{rowGroup(r)}</td>
                <td className="px-4 text-xs">{[r.city, r.county, r.state].filter(Boolean).join(", ")}</td>
                <td className="px-4 text-xs">{r.phone}</td>
                <td className="px-4"><Badges row={r} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {page && (page.totalCount ?? 0) > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button type="button" disabled={filters.page <= 1} onClick={() => set({ page: filters.page - 1 })}
            className="rounded-lg border border-border px-4 py-2 font-semibold disabled:opacity-40">{t("previous")}</button>
          <span>{t("pageOf", { page: filters.page, pages: totalPages })}</span>
          <button type="button" disabled={filters.page >= totalPages} onClick={() => set({ page: filters.page + 1 })}
            className="rounded-lg border border-border px-4 py-2 font-semibold disabled:opacity-40">{t("next")}</button>
        </div>
      )}

      {openId != null && <ProviderDetailModal id={openId} isClinicAdmin={isClinicAdmin} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-sm ${active ? "border-brand bg-brand text-white" : "border-border bg-surface hover:bg-slate-50"}`}>
      {children}
    </button>
  );
}

/** Contracted, operates in Raphael, inactive: what a clinic needs to see at a glance. */
export function Badges({ row }: { row: Pick<ProviderRow, "contracted" | "operatesInRaphael" | "isActive"> }) {
  const t = useTranslations("catalog");
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {row.contracted && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[0.7rem] font-semibold text-emerald-800">{t("contracted")}</span>}
      {row.operatesInRaphael && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[0.7rem] font-semibold text-sky-800">{t("operates")}</span>}
      {!row.isActive && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[0.7rem] font-semibold text-red-800">{t("inactive")}</span>}
    </div>
  );
}
