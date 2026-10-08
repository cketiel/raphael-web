import type { ReactNode } from "react";
import { IconInfo } from "./ui/Icon";

/** The ⓘ icon with a hover/focus hint, as the Bootstrap tooltips of the original portal. */
export function InfoTip({ children, label }: { children: ReactNode; label: string }) {
  return (
    <span className="group relative inline-flex align-middle">
      <button type="button" aria-label={label}
        className="inline-flex size-5 cursor-help items-center justify-center rounded-full text-brand-500 transition hover:scale-110 hover:text-brand-700">
        <IconInfo size={15} aria-hidden />
      </button>
      <span role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-[2500] mb-2 hidden w-64 -translate-x-1/2 rounded-lg bg-navy px-4 py-2.5 text-left text-sm font-normal leading-relaxed text-white shadow-pop group-focus-within:block group-hover:block">
        {children}
      </span>
    </span>
  );
}
