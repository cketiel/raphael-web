import type { ButtonHTMLAttributes, ComponentType, ReactNode, Ref } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success" | "danger-outline";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-700 shadow-sm",
  secondary: "border border-border-strong bg-surface text-foreground hover:bg-surface-2",
  ghost: "text-muted hover:bg-brand-50 hover:text-brand",
  danger: "bg-danger text-white hover:brightness-95 shadow-sm",
  "danger-outline": "border border-danger/60 bg-surface text-danger hover:bg-danger-soft",
  success: "bg-success text-white hover:brightness-95 shadow-sm",
};

const SIZE: Record<Size, string> = {
  sm: "h-8 gap-1.5 px-3 text-sm",
  md: "h-10 gap-2 px-4 text-[0.95rem]",
  lg: "h-12 gap-2 px-6 text-base",
};

type IconComponent = ComponentType<{ size?: number | string; className?: string; "aria-hidden"?: boolean }>;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: IconComponent;
  /** Shows a spinner and blocks the button while a request runs. */
  loading?: boolean;
  /** Icon-only button: the label goes to aria-label and the title. */
  iconOnly?: boolean;
  label?: string;
  children?: ReactNode;
  /** React 19 passes refs as an ordinary prop. */
  ref?: Ref<HTMLButtonElement>;
}

/** The portal's button. 40 px high by default: big enough for a finger on a tablet. */
export function Button({
  variant = "primary", size = "md", icon: Icon, loading, iconOnly, label, children, className = "", disabled, type = "button", ...rest
}: ButtonProps) {
  const iconSize = size === "sm" ? 15 : size === "lg" ? 19 : 17;
  return (
    <button type={type} disabled={disabled || loading} aria-label={iconOnly ? label : undefined} title={iconOnly ? label : rest.title}
      className={`inline-flex shrink-0 items-center justify-center rounded-[var(--radius)] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT[variant]} ${
        iconOnly ? `${size === "sm" ? "size-8" : size === "lg" ? "size-12" : "size-10"} px-0` : SIZE[size]
      } ${className}`}
      {...rest}>
      {loading ? (
        <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        Icon && <Icon size={iconSize} aria-hidden />
      )}
      {!iconOnly && (children ?? label)}
    </button>
  );
}
