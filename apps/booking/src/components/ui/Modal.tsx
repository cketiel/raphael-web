"use client";

import { useTranslations } from "next-intl";
import { useEffect, type ComponentType, type FormEvent, type ReactNode } from "react";
import { IconClose } from "./Icon";

type IconComponent = ComponentType<{ size?: number | string; className?: string; "aria-hidden"?: boolean }>;

const WIDTH = { sm: "sm:max-w-md", md: "sm:max-w-2xl", lg: "sm:max-w-4xl", xl: "sm:max-w-6xl" } as const;

/**
 * Every dialog of the portal. A phone gets the whole screen, with the actions always reachable at
 * the bottom; from a tablet up it is a centred card whose body scrolls between a fixed header and
 * footer. Escape closes it, and the page behind does not scroll.
 *
 * Pass `onSubmit` and the dialog is a form: Enter submits and the footer's submit button works.
 */
export function Modal({ title, subtitle, icon: Icon, size = "md", onClose, onSubmit, footer, children, labelledBy = "modal-title" }: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: IconComponent;
  size?: keyof typeof WIDTH;
  onClose: () => void;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  footer?: ReactNode;
  children: ReactNode;
  labelledBy?: string;
}) {
  const tc = useTranslations("common");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const body = (
    <>
      <header className="flex items-start gap-3 border-b border-border px-4 py-3 sm:px-6 sm:py-4">
        {Icon && (
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700"><Icon size={18} aria-hidden /></span>
        )}
        <div className="min-w-0 flex-1">
          <h2 id={labelledBy} className="text-lg font-bold leading-tight text-foreground sm:text-xl">{title}</h2>
          {subtitle && <div className="mt-0.5 text-sm text-muted">{subtitle}</div>}
        </div>
        <button type="button" onClick={onClose} aria-label={tc("close")}
          className="-mr-1 flex size-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-foreground">
          <IconClose size={18} aria-hidden />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">{children}</div>
      {footer && (
        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-surface-2 px-4 py-3 sm:rounded-b-2xl sm:px-6">
          {footer}
        </footer>
      )}
    </>
  );

  const panel = `flex max-h-dvh w-full flex-col bg-surface shadow-pop sm:my-8 sm:max-h-[calc(100dvh-4rem)] sm:rounded-2xl ${WIDTH[size]}`;

  return (
    <div className="fixed inset-0 z-[1050] flex items-stretch justify-center bg-slate-900/55 backdrop-blur-[2px] sm:items-start sm:p-4" role="presentation"
      // A click outside closes a read-only dialog. Never a form: a stray click would lose what was typed.
      onMouseDown={(e) => { if (!onSubmit && e.target === e.currentTarget) onClose(); }}>
      {onSubmit ? (
        <form role="dialog" aria-modal="true" aria-labelledby={labelledBy} onSubmit={onSubmit} className={panel}>{body}</form>
      ) : (
        <section role="dialog" aria-modal="true" aria-labelledby={labelledBy} className={panel}>{body}</section>
      )}
    </div>
  );
}
