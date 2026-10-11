"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Surface";
import { bff } from "@/lib/bff";
import { ChangePasswordModal } from "./ChangePasswordModal";

/**
 * The only screen of an account whose password was set by somebody else (a clinic creating an
 * external Provider's user). The backend refuses everything else until it changes; once changed,
 * every session of the account ends, so its owner signs in again with the new password.
 */
export function ForcePasswordChange() {
  const t = useTranslations("account");
  const [done, setDone] = useState(false);
  const router = useRouter();

  async function leave() {
    await bff("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.push("/login");
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--ds-background)] p-6">
        <div className="w-full max-w-[420px] space-y-4 rounded-xl border border-[var(--ds-outline-variant)] bg-[var(--ds-surface)] p-6">
          <Notice tone="success"><span role="status">{t("forcedDone")}</span></Notice>
          <Button className="w-full" onClick={() => router.push("/login")}>{t("forcedSignIn")}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--ds-background)]">
      <ChangePasswordModal intro={t("forcedIntro")} onClose={() => void leave()} onChanged={() => setDone(true)} />
    </div>
  );
}
