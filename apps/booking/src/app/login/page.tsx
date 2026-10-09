"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, type ComponentType, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";
import {
  PhBellRinging, PhBuildings, PhCalendarPlus, PhCircleNotch, PhClockCountdown, PhEye, PhEyeSlash,
  PhKey, PhPath, PhSignIn, PhUserCircle, PhWarningCircle,
} from "@/components/ui/Icon";
import { LanguageSwitch } from "@/features/preferences/LanguageSwitch";
import { ThemeToggle } from "@/features/preferences/ThemeToggle";
import { useErrorText } from "@/i18n/useErrorText";
import { bff } from "@/lib/bff";

type PhIcon = ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;

/**
 * The login, the first screen rebuilt on the final design (design/proposals/claude-design/2026-10-09-r2/Login).
 * PC: a dark brand panel with the pin over its halo, and the form on the right with theme and language.
 * Phone: the brand shrinks to a header, and the two live features go to the foot.
 * The brand panel is dark in both themes; only the form side follows the theme.
 */
export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations();
  const errorText = useErrorText();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await bff("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
      });
      router.replace("/");
    } catch (e) {
      setError(errorText(e, t("login.failed")));
      setBusy(false);
    }
  }

  const features: { icon: PhIcon; text: string }[] = [
    { icon: PhCalendarPlus, text: t("login.featureTrips") },
    { icon: PhBellRinging, text: t("login.featureLive") },
    { icon: PhBuildings, text: t("login.featureCatalog") },
    { icon: PhClockCountdown, text: t("login.featureEta") },
    { icon: PhPath, text: t("login.featureRoute") },
  ];

  return (
    <main className="flex min-h-dvh flex-1 flex-col bg-[var(--ds-background)] font-[family-name:var(--font-plex-sans)] text-[var(--ds-on-surface)] [color-scheme:var(--ds-color-scheme)] lg:grid lg:grid-cols-[56fr_44fr]">
      {/* Brand panel: PC */}
      <section className="relative hidden flex-col overflow-hidden bg-[image:var(--ds-brand-gradient)] px-16 pb-[34px] pt-12 lg:flex">
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-10 h-[460px] w-[620px] -translate-x-1/2 bg-[image:var(--ds-brand-halo)]" />
        <div className="relative flex flex-col items-center gap-4 pt-[26px]">
          <Image src="/brand/raphael-pin.png" alt="" width={124} height={157} priority />
          <span className="pl-[.34em] text-[30px] font-semibold tracking-[.34em] text-[var(--ds-on-brand)]">RAPHAEL</span>
        </div>
        <div className="relative mt-auto flex flex-col items-center gap-[18px] pt-10 text-center">
          <p className="max-w-[540px] text-[38px] font-semibold leading-[1.18] tracking-[-0.02em] text-[var(--ds-on-brand)]">{t("login.heroTitle")}</p>
          <p className="max-w-[520px] text-base leading-[1.55] text-[var(--ds-on-brand-variant)]">{t("login.heroText")}</p>
          <ul className="mt-1.5 flex w-fit flex-col gap-3 text-left">
            {features.map((f) => (
              <li key={f.text} className="flex items-center gap-3.5">
                <span className="flex size-10 flex-none items-center justify-center rounded-[10px] bg-[var(--ds-brand-tile)] shadow-[inset_0_0_0_1px_var(--ds-brand-tile-ring)]">
                  <f.icon size={20} aria-hidden className="text-[var(--ds-brand-icon)]" />
                </span>
                <span className="text-[15px] text-[var(--ds-on-brand)]">{f.text}</span>
              </li>
            ))}
          </ul>
          <p className="mt-[22px] font-[family-name:var(--font-plex-mono)] text-xs text-[var(--ds-on-brand-faint)]">© Raphael · NEMT</p>
        </div>
      </section>

      {/* Brand header: phone and tablet */}
      <header className="relative flex-none overflow-hidden bg-[image:var(--ds-brand-gradient)] px-4 pb-[26px] pt-3 lg:hidden">
        <div aria-hidden="true" className="pointer-events-none absolute -top-[30px] left-1/2 h-[320px] w-[420px] -translate-x-1/2 bg-[image:var(--ds-brand-halo)]" />
        <div className="relative flex justify-end gap-[9px]">
          <ThemeToggle onBrand />
          <LanguageSwitch onBrand />
        </div>
        <div className="relative flex flex-col items-center gap-3 pt-3.5">
          <Image src="/brand/raphael-pin.png" alt="" width={76} height={96} priority />
          <span className="pl-[.3em] text-[21px] font-semibold tracking-[.3em] text-[var(--ds-on-brand)]">RAPHAEL</span>
          <p className="max-w-[290px] text-center text-sm leading-[1.45] text-[var(--ds-on-brand-variant)]">{t("login.heroTitle")}</p>
        </div>
      </header>

      {/* Sign-in */}
      <section className="flex flex-1 flex-col px-5 py-[22px] lg:px-6 lg:pb-6 lg:pt-5">
        <div className="hidden justify-end gap-2.5 lg:flex">
          <ThemeToggle />
          <LanguageSwitch />
        </div>

        <div className="flex flex-1 flex-col lg:items-center lg:justify-center">
          <form onSubmit={onSubmit} className="w-full lg:w-[392px]">
            <h1 className="text-center text-[21px] font-semibold tracking-[-0.02em] lg:text-[26px]">{t("common.appName")}</h1>
            <p className="mt-[7px] text-center text-[13.5px] text-[var(--ds-on-surface-variant)] lg:mt-2 lg:text-sm">{t("login.subtitle")}</p>

            <div className="mt-[22px] flex flex-col gap-3.5 lg:mt-7 lg:gap-4">
              <Field id="username" label={t("login.user")}>
                <LoginInput id="username" name="username" icon={PhUserCircle} autoComplete="username" required autoFocus />
              </Field>
              <Field id="password" label={t("login.password")}>
                <LoginInput id="password" name="password" icon={PhKey} type={show ? "text" : "password"} autoComplete="current-password" required
                  invalid={error !== null}
                  trailing={
                    <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? t("login.hidePassword") : t("login.showPassword")}
                      className="flex h-full w-9 items-center justify-center text-[var(--ds-on-surface-variant)] hover:text-[var(--ds-on-surface)]">
                      {show ? <PhEyeSlash size={19} aria-hidden /> : <PhEye size={19} aria-hidden />}
                    </button>
                  } />
              </Field>

              <button type="submit" disabled={busy}
                className="flex h-[52px] w-full items-center justify-center gap-[9px] rounded-lg bg-[var(--ds-primary)] text-[15px] font-bold tracking-[.08em] text-[var(--ds-on-primary)] disabled:cursor-progress disabled:opacity-90 lg:h-12 lg:text-sm">
                {busy
                  ? <><PhCircleNotch size={19} aria-hidden className="animate-spin" />{t("login.submitting")}</>
                  : <><PhSignIn size={19} aria-hidden />{t("login.submit")}</>}
              </button>

              {busy && <p className="text-center text-[12.5px] text-[var(--ds-on-surface-variant)]" role="status">{t("login.checking")}</p>}

              {error && (
                <div role="alert" className="flex items-center gap-[9px] rounded-lg bg-[var(--ds-error-container)] px-[13px] py-[11px] shadow-[inset_0_0_0_1px_var(--ds-error-ring)]">
                  <PhWarningCircle size={19} weight="fill" aria-hidden className="flex-none text-[var(--ds-error)]" />
                  <span className="whitespace-pre-line text-[13.5px]">{error}</span>
                </div>
              )}
            </div>
          </form>

          {/* The two live features, at the foot on a phone */}
          <div className="mt-auto flex flex-col gap-2.5 pt-8 lg:hidden">
            {features.slice(3).map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <span className="flex size-[34px] flex-none items-center justify-center rounded-[9px] bg-[var(--ds-primary-container)]">
                  <f.icon size={18} aria-hidden className="text-[var(--ds-primary)]" />
                </span>
                <span className="text-[13.5px]">{f.text}</span>
              </div>
            ))}
            <p className="mt-2 text-center font-[family-name:var(--font-plex-mono)] text-[11.5px] text-[var(--ds-on-surface-variant)]">© Raphael · NEMT</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-[7px] block text-[13px] font-semibold">{label}</label>
      {children}
    </div>
  );
}

function LoginInput({ icon: Icon, invalid = false, trailing, className = "", ...props }: InputHTMLAttributes<HTMLInputElement> & {
  icon: PhIcon;
  invalid?: boolean;
  trailing?: ReactNode;
}) {
  return (
    <div className={`flex h-12 items-center gap-2.5 rounded-lg bg-[var(--ds-surface)] pl-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--ds-primary)] focus-within:outline-solid lg:h-11 ${trailing ? "pr-1" : "pr-3"} ${
      invalid ? "border-[1.5px] border-[var(--ds-error)]" : "border border-[var(--ds-outline)]"}`}>
      <Icon size={19} aria-hidden className="flex-none text-[var(--ds-on-surface-variant)]" />
      <input {...props} aria-invalid={invalid || undefined}
        className={`h-full min-w-0 flex-1 bg-transparent text-[15px] text-[var(--ds-on-surface)] outline-none focus-visible:outline-none lg:text-sm ${className}`} />
      {trailing}
    </div>
  );
}
