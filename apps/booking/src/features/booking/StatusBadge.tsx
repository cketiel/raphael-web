"use client";

import { useTranslations } from "next-intl";
import { statusStyle } from "./rules";

/** A trip's status in the user's language. A status this portal does not know is shown as it comes. */
export function StatusBadge({ status }: { status: string | null | undefined }) {
  const t = useTranslations("status");
  const style = statusStyle(status);
  const label = status && t.has(status) ? t(status) : status;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style.badge}`}>
      <span className={`size-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}
