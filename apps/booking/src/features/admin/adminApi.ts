"use client";

import type { Schemas } from "@raphael/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/bff";

export type AdminRole = Schemas["BookingAdminRoleDto"];
export type AdminUser = Schemas["BookingAdminUserDto"];
export type AdminUserCreate = Schemas["BookingAdminUserCreateDto"];
export type AdminUserEdit = Schemas["BookingAdminUserEditDto"];
export type Organization = Schemas["BookingAdminOrganizationDto"];
export type OrganizationEdit = Schemas["BookingAdminOrganizationEditDto"];
export type FundingSource = Schemas["BookingAdminFundingSourceDto"];
export type FundingSourceEdit = Schemas["BookingAdminFundingSourceEditDto"];
export type BillingItem = Schemas["BookingAdminBillingItemDto"];
export type BillingItemEdit = Schemas["BookingAdminBillingItemEditDto"];
export type Rate = Schemas["BookingAdminRateDto"];
export type RateEdit = Schemas["BookingAdminRateEditDto"];
export type Unit = Schemas["Unit"];

const BASE = "BookingPortal/admin";

const json = (method: string, body: unknown) => ({ method, body: JSON.stringify(body) });

export function useRoles() {
  return useQuery({ queryKey: ["admin", "roles"], queryFn: () => api<AdminRole[]>(`${BASE}/roles`), staleTime: 60 * 60_000 });
}

export function useUsers() {
  return useQuery({ queryKey: ["admin", "users"], queryFn: () => api<AdminUser[]>(`${BASE}/users`) });
}

export function useUserActions() {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: ["admin", "users"] });
  return {
    create: useMutation({ mutationFn: (body: AdminUserCreate) => api<AdminUser>(`${BASE}/users`, json("POST", body)), onSuccess: refresh }),
    edit: useMutation({
      mutationFn: ({ id, body }: { id: number; body: AdminUserEdit }) => api<AdminUser>(`${BASE}/users/${id}`, json("PUT", body)),
      onSuccess: refresh,
    }),
    setPassword: useMutation({
      mutationFn: ({ id, newPassword }: { id: number; newPassword: string }) => api<void>(`${BASE}/users/${id}/password`, json("PUT", { newPassword })),
    }),
    setActive: useMutation({
      mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => api<AdminUser>(`${BASE}/users/${id}/active`, json("PUT", { isActive })),
      onSuccess: refresh,
    }),
  };
}

export function useOrganization() {
  return useQuery({ queryKey: ["admin", "organization"], queryFn: () => api<Organization>(`${BASE}/organization`) });
}

export function useOrganizationActions() {
  const client = useQueryClient();
  return {
    edit: useMutation({
      mutationFn: (body: OrganizationEdit) => api<Organization>(`${BASE}/organization`, json("PUT", body)),
      onSuccess: (data) => client.setQueryData(["admin", "organization"], data),
    }),
  };
}

/** Asked for only when somebody presses "Show": the key does not travel with the record. */
export function fetchApiKey() {
  return api<{ apiKey: string }>(`${BASE}/organization/api-key`);
}

/** Null when the clinic has none yet (the backend answers 204). */
export function useFundingSource() {
  return useQuery({ queryKey: ["admin", "funding-source"], queryFn: async () => (await api<FundingSource | null>(`${BASE}/funding-source`)) ?? null });
}

export function useFundingSourceActions() {
  const client = useQueryClient();
  const refresh = (data: FundingSource) => {
    client.setQueryData(["admin", "funding-source"], data);
    void client.invalidateQueries({ queryKey: ["admin", "organization"] });
    void client.invalidateQueries({ queryKey: ["admin", "rates"] });
    // The trip form reads the funding source from my-funding-source.
    void client.invalidateQueries({ queryKey: ["funding-context"] });
  };
  return {
    create: useMutation({ mutationFn: (body: FundingSourceEdit) => api<FundingSource>(`${BASE}/funding-source`, json("POST", body)), onSuccess: refresh }),
    edit: useMutation({ mutationFn: (body: FundingSourceEdit) => api<FundingSource>(`${BASE}/funding-source`, json("PUT", body)), onSuccess: refresh }),
  };
}

export function useBillingItems() {
  return useQuery({ queryKey: ["admin", "billing-items"], queryFn: () => api<BillingItem[]>(`${BASE}/billing-items`) });
}

export function useBillingItemActions() {
  const client = useQueryClient();
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ["admin", "billing-items"] });
    void client.invalidateQueries({ queryKey: ["admin", "rates"] });
  };
  return {
    create: useMutation({ mutationFn: (body: BillingItemEdit) => api<BillingItem>(`${BASE}/billing-items`, json("POST", body)), onSuccess: refresh }),
    edit: useMutation({
      mutationFn: ({ id, body }: { id: number; body: BillingItemEdit }) => api<BillingItem>(`${BASE}/billing-items/${id}`, json("PUT", body)),
      onSuccess: refresh,
    }),
    remove: useMutation({ mutationFn: (id: number) => api<void>(`${BASE}/billing-items/${id}`, { method: "DELETE" }), onSuccess: refresh }),
  };
}

export function useRates() {
  return useQuery({ queryKey: ["admin", "rates"], queryFn: () => api<Rate[]>(`${BASE}/rates`) });
}

export function useRateActions() {
  const client = useQueryClient();
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ["admin", "rates"] });
    void client.invalidateQueries({ queryKey: ["admin", "billing-items"] });
  };
  return {
    create: useMutation({ mutationFn: (body: RateEdit) => api<Rate>(`${BASE}/rates`, json("POST", body)), onSuccess: refresh }),
    edit: useMutation({
      mutationFn: ({ id, body }: { id: number; body: RateEdit }) => api<Rate>(`${BASE}/rates/${id}`, json("PUT", body)),
      onSuccess: refresh,
    }),
  };
}

export function useUnits() {
  return useQuery({ queryKey: ["units"], queryFn: () => api<Unit[]>("Units"), staleTime: 60 * 60_000 });
}
