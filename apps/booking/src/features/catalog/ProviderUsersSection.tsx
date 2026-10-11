"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { useFeedback } from "@/components/Feedback";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Form";
import { IconPlus } from "@/components/ui/Icon";
import { Badge, Notice } from "@/components/ui/Surface";
import { PASSWORD_MIN_LENGTH } from "@/features/account/passwordRules";
import { useErrorText } from "@/i18n/useErrorText";
import { useProviderUserActions, useProviderUsers, type ProviderUserCreate } from "./catalogApi";

const EMPTY: ProviderUserCreate = { fullName: "", username: "", password: "", email: "", phoneNumber: "" };

/**
 * The users of a contracted Provider that works outside Raphael, managed by the clinic's admin
 * (PROVIDER_ACCESS_MODEL.md §3.4). Always role User. Each one sees the trips every clinic gives this
 * Provider, so it is born unable to do anything but change the password the clinic typed.
 */
export function ProviderUsersSection({ id }: { id: number }) {
  const t = useTranslations("catalog");
  const tc = useTranslations("common");
  const feedback = useFeedback();
  const errorText = useErrorText();
  const users = useProviderUsers(id, true);
  const { create, setActive } = useProviderUserActions(id);
  const [form, setForm] = useState<ProviderUserCreate | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!form) return;
    try {
      await create.mutateAsync(form);
      setForm(null);
      await feedback.alert(t("userCreated", { username: form.username ?? "" }));
    } catch (e) {
      await feedback.alert(errorText(e, t("actionFailed")));
    }
  }

  async function toggle(userId: number, name: string, isActive: boolean) {
    if (!isActive && !(await feedback.confirm(t("userConfirmOff", { name })))) return;
    try {
      await setActive.mutateAsync({ userId, isActive });
    } catch (e) {
      await feedback.alert(errorText(e, t("actionFailed")));
    }
  }

  const set = (key: keyof ProviderUserCreate) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => (f ? { ...f, [key]: e.target.value } : f));

  return (
    <div className="md:col-span-2">
      <div className="mb-3 flex items-center gap-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted">{t("users")}</h3>
        {!form && <Button size="sm" variant="secondary" icon={IconPlus} className="ml-auto" onClick={() => setForm(EMPTY)}>{t("userNew")}</Button>}
      </div>

      {users.isError && <Notice tone="danger">{t("loadFailed")}</Notice>}
      {users.data && users.data.length === 0 && !form && <p className="text-sm text-muted">{t("usersNone")}</p>}

      {users.data && users.data.length > 0 && (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {users.data.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{u.fullName}</div>
                <div className="truncate text-sm text-muted">{u.username}{u.email ? ` · ${u.email}` : ""}</div>
              </div>
              {u.mustChangePassword && u.isActive && <Badge tone="warning">{t("userPending")}</Badge>}
              <Badge tone={u.isActive ? "success" : "neutral"}>{u.isActive ? t("userActive") : t("userInactive")}</Badge>
              <Button size="sm" variant={u.isActive ? "danger-outline" : "secondary"} loading={setActive.isPending && setActive.variables?.userId === u.id}
                onClick={() => void toggle(u.id ?? 0, u.fullName ?? "", !u.isActive)}>
                {u.isActive ? t("userTurnOff") : t("userTurnOn")}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {form && (
        <form onSubmit={(e) => void submit(e)} className="mt-3 space-y-4 rounded-lg border border-border p-4">
          <Notice>{t("userNewNotice")}</Notice>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("userFullName")} htmlFor="pu-name" required className="sm:col-span-2">
              <Input id="pu-name" required value={form.fullName ?? ""} onChange={set("fullName")} />
            </Field>
            <Field label={t("userUsername")} htmlFor="pu-username" required>
              <Input id="pu-username" required autoComplete="off" value={form.username ?? ""} onChange={set("username")} />
            </Field>
            <Field label={t("userPassword")} htmlFor="pu-password" required hint={t("userPasswordHint", { min: PASSWORD_MIN_LENGTH })}>
              <Input id="pu-password" type="text" required autoComplete="new-password" minLength={PASSWORD_MIN_LENGTH} value={form.password ?? ""} onChange={set("password")} />
            </Field>
            <Field label={t("email")} htmlFor="pu-email">
              <Input id="pu-email" type="email" value={form.email ?? ""} onChange={set("email")} />
            </Field>
            <Field label={t("phone")} htmlFor="pu-phone">
              <Input id="pu-phone" type="tel" value={form.phoneNumber ?? ""} onChange={set("phoneNumber")} />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setForm(null)}>{tc("cancel")}</Button>
            <Button type="submit" loading={create.isPending}>{t("userCreate")}</Button>
          </div>
        </form>
      )}
    </div>
  );
}
