"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PhCircleNotch, PhVan, PhWarningCircle } from "@/components/ui/Icon";

/**
 * Live ETA (design: Live ETA.dc.html): how long, how far and at what time the vehicle reaches the
 * stop it is heading to. One component, three sizes: `lg` in the tracking page's live card, `md`
 * in the Trips "In progress now" panel (and `compact` in the phone's closed sheet), `inline` on a
 * trip row. The three values are live: each one flashes briefly when it changes.
 */
export type LiveEtaState = "live" | "stale" | "nodata" | "arriving" | "late";

export interface LiveEtaValues {
  state: LiveEtaState;
  phase: "Pickup" | "Dropoff";
  /** Whole minutes to the ETA; null when there is no ETA. */
  minutes: number | null;
  /** "3.1"; null when the backend could not measure it. */
  miles: string | null;
  /** "09:14"; null before routing. */
  eta: string | null;
  /** How long ago the last position was taken, in seconds; null before the first one. */
  ageSeconds: number | null;
  /** "8 MIN" when late. */
  lateBy?: string | null;
  /** 0–1, how much of the way is behind: drawn as the dial's arc. */
  progress: number;
}

/** The dark live card's colours and the surface ones, for each theme (design GROUND table). */
const GROUND = {
  dark: {
    ink: "#f2f8fb", mute: "#cfe4ef", phase: "#d3c6fb", dot: "#a98cf7", disc: "#a98cf7", halo: "rgb(169 140 247 / 0.3)", van: "#1b1333",
    ring: "rgb(255 255 255 / 0.18)", tick: "rgb(207 228 239 / 0.4)", rail: "rgb(207 228 239 / 0.3)",
    late: "#f0923f", lateBg: "rgb(240 146 63 / 0.18)", lateInk: "#f7bd81", flash: "rgb(169 140 247 / 0.3)",
    inlineBg: "rgb(255 255 255 / 0.08)", inlineRing: "rgb(255 255 255 / 0.14)",
  },
  // The inline size sits on the page surface: its colours follow the theme through tokens.
  surface: {
    ink: "var(--ds-on-surface)", mute: "var(--ds-on-surface-variant)", phase: "var(--st-inprogress-ink)", dot: "var(--st-inprogress)",
    disc: "var(--st-inprogress)", halo: "transparent", van: "#fff", ring: "var(--ds-outline-variant)", tick: "var(--ds-outline)",
    rail: "var(--ds-outline)", late: "var(--st-late)", lateBg: "var(--st-late-bg)", lateInk: "var(--st-late-ink)",
    flash: "color-mix(in srgb, var(--st-inprogress) 20%, transparent)",
    inlineBg: "var(--st-inprogress-bg)", inlineRing: "color-mix(in srgb, var(--st-inprogress) var(--st-ring-alpha), transparent)",
  },
};

const SIZE = {
  lg: { gap: 14, phase: 11, disc: 62, halo: 6, van: 30, rail: 3, pad: 14, num: 44, unit: 15, sub: 12, railMin: 14, dial: 88, dialRing: 3, arc: 5, dialText: 21, cap: 8.5, foot: 10.5, footIcon: 13, arriving: 22 },
  md: { gap: 9, phase: 10, disc: 34, halo: 4, van: 17, rail: 2, pad: 6, num: 26, unit: 10, sub: 9.5, railMin: 8, dial: 48, dialRing: 2.5, arc: 4, dialText: 12, cap: 6, foot: 9.5, footIcon: 11, arriving: 12 },
};

const CIRC = 2 * Math.PI * 46;
const MONO = "font-[family-name:var(--font-plex-mono)]";

/** A key that changes whenever the value does, so the flash animation restarts. */
function useFlash(value: unknown) {
  const [tick, setTick] = useState(0);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setTick((n) => n + 1);
  }, [value]);
  return tick;
}

function Flash({ value, children, className, tint, radius }: { value: unknown; children: React.ReactNode; className?: string; tint: string; radius: number }) {
  const tick = useFlash(value);
  return (
    <div key={tick} className={`${tick ? "ds-live-flash" : ""} ${className ?? ""}`} style={{ ["--fl" as string]: tint, borderRadius: radius } as CSSProperties}>
      {children}
    </div>
  );
}

