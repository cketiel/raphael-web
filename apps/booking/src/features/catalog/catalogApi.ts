"use client";

import type { Schemas } from "@raphael/api-client";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/bff";

export type CatalogCategory = Schemas["PortalCatalogCategoryDto"];
export type CatalogGroup = Schemas["CatalogCategoryDto"];
export type ProviderRow = Schemas["PortalCatalogProviderRowDto"];
export type ProviderDetail = Schemas["PortalCatalogProviderDetailDto"];
export type ProviderEdit = Schemas["PortalCatalogProviderEditDto"];
export type ProviderPage = Schemas["PortalCatalogProviderRowDtoPortalCatalogPageDto"];
export type AssignableProvider = Schemas["AssignableProviderDto"];

export interface ProviderSearch {
  term: string;
  groupId: number | null;
  countyId: number | null;
  city: string;
  contracted: boolean | null;
  page: number;
}

export const PAGE_SIZE = 25;

/** The query string the backend expects, without the empty filters. */
export function searchQuery(s: ProviderSearch): string {
  const q = new URLSearchParams({ pageNumber: String(s.page), pageSize: String(PAGE_SIZE) });
  if (s.term.trim()) q.set("term", s.term.trim());
  if (s.groupId != null) q.set("groupId", String(s.groupId));
  if (s.countyId != null) q.set("countyId", String(s.countyId));
  if (s.city) q.set("city", s.city);
  if (s.contracted != null) q.set("contracted", String(s.contracted));
  return q.toString();
}

const BASE = "BookingPortal/catalog";

export function useCatalogCategories() {
  return useQuery({ queryKey: ["catalog", "categories"], queryFn: () => api<CatalogCategory[]>(`${BASE}/categories`), staleTime: 30 * 60_000 });
}

export function useProviderSearch(search: ProviderSearch) {
  return useQuery({
    queryKey: ["catalog", "providers", search],
    queryFn: () => api<ProviderPage>(`${BASE}/providers/search?${searchQuery(search)}`),
    // Keeps the current page on screen while the next one loads, instead of flashing an empty list.
    placeholderData: keepPreviousData,
  });
}

export function useProviderDetail(id: number | null) {
  return useQuery({
    queryKey: ["catalog", "provider", id],
    queryFn: () => api<ProviderDetail>(`${BASE}/providers/${id}`),
    enabled: id != null,
  });
}

/** The Providers a trip can be given to: contracted, active, with an account in Raphael. */
export function useAssignableProviders() {
  return useQuery({ queryKey: ["catalog", "assignable"], queryFn: () => api<AssignableProvider[]>(`${BASE}/providers/assignable`), staleTime: 5 * 60_000 });
}

/** Contract, remove and edit. Each one refreshes the list, the file and the assignable Providers. */
export function useProviderActions(id: number) {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: ["catalog"] });

  const contract = useMutation({
    mutationFn: (on: boolean) => api(`${BASE}/providers/${id}/contract`, { method: on ? "POST" : "DELETE" }),
    onSuccess: refresh,
  });
  const edit = useMutation({
    mutationFn: (body: ProviderEdit) => api<ProviderDetail>(`${BASE}/providers/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: refresh,
  });
  return { contract, edit };
}
