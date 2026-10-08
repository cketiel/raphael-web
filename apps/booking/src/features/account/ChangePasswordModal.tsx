"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Check, Field, Input } from "@/components/ui/Form";
import { IconKey } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { Notice } from "@/components/ui/Surface";
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

  const type = show ? "text" : "password";

  return (
    <Modal title={t("changePassword")} icon={IconKey} size="sm" onClose={onClose} onSubmit={submit} labelledBy="password-title"
      footer={<>
        <Button variant="secondary" onClick={onClose}>{tc("cancel")}</Button>
        <Button type="submit" loading={busy}>{t("save")}</Button>
      </>}>
      <div className="space-y-4">
        <Field label={t("currentPassword")} htmlFor="pw-current">
          <Input id="pw-current" type={type} autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
        </Field>
        <Field label={t("newPassword")} htmlFor="pw-new" hint={t("rules", { min: PASSWORD_MIN_LENGTH })}>
          <Input id="pw-new" type={type} autoComplete="new-password" required minLength={PASSWORD_MIN_LENGTH} value={next} onChange={(e) => setNext(e.target.value)} />
        </Field>
        <Field label={t("confirmPassword")} htmlFor="pw-confirm">
          <Input id="pw-confirm" type={type} autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        <Check label={t("showPasswords")} checked={show} onChange={(e) => setShow(e.target.checked)} />
        {error && <Notice tone="danger"><span role="alert">{error}</span></Notice>}
      </div>
    </Modal>
  );
}