export function LiveEta({ v, size, compact = false, ground = "dark" }: {
  v: LiveEtaValues; size: "lg" | "md" | "inline"; compact?: boolean; ground?: "dark" | "surface";
}) {
  const t = useTranslations("liveEta");
  const g = GROUND[size === "inline" ? "surface" : ground];
  const noData = v.state === "nodata";
  const stale = v.state === "stale";
  const arriving = v.state === "arriving";
  const late = v.state === "late";
  const live = !stale && !noData;
  const accent = late ? g.late : g.disc;
  const thread = live ? accent : g.rail;

  const minutesText = noData || v.minutes === null ? "—" : String(Math.max(0, v.minutes));
  const milesText = noData || v.miles === null ? "—" : `${v.miles} ${t("mi")}`;
  const etaText = noData || !v.eta ? "—" : v.eta;
  const unitShown = !noData && !arriving && v.minutes !== null;
  const bigText = arriving ? t("arrivingNow") : minutesText;

  if (size === "inline") {
    return (
      <span className="inline-flex h-6 items-center gap-1.5 rounded-md px-2" style={{ background: g.inlineBg, boxShadow: `inset 0 0 0 1px ${g.inlineRing}` }}
        aria-label={t("aria", { minutes: minutesText, miles: milesText, eta: etaText })}>
        <span className={`size-[7px] shrink-0 rounded-full ${live ? "ds-pulse" : ""}`}
          style={live ? { background: late ? g.late : g.dot } : { border: `1.5px solid ${g.mute}` }} />
        <span className={`${MONO} whitespace-nowrap text-[11px] font-semibold tracking-[0.03em]`} style={{ color: g.ink }}>
          {noData ? "— · — · —" : `${arriving ? t("arrivingNow") : `${minutesText} ${t("min")}`} · ${milesText} · ${etaText}`}
        </span>
        {late && <span className={`${MONO} whitespace-nowrap text-[10px] font-semibold tracking-[0.06em]`} style={{ color: g.lateInk }}>· {t("lateShort")}</span>}
      </span>
    );
  }

  const s = SIZE[size];
  const arcDash = `${(v.progress * CIRC).toFixed(1)} ${CIRC.toFixed(1)}`;
  const ahead = `repeating-linear-gradient(90deg, ${thread} 0 7px, transparent 7px 16px)`;

  if (compact) {
    return (
      <div className="flex w-full items-center">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full" style={{ background: live ? accent : "transparent", boxShadow: `0 0 0 4px ${live ? g.halo : "transparent"}` }}>
          <PhVan size={18} weight="fill" style={{ color: live ? g.van : g.mute }} aria-hidden />
        </span>
        <span className="h-0.5 min-w-2.5 flex-1 rounded-sm" style={{ background: thread }} />
        <div className="shrink-0 px-2 text-center">
          <Flash value={v.minutes} tint={g.flash} radius={7} className="flex items-baseline justify-center gap-[5px] px-[5px] py-px">
            <span className={`${MONO} whitespace-nowrap text-[21px] font-semibold leading-none`} style={{ color: stale ? g.mute : g.ink }}>{bigText}</span>
            {unitShown && <span className={`${MONO} text-[10px] font-semibold tracking-[0.12em]`} style={{ color: stale ? g.mute : accent }}>{t("min")}</span>}
          </Flash>
          <div className={`${MONO} mt-0.5 whitespace-nowrap text-[9.5px] font-medium tracking-[0.12em]`} style={{ color: g.mute }}>{milesText}</div>
        </div>
        <span className="h-0.5 min-w-2.5 flex-1 rounded-sm" style={{ background: ahead, backgroundSize: "16px 2px" }} />
        <span className="mr-0.5 size-0 shrink-0 border-y-4 border-l-[6px] border-y-transparent" style={{ borderLeftColor: thread }} />
        <Dial size={44} ring={3} arc={5} text={12} cap="" v={v} g={g} arcDash={arcDash} accent={accent} live={live} etaText={etaText} />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col" style={{ gap: s.gap }}>
      <div className={`${MONO} flex items-center gap-2 font-semibold uppercase tracking-[0.12em]`} style={{ fontSize: s.phase, color: live ? g.phase : g.mute }}>
        <span className={`size-2 shrink-0 rounded-full ${live ? "ds-pulse" : ""}`}
          style={live ? { background: late ? g.late : g.dot, boxShadow: `0 0 10px ${late ? g.late : g.dot}` } : { border: `1.5px solid ${g.mute}` }} />
        {noData ? t("waitingTitle") : v.phase === "Pickup" ? t("toPickup") : t("toDropoff")}
      </div>

      <div className="flex w-full items-center">
        <span className="flex shrink-0 items-center justify-center rounded-full"
          style={{ width: s.disc, height: s.disc, background: live ? accent : "transparent", boxShadow: `0 0 0 ${s.halo}px ${live ? g.halo : "transparent"}` }}>
          <PhVan size={s.van} weight="fill" style={{ color: live ? g.van : g.mute }} aria-hidden />
        </span>
        <span className="flex-1 rounded-sm" style={{ minWidth: s.railMin, height: s.rail, background: thread }} />
        <div className="shrink-0 text-center" style={{ padding: `0 ${s.pad}px` }}>
          <Flash value={v.minutes} tint={g.flash} radius={9} className="px-[7px] py-[3px]">
            <span className="flex items-baseline justify-center gap-1.5">
              <span className={`${MONO} whitespace-nowrap font-semibold leading-none tracking-[-0.01em]`}
                style={{ fontSize: arriving ? s.arriving : s.num, color: stale ? g.mute : g.ink }}>{bigText}</span>
              {unitShown && <span className={`${MONO} font-semibold tracking-[0.12em]`} style={{ fontSize: s.unit, color: stale ? g.mute : accent }}>{t("min")}</span>}
            </span>
          </Flash>
          <Flash value={v.miles} tint={g.flash} radius={7} className="mt-0.5 px-[7px] py-0.5">
            <span className={`${MONO} whitespace-nowrap font-medium tracking-[0.14em]`} style={{ fontSize: s.sub, color: g.mute }}>{milesText}</span>
          </Flash>
        </div>
        <span className="flex-1 rounded-sm" style={{ minWidth: s.railMin, height: s.rail, background: ahead, backgroundSize: `16px ${s.rail}px` }} />
        <span className="mr-0.5 size-0 shrink-0 border-y-[5px] border-l-[7px] border-y-transparent" style={{ borderLeftColor: thread }} />
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <Dial size={s.dial} ring={s.dialRing} arc={s.arc} text={s.dialText} cap={noData || size !== "lg" ? "" : t("arrival")} capSize={s.cap}
            v={v} g={g} arcDash={arcDash} accent={accent} live={live} etaText={etaText} ticks />
          {late && (
            <span className={`${MONO} inline-flex h-5 items-center gap-[5px] rounded-[5px] px-2 text-[10px] font-semibold tracking-[0.06em]`} style={{ background: g.lateBg, color: g.lateInk }}>
              <span className="size-1.5 rounded-[2px]" style={{ background: g.late }} />
              {size === "lg" && v.lateBy ? t("lateBy", { by: v.lateBy }) : t("lateShort")}
            </span>
          )}
        </div>
      </div>

      <div className={`${MONO} flex items-center gap-[7px] uppercase tracking-[0.08em]`} style={{ fontSize: s.foot, color: stale ? g.lateInk : g.mute }}>
        {stale && <PhWarningCircle size={s.footIcon} aria-hidden />}
        {noData && <PhCircleNotch size={s.footIcon} className="animate-spin" aria-hidden />}
        {noData ? t("waitingFirst") : stale ? t("lastPosition", { age: ageText(v.ageSeconds, t) }) : t("updated", { age: ageText(v.ageSeconds, t) })}
      </div>
    </div>
  );
}

function ageText(seconds: number | null, t: ReturnType<typeof useTranslations>) {
  if (seconds === null) return "—";
  return seconds < 120 ? t("seconds", { n: seconds }) : t("minutes", { n: Math.round(seconds / 60) });
}

function Dial({ size, ring, arc, text, cap, capSize = 8, v, g, arcDash, accent, live, etaText, ticks }: {
  size: number; ring: number; arc: number; text: number; cap: string; capSize?: number; v: LiveEtaValues;
  g: (typeof GROUND)["dark"]; arcDash: string; accent: string; live: boolean; etaText: string; ticks?: boolean;
}) {
  const late = v.state === "late";
  return (
    <Flash value={v.eta} tint={g.flash} radius={999} className="relative shrink-0">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r="46" fill="none" stroke={g.ring} strokeWidth={ring} />
          <circle cx="50" cy="50" r="46" fill="none" stroke={live ? accent : g.rail} strokeWidth={arc} strokeLinecap="round" strokeDasharray={arcDash} />
          {ticks && <circle cx="50" cy="50" r="38" fill="none" stroke={g.tick} strokeWidth="4" strokeDasharray="2.2 17.7" />}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className={`${MONO} font-semibold leading-none`} style={{ fontSize: text, color: late ? g.lateInk : v.state === "stale" ? g.mute : g.ink }}>{etaText}</span>
          {cap && <span className={`${MONO} uppercase tracking-[0.12em]`} style={{ fontSize: capSize, color: g.mute }}>{cap}</span>}
        </div>
      </div>
    </Flash>
  );
}
