"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Form";
import { IconBell, IconCatalog, IconHide, IconKey, IconLogin, IconShow, IconTrips, IconUser } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Surface";
import { useErrorText } from "@/i18n/useErrorText";
import { bff } from "@/lib/bff";

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

  return (
    <main className="grid min-h-dvh flex-1 lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel: large screens only */}
      <section className="relative hidden overflow-hidden bg-navy p-12 text-white lg:flex lg:flex-col">
        <div aria-hidden="true" className="absolute -right-32 -top-32 size-[28rem] rounded-full bg-brand-2/15 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-40 -left-24 size-[30rem] rounded-full bg-brand-500/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-white"><Image src="/brand/raphael-mark.png" alt="" width={34} height={34} priority unoptimized /></span>
          <span className="text-2xl font-bold">Raphael</span>
        </div>
        <div className="relative mt-auto max-w-md">
          <h2 className="text-4xl font-bold leading-tight">{t("login.heroTitle")}</h2>
          <p className="mt-4 text-lg text-white/70">{t("login.heroText")}</p>
          <ul className="mt-8 space-y-3 text-white/85">
            <Feature icon={IconTrips} text={t("login.featureTrips")} />
            <Feature icon={IconBell} text={t("login.featureLive")} />
            <Feature icon={IconCatalog} text={t("login.featureCatalog")} />
          </ul>
        </div>
        <p className="relative mt-12 text-sm text-white/40">© Raphael · NEMT</p>
      </section>

      {/* Sign-in */}
      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <form onSubmit={onSubmit} className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex size-11 items-center justify-center rounded-2xl border border-border bg-surface shadow-card">
              <Image src="/brand/raphael-mark.png" alt="" width={30} height={30} priority unoptimized />
            </span>
            <span className="text-xl font-bold">Raphael</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t("common.appName")}</h1>
          <p className="mt-1.5 text-[0.95rem] text-muted">{t("login.subtitle")}</p>

          <div className="mt-8 space-y-4">
            <Field label={t("login.user")} htmlFor="username">
              <Input id="username" name="username" icon={IconUser} autoComplete="username" required autoFocus />
            </Field>
            <Field label={t("login.password")} htmlFor="password">
              <div className="relative">
                <Input id="password" name="password" icon={IconKey} type={show ? "text" : "password"} autoComplete="current-password" required className="pr-11" />
                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? t("login.hidePassword") : t("login.showPassword")}
                  className="absolute inset-y-0 right-1 flex w-9 items-center justify-center text-muted hover:text-foreground">
                  {show ? <IconHide size={17} aria-hidden /> : <IconShow size={17} aria-hidden />}
                </button>
              </div>
            </Field>
          </div>

          {error && <Notice tone="danger" className="mt-5"><span role="alert" className="whitespace-pre-line">{error}</span></Notice>}

          <Button type="submit" size="lg" icon={IconLogin} loading={busy} className="mt-7 w-full">
            {busy ? t("login.submitting") : t("login.submit")}
          </Button>
        </form>
      </section>
    </main>
  );
}

function Feature({ icon: Icon, text }: { icon: typeof IconTrips; text: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex size-9 items-center justify-center rounded-xl bg-white/10"><Icon size={17} aria-hidden /></span>
      {text}
    </li>
  );
}
