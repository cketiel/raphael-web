"use client";

import type { Schemas } from "@raphael/api-client";
import { useQuery } from "@tanstack/react-query";
import { api, BffError } from "@/lib/bff";

export type Customer = Schemas["CustomerResponseDto"];
export type SpaceType = Schemas["SpaceType"];

/** GET /api/BookingPortal/my-funding-source answers an anonymous { id, name }. */
export interface FundingSourceRef {
  id: number;
  name: string;
}

/**
 * The funding source situation decides whether a booking can be saved at all:
 * - integrator (clinic): its linked FS, fixed; without one, booking is disabled;
 * - broker / admin: free choice among all FS.
 */
export type FundingContext =
  | { kind: "integrator"; linked: FundingSourceRef }
  | { kind: "integrator-unlinked" }
  | { kind: "broker"; all: FundingSourceRef[] };

export function useCustomers() {
  return useQuery({ queryKey: ["customers"], queryFn: () => api<Customer[]>("Customers"),
    // Hundreds of patients: read once per session; a booking that creates one refreshes it.
    staleTime: Infinity });
}

export function useSpaceTypes() {
  return useQuery({ queryKey: ["space-types"], queryFn: () => api<SpaceType[]>("SpaceTypes"), staleTime: 30 * 60_000 });
}

export function useFundingContext(isIntegrator: boolean) {
  return useQuery<FundingContext>({
    queryKey: ["funding-context", isIntegrator],
    staleTime: 30 * 60_000,
    queryFn: async () => {
      if (!isIntegrator) {
        const all = await api<Schemas["FundingSource"][]>("FundingSources");
        return { kind: "broker", all: all.map((f) => ({ id: f.id ?? 0, name: f.name })) };
      }
      try {
        const linked = await api<FundingSourceRef>("BookingPortal/my-funding-source");
        return linked?.name ? { kind: "integrator", linked } : { kind: "integrator-unlinked" };
      } catch (e) {
        // 404 = no funding source linked to this integrator. The original's intent was to disable
        // booking in that case; it crashed the whole start-up instead (Booking Web app.js:125-133).
        if (e instanceof BffError && e.status === 404) return { kind: "integrator-unlinked" };
        throw e;
      }
    },
  });
}

/** The IDs the production report is filtered by: the linked FS for a clinic, every FS for a broker. */
export function reportFundingIds(context: FundingContext | undefined): number[] {
  if (!context) return [];
  if (context.kind === "integrator") return [context.linked.id];
  if (context.kind === "broker") return context.all.map((f) => f.id);
  return [];
}
