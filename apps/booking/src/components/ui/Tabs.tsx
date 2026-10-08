import type { ComponentType, ReactNode } from "react";

type IconComponent = ComponentType<{ size?: number | string; className?: string; "aria-hidden"?: boolean }>;

export interface TabItem<K extends string> {
  key: K;
  label: ReactNode;
  icon?: IconComponent;
  /** A count beside the label. */
  count?: number;
  /** A red dot: something unread inside. */
  attention?: boolean;
}

/**
 * Tabs inside a page (notification kinds, admin sections). They scroll sideways on a phone rather
 * than wrap into a wall of buttons.
 */
export function Tabs<K extends string>({ items, value, onChange, label }: {
  items: TabItem<K>[];
  value: K;
  onChange: (key: K) => void;
  label: string;
}) {
  return (
    <div className="-mx-1 mb-4 overflow-x-auto px-1 [scrollbar-width:none]">
      <div role="tablist" aria-label={label} className="flex min-w-max gap-1 border-b border-border">
        {items.map((item) => {
          const active = item.key === value;
          return (
            <button key={item.key} type="button" role="tab" aria-selected={active} onClick={() => onChange(item.key)}
              className={`relative -mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-[0.95rem] font-semibold transition-colors ${
                active ? "border-brand text-brand" : "border-transparent text-muted hover:border-border-strong hover:text-foreground"
              }`}>
              {item.icon && <item.icon size={16} aria-hidden />}
              {item.label}
              {item.count != null && (
                <span className={`rounded-full px-1.5 py-px text-xs ${active ? "bg-brand-100 text-brand-800" : "bg-slate-100 text-slate-600"}`}>{item.count}</span>
              )}
              {item.attention && <span className="size-2 rounded-full bg-danger" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
