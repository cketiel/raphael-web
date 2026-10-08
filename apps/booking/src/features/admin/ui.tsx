"use client";

import { useTranslations } from "next-intl";
import { useEffect, type FormEvent, type ReactNode } from "react";

/**
 * A form dialog of the Admin tab: full screen on a phone, centred card from a tablet up, with its
 * actions always at the bottom.
 */
export function FormModal({ title, children, onClose, onSubmit, saving, submitLabel }: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
  saving: boolean;
  submitLabel?: string;
}) {
  const tc = useTranslations("common");
  const t = useTranslations("admin");

  // Escape closes it wherever the focus is, as the browser's own dialogs do.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSubmit();
  }

  return (
    <div className="fixed inset-0 z-[1050] flex items-stretch justify-center bg-slate-900/50 sm:items-start sm:overflow-y-auto sm:p-4" role="presentation">
      <form onSubmit={submit} role="dialog" aria-modal="true" aria-label={title}
        className="flex w-full flex-col bg-surface shadow-2xl sm:my-6 sm:max-w-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-slate-50 px-4 py-3 sm:rounded-t-2xl sm:px-6">
          <h2 className="text-lg font-bold text-brand">{title}</h2>
          <button type="button" onClick={onClose} aria-label={tc("close")} className="text-2xl leading-none text-muted hover:text-foreground">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
        <div className="flex justify-end gap-2 border-t border-border bg-slate-50 px-4 py-3 sm:rounded-b-2xl sm:px-6">
          <button type="button" onClick={onClose} className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-bold">{tc("cancel")}</button>
          <button type="submit" disabled={saving} className="rounded-lg bg-brand px-6 py-2 text-sm font-bold text-white disabled:opacity-50">
            {saving ? t("saving") : submitLabel ?? t("save")}
          </button>
        </div>
      </form>
    </div>
  );
}

const INPUT = "mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-brand disabled:bg-slate-50 disabled:text-muted";

export function TextField({ label, value, onChange, type = "text", required, disabled, span, autoComplete, step, min }: {
  label: string;
  value: string | number | null | undefined;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  span?: boolean;
  autoComplete?: string;
  step?: string;
  min?: string;
}) {
  return (
    <label className={`block text-xs font-semibold text-muted ${span ? "sm:col-span-2" : ""}`}>
      {label}{required && <span className="text-red-600"> *</span>}
      <input type={type} value={value ?? ""} required={required} disabled={disabled} autoComplete={autoComplete} step={step} min={min}
        onChange={(e) => onChange(e.target.value)} className={INPUT} />
    </label>
  );
}

export function SelectField({ label, value, onChange, children, required, disabled }: {
  label: string;
  value: string | number | null | undefined;
  onChange: (value: string) => void;
  children: ReactNode;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="block text-xs font-semibold text-muted">
      {label}{required && <span className="text-red-600"> *</span>}
      <select value={value ?? ""} required={required} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={INPUT}>
        {children}
      </select>
    </label>
  );
}

export function CheckField({ label, checked, onChange, disabled }: {
  label: string;
  checked: boolean | null | undefined;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={Boolean(checked)} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="size-4" />
      {label}
    </label>
  );
}

/** A section of the Admin tab: a title, an optional action, and its content on a card. */
export function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-surface p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="mr-auto text-base font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function PrimaryButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-lg bg-[#198754] px-4 py-2 text-sm font-bold text-white shadow-sm hover:opacity-90">
      {children}
    </button>
  );
}

export function SmallButton({ children, onClick, tone = "neutral", disabled, title }: {
  children: ReactNode;
  onClick: () => void;
  tone?: "neutral" | "danger" | "success";
  disabled?: boolean;
  title?: string;
}) {
  const style = {
    neutral: "border-border text-slate-700 hover:bg-slate-100",
    danger: "border-[#dc3545] text-[#dc3545] hover:bg-red-50",
    success: "border-[#198754] text-[#198754] hover:bg-emerald-50",
  }[tone];
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title}
      className={`rounded-lg border px-3 py-1.5 text-xs font-bold disabled:opacity-40 ${style}`}>
      {children}
    </button>
  );
}

/** Read-only notice at the top of a section: shared funding source, office rates… */
export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warning" }) {
  return (
    <p className={`mb-4 rounded-lg border px-3 py-2 text-sm ${tone === "warning" ? "border-amber-300 bg-amber-50 text-amber-900" : "border-sky-200 bg-sky-50 text-sky-900"}`}>
      {children}
    </p>
  );
}

/** "2026-10-01T00:00:00" → "2026-10-01", what a date input wants. */
export function toDateInput(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}
