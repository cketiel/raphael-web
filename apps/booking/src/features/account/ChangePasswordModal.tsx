"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { useErrorText } from "@/i18n/useErrorText";
import { bff } from "@/lib/bff";
import { PASSWORD_MIN_LENGTH, passwordProblem } from "./passwordRules";

/** Changes the signed-in user's own password. The session stays open afterwards. */
export function ChangePasswordModal({ onClose, onChanged }: { onClose: () => void; onChanged: () => void }) {
  const t = useTranslations("account");
  const tErrors = useTranslations("errors");
  const tc = useTranslations("common");
  const errorText = useErrorText();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = passwordProblem(current, next, confirm);
    if (problem) {
      setError(tErrors(problem, { min: PASSWORD_MIN_LENGTH }));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await bff("/api/account/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: current, newPassword: next, confirmPassword: confirm }),
      });
      onChanged();
    } catch (e) {
      setError(errorText(e, t("failed")));
      setBusy(false);
    }
  }

  const input = "mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand";
  const type = show ? "text" : "password";

  return (
    <div className="fixed inset-0 z-[1100] flex items-stretch justify-center bg-slate-900/50 sm:items-start sm:p-4" role="presentation">
      <form onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="password-title"
        className="flex w-full flex-col bg-surface text-foreground shadow-2xl sm:mt-16 sm:max-w-md sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border bg-slate-50 px-5 py-4 sm:rounded-t-2xl">
          <h2 id="password-title" className="text-lg font-bold text-brand">{t("changePassword")}</h2>
          <button type="button" onClick={onClose} aria-label={tc("close")} className="text-2xl leading-none text-muted hover:text-foreground">×</button>
        </div>

        <div className="space-y-3 p-5">
          <label className="block text-sm font-medium">{t("currentPassword")}
            <input type={type} autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} className={input} />
          </label>
          <label className="block text-sm font-medium">{t("newPassword")}
            <input type={type} autoComplete="new-password" required minLength={PASSWORD_MIN_LENGTH} value={next} onChange={(e) => setNext(e.target.value)} className={input} />
          </label>
          <p className="text-xs text-muted">{t("rules", { min: PASSWORD_MIN_LENGTH })}</p>
          <label className="block text-sm font-medium">{t("confirmPassword")}
            <input type={type} autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
            {t("showPasswords")}
          </label>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-auto flex justify-end gap-2 border-t border-border bg-slate-50 px-5 py-4 sm:rounded-b-2xl">
          <button type="button" onClick={onClose} className="rounded-lg bg-slate-500 px-4 py-2 text-sm font-bold text-white">{tc("cancel")}</button>
          <button type="submit" disabled={busy} className="rounded-lg bg-brand px-6 py-2 text-sm font-bold text-white disabled:opacity-50">
            {busy ? t("saving") : t("save")}
          </button>
        </div>
      </form>
    </div>
  );
}
