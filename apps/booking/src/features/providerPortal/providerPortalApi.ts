"use client";

import type { Schemas } from "@raphael/api-client";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/bff";

/** The Booking portal of a Provider that works outside Raphael (PROVIDER_ACCESS_MODEL.md §3.5). */
const BASE = "BookingPortal/provider";

export type ProviderClinic = Schemas["ProviderClinicDto"];
export type IntegratorRow = Schemas["ProviderPortalIntegratorRowDto"];
export type IntegratorDetail = Schemas["ProviderPortalIntegratorDetailDto"];
export type IntegratorEdit = Schemas["ProviderPortalIntegratorEditDto"];
export type IntegratorPage = Schemas["ProviderPortalIntegratorPageDto"];
export type TripCompletion = Schemas["ProviderTripCompleteDto"];

export const INTEGRATOR_PAGE_SIZE = 25;

export interface IntegratorSearch {
  term: string;
  groupId: number | null;
  mine: boolean;
  page: number;
}

/** The clinics that contracted this Provider: the Trips list's Integrator filter. Asked once. */
export function useMyClinics(enabled: boolean) {
  return useQuery({ queryKey: ["provider", "clinics"], queryFn: () => api<ProviderClinic[]>(`${BASE}/clinics`), staleTime: 5 * 60_000, enabled });
}

export function useIntegratorSearch(s: IntegratorSearch) {
  const q = new URLSearchParams({ pageNumber: String(s.page), pageSize: String(INTEGRATOR_PAGE_SIZE) });
  if (s.term.trim()) q.set("term", s.term.trim());
  if (s.groupId != null) q.set("groupId", String(s.groupId));
  if (s.mine) q.set("mine", "true");
  return useQuery({
    queryKey: ["provider", "integrators", q.toString()],
    queryFn: () => api<IntegratorPage>(`${BASE}/catalog/integrators/search?${q}`),
    placeholderData: keepPreviousData,
  });
}

export function useIntegratorDetail(id: number) {
  return useQuery({ queryKey: ["provider", "integrator", id], queryFn: () => api<IntegratorDetail>(`${BASE}/catalog/integrators/${id}`) });
}

/** Corrects an Integrator's contact details: what this Provider changes, every app sees. */
export function useIntegratorEdit(id: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: IntegratorEdit) => api<IntegratorDetail>(`${BASE}/catalog/integrators/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["provider"] }),
  });
}

/** The three things this Provider reports about a trip of its own. The backend checks each one again. */
export const providerTrips = {
  reject: (id: number, reason: string) => api(`${BASE}/trips/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) }),
  noShow: (id: number, reason: string) => api(`${BASE}/trips/${id}/no-show`, { method: "POST", body: JSON.stringify({ reason }) }),
  complete: (id: number, body: TripCompletion) => api(`${BASE}/trips/${id}/complete`, { method: "POST", body: JSON.stringify(body) }),
};
