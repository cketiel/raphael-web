"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useFeedback } from "@/components/Feedback";
import { useErrorText } from "@/i18n/useErrorText";
import { PASSWORD_MIN_LENGTH } from "@/features/account/passwordRules";
import { useRoles, useUserActions, useUsers, type AdminUser, type AdminUserCreate } from "./adminApi";
import { FormModal, Panel, PrimaryButton, SelectField, SmallButton, TextField } from "./ui";

/** A password the admin sets for someone else: the same rules as one's own (passwordRules.ts). */
function passwordProblem(password: string, confirm: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return "passwordTooShort";
  if (!/\p{L}/u.test(password) || !/\p{Nd}/u.test(password)) return "passwordLettersDigits";
  if (password !== confirm) return "passwordMismatch";
  return null;
}

type Dialog = { kind: "create" } | { kind: "edit"; user: AdminUser } | { kind: "password"; user: AdminUser } | null;

/** The clinic's users: Admin and Booking only. Disabled, never deleted (BOOKING_ADMIN.md §2). */
export function UsersSection() {
  const t = useTranslations("admin");
  const feedback = useFeedback();
  const errorText = useErrorText();
  const users = useUsers();
  const { setActive } = useUserActions();
  const [dialog, setDialog] = useState<Dialog>(null);

  async function toggleActive(user: AdminUser) {
    const disabling = user.isActive;
    if (disabling && !(await feedback.confirm(t("confirmDisable", { name: user.fullName ?? "" })))) return;
    try {
      await setActive.mutateAsync({ id: user.id ?? 0, isActive: !disabling });
    } catch (e) {
      await feedback.alert(errorText(e, t("actionFailed")));
    }
  }

  const actions = (u: AdminUser) => (
    <div className="flex flex-wrap justify-end gap-1.5">
      <SmallButton onClick={() => setDialog({ kind: "edit", user: u })}>{t("edit")}</SmallButton>
      {!u.isCurrentUser && (
        <>
          <SmallButton onClick={() => setDialog({ kind: "password", user: u })}>{t("setPassword")}</SmallButton>
          <SmallButton tone={u.isActive ? "danger" : "success"} onClick={() => void toggleActive(u)} disabled={setActive.isPending}>
            {u.isActive ? t("disable") : t("enable")}
          </SmallButton>
        </>
      )}
    </div>
  );

  const list = users.data ?? [];

  return (
    <Panel title={t("usersTitle")} action={<PrimaryButton onClick={() => setDialog({ kind: "create" })}>{t("newUser")}</PrimaryButton>}>
      {users.isError && <p className="text-sm text-red-600">{t("loadFailed")}</p>}
      {users.isLoading && <p className="text-sm text-muted">{t("loading")}</p>}

      {/* Phones and tablets: cards. */}
      <ul className="grid gap-3 md:grid-cols-2 lg:hidden">
        {list.map((u) => (
          <li key={u.id} className={`rounded-xl border border-border p-4 ${u.isActive ? "" : "bg-slate-50"}`}>
            <div className="flex flex-wrap items-center gap-2">
              <p className="mr-auto font-bold">{u.fullName}</p>
              <RoleBadge user={u} />
              <StateBadge active={Boolean(u.isActive)} />
            </div>
            <p className="mt-1 text-sm text-muted">@{u.username}{u.isCurrentUser ? ` · ${t("you")}` : ""}</p>
            {u.email && <p className="text-sm break-all">{u.email}</p>}
            {u.phoneNumber && <p className="text-sm">{u.phoneNumber}</p>}
            <div className="mt-3">{actions(u)}</div>
          </li>
        ))}
      </ul>

      {/* Wide screens: the table. */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold">
            <tr>
              <th className="px-3 py-3">{t("fullName")}</th>
              <th className="px-3">{t("username")}</th>
              <th className="px-3">{t("email")}</th>
              <th className="px-3">{t("phone")}</th>
              <th className="px-3">{t("role")}</th>
              <th className="px-3">{t("state")}</th>
              <th className="px-3 text-right">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id} className={`border-t border-border ${u.isActive ? "" : "bg-slate-50 text-muted"}`}>
                <td className="px-3 py-3 font-semibold">{u.fullName}{u.isCurrentUser && <span className="ml-2 text-xs font-normal text-muted">({t("you")})</span>}</td>
                <td className="px-3">{u.username}</td>
                <td className="px-3 break-all">{u.email}</td>
                <td className="px-3">{u.phoneNumber}</td>
                <td className="px-3"><RoleBadge user={u} /></td>
                <td className="px-3"><StateBadge active={Boolean(u.isActive)} /></td>
                <td className="px-3 py-2">{actions(u)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dialog?.kind === "create" && <UserForm onClose={() => setDialog(null)} />}
      {dialog?.kind === "edit" && <UserForm user={dialog.user} onClose={() => setDialog(null)} />}
      {dialog?.kind === "password" && <PasswordForm user={dialog.user} onClose={() => setDialog(null)} />}
    </Panel>
  );
}

