import { forwardRef, type ComponentType, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

/**
 * Form controls at Bootstrap's reading size: 16 px text and 40 px high. Smaller text in a form is
 * what made the first port of the trip form hard to read (and makes iOS zoom in on focus).
 */
export const CONTROL =
  "w-full rounded-[var(--radius)] border border-border-strong bg-surface px-3 text-base text-foreground placeholder:text-slate-400 outline-none transition-colors focus:border-brand-500 focus:ring-3 focus:ring-brand-500/20 disabled:bg-surface-2 disabled:text-muted read-only:bg-surface-2 aria-[invalid=true]:border-danger";

const HEIGHT = "h-10";

type IconComponent = ComponentType<{ size?: number | string; className?: string; "aria-hidden"?: boolean }>;

/** A label over its control, with an optional hint, error and help tip. */
export function Field({ label, htmlFor, required, hint, error, tip, className = "", children }: {
  label: ReactNode;
  htmlFor?: string;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  tip?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={htmlFor} className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-slate-700">
        <span>{label}</span>
        {required && <span className="text-danger" aria-hidden="true">*</span>}
        {tip}
      </label>
      {children}
      {error ? <p className="mt-1 text-sm text-danger">{error}</p> : hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { icon?: IconComponent; iconClassName?: string }>(
  function Input({ icon: Icon, iconClassName = "text-muted", className = "", ...rest }, ref) {
    if (!Icon) return <input ref={ref} className={`${CONTROL} ${HEIGHT} ${className}`} {...rest} />;
    return (
      <div className="relative">
        <span className={`pointer-events-none absolute inset-y-0 left-3 flex items-center ${iconClassName}`}><Icon size={17} aria-hidden /></span>
        <input ref={ref} className={`${CONTROL} ${HEIGHT} pl-10 ${className}`} {...rest} />
      </div>
    );
  },
);

export function Select({ className = "", children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${CONTROL} ${HEIGHT} pr-8 ${className}`} {...rest}>{children}</select>;
}

export function Textarea({ className = "", ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${CONTROL} min-h-[4.5rem] py-2 ${className}`} {...rest} />;
}

/** A checkbox or switch with its label beside it, big enough to tap. */
export function Check({ label, className = "", ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className={`inline-flex min-h-10 cursor-pointer items-center gap-2.5 text-[0.95rem] ${className}`}>
      <input type="checkbox" className="size-[18px] accent-[var(--brand)]" {...rest} />
      <span>{label}</span>
    </label>
  );
}

/** A titled group of fields inside a form, with its icon: "1. Patient", "2. Logistics"… */
export function FormSection({ title, icon: Icon, step, children, aside }: {
  title: ReactNode;
  icon?: IconComponent;
  step?: number;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-3 flex w-full items-center gap-2.5">
        {step != null ? (
          <span className="flex size-7 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">{step}</span>
        ) : Icon ? (
          <span className="flex size-7 items-center justify-center rounded-full bg-brand-100 text-brand-700"><Icon size={14} aria-hidden /></span>
        ) : null}
        <span className="text-base font-bold text-foreground">{title}</span>
        {aside && <span className="ml-auto">{aside}</span>}
      </legend>
      {children}
    </fieldset>
  );
}
