import type { ReactNode } from "react";

/** The ⓘ icon with a hover/focus hint, as the Bootstrap tooltips of the original portal. */
export function InfoTip({ children, label }: { children: ReactNode; label: string }) {
  return (
    <span className="group relative inline-block align-middle">
      <button type="button" aria-label={label}
        className="ml-1 inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-[#0d6efd] text-[10px] font-bold text-[#0d6efd] transition hover:scale-125 hover:opacity-60">
        i
      </button>
      <span role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-[2500] mb-2 hidden w-64 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2.5 text-left text-xs font-normal leading-relaxed text-white shadow-lg group-focus-within:block group-hover:block">
        {children}
      </span>
    </span>
  );
}
