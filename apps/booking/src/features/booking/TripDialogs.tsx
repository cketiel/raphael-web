"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { PhCheckCircle, PhWarning, PhWarningCircle, PhX } from "@/components/ui/Icon";

export type Toast = { tone: "success" | "warning" | "error"; text: string };

/** What the cancel dialog names: the trip's number, patient and pickup time. */
export interface CancelTarget {
  number: string;
  patient: string;
  time: string | null;
}

/** Confirmation before cancelling: names each trip, because a cancellation reaches the provider. */
export function CancelDialog({ lines, busy, onKeep, onConfirm }: { lines: CancelTarget[]; busy: boolean; onKeep: () => void; onConfirm: () => void }) {
  const t = useTranslations("dashboard");
  const list = lines.map((l) => `#${l.number} ${l.patient}${l.time ? ` · ${l.time}` : ""}`).join(" · ");
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onKeep(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onKeep]);
  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-[var(--ds-scrim)] p-4" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onKeep(); }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="cancel-title" aria-describedby="cancel-body"
        className="ds-pop w-full max-w-[520px] rounded-xl bg-[var(--ds-surface)] p-6 shadow-[0_30px_70px_rgb(5_25_35/0.45)]">
        <div className="flex gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--ds-error-container)]">
            <PhWarning size={22} weight="fill" aria-hidden className="text-[var(--ds-error)]" />
          </span>
          <div>
            <h2 id="cancel-title" className="text-lg font-semibold">{t("cancelDialogTitle", { count: lines.length })}</h2>
            <p id="cancel-body" className="mt-2 text-[13.5px] leading-[1.55] text-[var(--ds-on-surface-variant)]">{t("cancelDialogBody", { list })}</p>
          </div>
        </div>
        <div className="mt-[22px] flex gap-2.5">
          <button type="button" autoFocus disabled={busy} onClick={onKeep}
            className="h-11 flex-1 rounded-lg border border-[var(--ds-outline)] text-[13.5px] font-semibold">{t("keepTrips")}</button>
          <button type="button" disabled={busy} onClick={onConfirm}
            className="h-11 flex-1 rounded-lg bg-[var(--ds-error)] text-[13.5px] font-bold text-[var(--ds-on-primary)] disabled:opacity-60">
            {busy ? t("cancelling") : t("cancelNTrips", { count: lines.length })}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ToastBar({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const t = useTranslations("common");
  const Icon = toast.tone === "success" ? PhCheckCircle : PhWarningCircle;
  const iconColor = toast.tone === "success" ? "text-[var(--ds-toast-icon)]" : toast.tone === "warning" ? "text-[#f0923f]" : "text-[#f27a6c]";
  return (
    <div role="status"
      className="ds-pop fixed bottom-[96px] left-4 right-4 z-[1250] flex items-center gap-3 rounded-[10px] bg-[var(--ds-toast-bg)] px-4 py-3.5 text-[var(--ds-toast-ink)] shadow-[inset_0_0_0_1px_var(--ds-toast-ring),0_16px_38px_rgb(5_25_35/0.3)] md:bottom-[22px] md:left-auto md:right-auto md:ml-[26px]">
      <Icon size={20} weight="fill" aria-hidden className={`shrink-0 ${iconColor}`} />
      <span className="text-[13.5px]">{toast.text}</span>
      <button type="button" aria-label={t("close")} onClick={onClose} className="ml-2 flex"><PhX size={16} aria-hidden /></button>
    </div>
  );
}
