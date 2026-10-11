"use client";

import { useTranslations } from "next-intl";

/** The nine status families of the final design (Design System §2). Each has a --st-<key> colour set. */
export type StatusKey =
  | "scheduled" | "assigned" | "accepted" | "waiting" | "late" | "arrived" | "inprogress" | "finished" | "canceled";

/**
 * The backend's status, folded into a design family. Statuses the design does not draw take the
 * closest one: Started is under way, Billed and Paid are done. Anything unknown reads as Scheduled.
 */
export function statusKey(status: string | null | undefined, isCancelled?: boolean | null): StatusKey {
  if (isCancelled) return "canceled";
  switch ((status ?? "").toLowerCase()) {
    case "assigned": return "assigned";
    case "accepted": return "accepted";
    case "waiting": return "waiting";
    case "late": return "late";
    case "arrived": return "arrived";
    case "inprogress":
    case "started": return "inprogress";
    case "finished":
    case "billed":
    case "payed": return "finished";
    case "canceled":
    case "cancelled": return "canceled";
    default: return "scheduled";
  }
}

/** The edge colour of a row or card with this status. */
export const statusEdge = (key: StatusKey) => `var(--st-${key})`;

/** The 1 px ring of the label and of the timeline dot. */
export const statusRing = (key: StatusKey) => `color-mix(in srgb, var(--st-${key}) var(--st-ring-alpha), transparent)`;

/** Never colour alone: a square of colour, the name in mono small caps, and a ring. */
export function StatusChip({ status, isCancelled, dense = false }: {
  status: string | null | undefined;
  isCancelled?: boolean | null;
  /** The table's size: 20 px, so a row keeps its two lines. */
  dense?: boolean;
}) {
  const t = useTranslations("status");
  const key = statusKey(status, isCancelled);
  const shown = isCancelled ? "Canceled" : status;
  const label = shown && t.has(shown) ? t(shown) : (shown ?? "");
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-[5px] font-[family-name:var(--font-plex-mono)] font-semibold uppercase tracking-[0.05em] ${dense
      ? "h-5 gap-1.5 px-2 text-[10.5px]" : "h-[26px] gap-[7px] px-2.5 text-[11.5px]"}`}
      style={{ background: `var(--st-${key}-bg)`, color: `var(--st-${key}-ink)`, boxShadow: `inset 0 0 0 1px ${statusRing(key)}` }}>
      <span className="size-2 rounded-[2px]" style={{ background: statusEdge(key) }} aria-hidden="true" />
      {label}
    </span>
  );
}
