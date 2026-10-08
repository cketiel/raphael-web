"use client";

import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { IconCheck } from "./Icon";

type IconComponent = ComponentType<{ size?: number | string; className?: string; "aria-hidden"?: boolean }>;

export interface MenuItem {
  key: string;
  label: ReactNode;
  icon?: IconComponent;
  /** Marked as the current choice (a language, a filter). */
  selected?: boolean;
  danger?: boolean;
  onSelect: () => void;
}

/**
 * A button that opens a short list of actions or choices. Closes on a choice, on a click outside and
 * on Escape, and the arrow keys move through it.
 */
export function Menu({ trigger, label, items, header, align = "right", buttonClassName = "" }: {
  trigger: ReactNode;
  label: string;
  items: MenuItem[];
  header?: ReactNode;
  align?: "left" | "right";
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const buttons = [...(list.current?.querySelectorAll("button") ?? [])];
        const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
        const next = e.key === "ArrowDown" ? (at + 1) % buttons.length : (at - 1 + buttons.length) % buttons.length;
        buttons[next]?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    // Focus the current choice, or the first item, so the keyboard starts inside the menu.
    const first = list.current?.querySelector<HTMLButtonElement>("[aria-checked='true']") ?? list.current?.querySelector("button");
    first?.focus();
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button type="button" aria-haspopup="menu" aria-expanded={open} aria-label={label} title={label} onClick={() => setOpen((o) => !o)}
        className={buttonClassName}>
        {trigger}
      </button>
      {open && (
        <div className={`absolute top-full z-[1200] mt-2 min-w-52 overflow-hidden rounded-xl border border-border bg-surface py-1 text-foreground shadow-pop ${align === "right" ? "right-0" : "left-0"}`}>
          {header && <div className="border-b border-border px-4 py-2.5">{header}</div>}
          <ul ref={list} role="menu" aria-label={label}>
            {items.map((item) => (
              <li key={item.key} role="none">
                <button type="button" role={item.selected === undefined ? "menuitem" : "menuitemradio"} aria-checked={item.selected}
                  onClick={() => { setOpen(false); item.onSelect(); }}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-[0.95rem] hover:bg-surface-2 focus:bg-surface-2 focus:outline-none ${
                    item.danger ? "text-danger" : ""
                  }`}>
                  {item.icon && <item.icon size={16} aria-hidden className={item.danger ? "" : "text-muted"} />}
                  <span className="flex-1">{item.label}</span>
                  {item.selected && <IconCheck size={16} aria-hidden className="text-brand" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
