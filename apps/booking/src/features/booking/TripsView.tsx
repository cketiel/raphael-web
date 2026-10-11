"use client";

import { useTranslations } from "next-intl";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { PhChartLineUp, PhRows } from "@/components/ui/Icon";

export type TripsView = "table" | "timeline";

const STORAGE_KEY = "rb_trips_view";
const Context = createContext<{ view: TripsView; setView: (v: TripsView) => void }>({ view: "table", setView: () => {} });

/**
 * Which of the two views of Trips is on. It lives above the page because its switch sits in the top
 * bar, and changing it keeps the filter, the search and the selection: only the drawing changes.
 * Remembered in this browser; a private window simply starts on Table.
 */
export function TripsViewProvider({ children }: { children: ReactNode }) {
  const [view, setViewState] = useState<TripsView>("table");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // Read after mount, so the server and the first paint agree.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved === "timeline" || saved === "table") setViewState(saved);
    } catch { /* storage blocked: stay on Table */ }
  }, []);
  const setView = (v: TripsView) => {
    setViewState(v);
    try { localStorage.setItem(STORAGE_KEY, v); } catch { /* not remembered, still switched */ }
  };
  return <Context.Provider value={{ view, setView }}>{children}</Context.Provider>;
}

export const useTripsView = () => useContext(Context);

/** The design's lead control: Timeline | Table, 44 px, the chosen one raised on the track. */
export function ViewSwitch({ className = "" }: { className?: string }) {
  const t = useTranslations("dashboard");
  const { view, setView } = useTripsView();
  const option = (key: TripsView, label: string, Icon: typeof PhRows) => {
    const on = view === key;
    return (
      <button type="button" role="radio" aria-checked={on} onClick={() => setView(key)}
        className={`flex items-center gap-[7px] rounded-md px-3.5 text-[13.5px] font-semibold ${on
          ? "bg-[var(--ds-switch-on)] text-[var(--ds-primary)] shadow-[0_1px_3px_rgb(5_25_35/0.2)]"
          : "text-[var(--ds-on-surface-variant)] hover:text-[var(--ds-on-surface)]"}`}>
        <Icon size={16} weight={on ? "fill" : "regular"} aria-hidden />{label}
      </button>
    );
  };
  return (
    <div role="radiogroup" aria-label={t("viewLabel")}
      className={`flex h-11 rounded-[9px] border border-[var(--ds-outline-variant)] bg-[var(--ds-track)] p-1 ${className}`}>
      {option("timeline", t("viewTimeline"), PhChartLineUp)}
      {option("table", t("viewTable"), PhRows)}
    </div>
  );
}
