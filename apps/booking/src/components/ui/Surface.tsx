import type { ComponentType, ReactNode } from "react";

type IconComponent = ComponentType<{ size?: number | string; className?: string; "aria-hidden"?: boolean }>;

/** A white card on the page background. */
export function Card({ children, className = "", padded = true }: { children: ReactNode; className?: string; padded?: boolean }) {
  return <section className={`rounded-2xl border border-border bg-surface shadow-card ${padded ? "p-4 sm:p-5" : ""} ${className}`}>{children}</section>;
}

/** A card's title row: title, optional icon and description, and its actions on the right. */
export function CardHeader({ title, description, icon: Icon, actions }: {
  title: ReactNode;
  description?: ReactNode;
  icon?: IconComponent;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start gap-3">
      {Icon && <span className="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand"><Icon size={18} aria-hidden /></span>}
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** The top of every page: its title, a line saying what it is for, and its main actions. */
export function PageHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end gap-3">
      {/* At least 22rem for the title: on a phone the actions drop below it instead of squeezing it. */}
      <div className="min-w-[min(100%,22rem)] flex-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-1 text-[0.95rem] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** What a list shows when it has nothing to show, with what to do about it. */
export function EmptyState({ icon: Icon, title, children }: { icon: IconComponent; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <span className="mb-3 flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand"><Icon size={26} aria-hidden /></span>
      <p className="text-base font-semibold text-foreground">{title}</p>
      {children && <div className="mt-1 max-w-md text-sm text-muted">{children}</div>}
    </div>
  );
}

const TONE = {
  neutral: "bg-slate-100 text-slate-700",
  brand: "bg-brand-100 text-brand-800",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
  warning: "bg-warning-soft text-warning",
  info: "bg-info-soft text-info",
  violet: "bg-violet-100 text-violet-800",
} as const;

export type Tone = keyof typeof TONE;

/** A small rounded label: a state, a role, a kind of notice. */
export function Badge({ tone = "neutral", icon: Icon, children, className = "" }: { tone?: Tone; icon?: IconComponent; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[tone]} ${className}`}>
      {Icon && <Icon size={12} aria-hidden />}
      {children}
    </span>
  );
}

/** A notice inside a card or a form. */
export function Notice({ tone = "info", children, className = "" }: { tone?: "info" | "warning" | "danger" | "success"; children: ReactNode; className?: string }) {
  const style = {
    info: "border-info/25 bg-info-soft text-[#124a7a]",
    warning: "border-warning/30 bg-warning-soft text-[#7a3d06]",
    danger: "border-danger/30 bg-danger-soft text-[#8a1c1c]",
    success: "border-success/30 bg-success-soft text-[#14532d]",
  }[tone];
  return <div className={`rounded-xl border px-3.5 py-2.5 text-sm ${style} ${className}`}>{children}</div>;
}
