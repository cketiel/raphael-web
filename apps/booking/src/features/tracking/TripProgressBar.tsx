"use client";

import { useTranslations } from "next-intl";
import { PhCheck, PhVan } from "@/components/ui/Icon";

const MONO = "font-[family-name:var(--font-plex-mono)]";

export type ProgressStage = "waiting" | "toPickup" | "onBoard" | "done" | "canceled";

/**
 * How far along the trip is, between the pickup (start) and the drop-off (end), with the vehicle
 * where it is. Colours from the palette, not traffic lights: red already means canceled and error.
 * - Driven: the In progress violet (the vehicle's colour), orange when the arrival passes the
 *   appointment (Late), green when the trip is done.
 * - Still to go: neutral, dashed, as the road ahead on the map.
 */
export function TripProgressBar({ stage, progress, late, milesToGo, pickupLabel, dropoffLabel }: {
  stage: ProgressStage;
  /** 0–1 of the pickup → drop-off leg already driven. */
  progress: number;
  late: boolean;
  milesToGo: string | null;
  pickupLabel: string;
  dropoffLabel: string;
}) {
  const t = useTranslations("tracking");
  const done = stage === "done";
  const p = done ? 1 : stage === "onBoard" ? Math.max(0.02, Math.min(0.98, progress)) : 0;
  const fill = done ? "var(--ds-success)" : late ? "var(--st-late)" : "var(--st-inprogress)";
  const showVehicle = stage === "onBoard" || stage === "toPickup";
  const caption = done ? t("progressDone")
    : stage === "canceled" ? t("progressCanceled")
      : stage === "waiting" ? t("progressWaiting")
        : stage === "toPickup" ? t("progressToPickup")
          : milesToGo ? t("progressToGo", { miles: milesToGo }) : t("progressOnBoard");

  return (
    <div className="min-w-0" role="img" aria-label={`${caption}. ${pickupLabel} → ${dropoffLabel}`}>
      <div className="relative flex h-6 items-center">
        {/* start: the pickup */}
        <span className="relative z-[1] size-3 shrink-0 rounded-full border-2 border-[var(--ds-surface)] bg-[var(--ds-pickup)] shadow-[0_0_0_1.5px_var(--ds-pickup)]" />
        <div className="relative mx-1 h-1.5 flex-1">
          {/* the way still to go: dashed and neutral */}
          <span className="absolute inset-0 rounded-full bg-[repeating-linear-gradient(90deg,var(--ds-outline)_0_8px,transparent_8px_13px)] opacity-80" />
          {/* the way already driven */}
          <span className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700" style={{ width: `${p * 100}%`, background: fill }} />
          {showVehicle && (
            <span className="absolute top-1/2 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[var(--ds-surface)] shadow-[0_2px_6px_rgb(5_25_35/0.3)] transition-[left] duration-700"
              style={{ left: `${p * 100}%`, background: fill }}>
              <PhVan size={13} weight="fill" className="text-white" aria-hidden />
            </span>
          )}
        </div>
        {/* end: the drop-off */}
        <span className={`relative z-[1] flex size-3 shrink-0 items-center justify-center rounded-full border-2 border-[var(--ds-surface)] shadow-[0_0_0_1.5px_var(--ds-dropoff)] ${done ? "!size-4" : ""}`}
          style={{ background: done ? "var(--ds-success)" : "var(--ds-dropoff)" }}>
          {done && <PhCheck size={9} weight="bold" className="text-white" aria-hidden />}
        </span>
      </div>
      <div className={`${MONO} mt-1 flex items-center gap-2 text-[10.5px] uppercase tracking-[0.06em] text-[var(--ds-on-surface-variant)]`}>
        <span className="truncate">{pickupLabel}</span>
        <span className={`mx-auto shrink-0 font-semibold ${late && !done ? "text-[var(--st-late-ink)]" : "text-[var(--ds-on-surface)]"}`}>{caption}</span>
        <span className="truncate text-right">{dropoffLabel}</span>
      </div>
    </div>
  );
}