function RoleBadge({ user }: { user: AdminUser }) {
  const admin = user.roleId === 1;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ${admin ? "bg-violet-100 text-violet-800" : "bg-sky-100 text-sky-800"}`}>
      {user.roleName}
    </span>
  );
}

function StateBadge({ active }: { active: boolean }) {
  const t = useTranslations("admin");
  return (
    <span className={`rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ${active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>
      {active ? t("active") : t("disabled")}
    </span>
  );
}

function UserForm({ user, onClose }: { user?: AdminUser; onClose: () => void }) {
  const t = useTranslations("admin");
  const feedback = useFeedback();
  const errorText = useErrorText();
  const roles = useRoles();
  const { create, edit } = useUserActions();
  const [form, setForm] = useState<AdminUserCreate>({
    fullName: user?.fullName ?? "",
    username: user?.username ?? "",
    password: "",
    email: user?.email ?? "",
    phoneNumber: user?.phoneNumber ?? "",
    roleId: user?.roleId ?? 6,
  });
  const [confirm, setConfirm] = useState("");
  const set = (patch: Partial<AdminUserCreate>) => setForm((f) => ({ ...f, ...patch }));

  async function save() {
    if (!user) {
      const problem = passwordProblem(form.password ?? "", confirm);
      if (problem) return feedback.alert(t(problem, { min: PASSWORD_MIN_LENGTH }));
    }
    try {
      if (user) {
        await edit.mutateAsync({ id: user.id ?? 0, body: { fullName: form.fullName, username: form.username, email: form.email, phoneNumber: form.phoneNumber, roleId: form.roleId } });
      } else {
        await create.mutateAsync(form);
      }
      onClose();
    } catch (e) {
      await feedback.alert(errorText(e, t("actionFailed")));
    }
  }

  return (
    <FormModal title={user ? t("editUser") : t("newUser")} onClose={onClose} onSubmit={save} saving={create.isPending || edit.isPending}>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label={t("fullName")} value={form.fullName} onChange={(v) => set({ fullName: v })} required span />
        <TextField label={t("username")} value={form.username} onChange={(v) => set({ username: v })} required autoComplete="off" />
        <SelectField label={t("role")} value={form.roleId} onChange={(v) => set({ roleId: Number(v) })} required
          disabled={user?.isCurrentUser && user.roleId === 1}>
          {(roles.data ?? []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </SelectField>
        <TextField label={t("email")} value={form.email} onChange={(v) => set({ email: v })} type="email" />
        <TextField label={t("phone")} value={form.phoneNumber} onChange={(v) => set({ phoneNumber: v })} type="tel" />
        {!user && (
          <>
            <TextField label={t("password")} value={form.password} onChange={(v) => set({ password: v })} type="password" required autoComplete="new-password" />
            <TextField label={t("confirmPassword")} value={confirm} onChange={setConfirm} type="password" required autoComplete="new-password" />
            <p className="text-xs text-muted sm:col-span-2">{t("passwordHint", { min: PASSWORD_MIN_LENGTH })}</p>
          </>
        )}
      </div>
    </FormModal>
  );
}

function PasswordForm({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const t = useTranslations("admin");
  const feedback = useFeedback();
  const errorText = useErrorText();
  const { setPassword } = useUserActions();
  const [password, setPasswordValue] = useState("");
  const [confirm, setConfirm] = useState("");

  async function save() {
    const problem = passwordProblem(password, confirm);
    if (problem) return feedback.alert(t(problem, { min: PASSWORD_MIN_LENGTH }));
    try {
      await setPassword.mutateAsync({ id: user.id ?? 0, newPassword: password });
      onClose();
      await feedback.alert(t("passwordSet", { name: user.fullName ?? "" }));
    } catch (e) {
      await feedback.alert(errorText(e, t("actionFailed")));
    }
  }

  return (
    <FormModal title={t("setPasswordFor", { name: user.fullName ?? "" })} onClose={onClose} onSubmit={save} saving={setPassword.isPending}>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label={t("newPassword")} value={password} onChange={setPasswordValue} type="password" required autoComplete="new-password" />
        <TextField label={t("confirmPassword")} value={confirm} onChange={setConfirm} type="password" required autoComplete="new-password" />
        <p className="text-xs text-muted sm:col-span-2">{t("passwordHint", { min: PASSWORD_MIN_LENGTH })} {t("passwordEndsSessions")}</p>
      </div>
    </FormModal>
  );
}
