"use client";

import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { useFeedback } from "@/components/Feedback";
import { useErrorText } from "@/i18n/useErrorText";
import { fetchApiKey, useOrganization, useOrganizationActions, type Organization, type OrganizationEdit } from "./adminApi";
import { FormModal, Panel, SmallButton, TextField } from "./ui";

/** The clinic's own record. Contact details are its own; name, state and funding source are the office's. */
export function OrganizationSection() {
  const t = useTranslations("admin");
  const org = useOrganization();
  const [editing, setEditing] = useState(false);
  const o = org.data;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel title={t("organizationTitle")} action={o && <SmallButton onClick={() => setEditing(true)}>{t("editContact")}</SmallButton>}>
        {org.isError && <p className="text-sm text-red-600">{t("loadFailed")}</p>}
        {o && (
          <dl className="space-y-2 text-sm">
            <Row label={t("name")} value={o.name} />
            <Row label={t("state")} value={o.isActive ? t("active") : t("disabled")} />
            <Row label={t("fundingSource")} value={o.fundingSourceName} />
            <Row label={t("phone")} value={o.phone} />
            <Row label={t("email")} value={o.email} />
            <Row label={t("website")} value={o.website} />
            <Row label={t("address")} value={o.address} />
            <Row label={t("contactName")} value={o.contactName} />
          </dl>
        )}
        <p className="mt-4 text-xs text-muted">{t("organizationOfficeFields")}</p>
      </Panel>

      <ApiKeyPanel />

      {editing && o && <OrganizationForm organization={o} onClose={() => setEditing(false)} />}
    </div>
  );
}

/**
 * The integrator's API key, for a clinic that wants to connect its own system. It is fetched only
 * when somebody presses "Show", and lives in this component's memory until the page changes.
 */
function ApiKeyPanel() {
  const t = useTranslations("admin");
  const feedback = useFeedback();
  const errorText = useErrorText();
  const [key, setKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function show() {
    try {
      setKey((await fetchApiKey()).apiKey);
    } catch (e) {
      await feedback.alert(errorText(e, t("actionFailed")));
    }
  }

  async function copy() {
    if (!key) return;
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      await feedback.alert(t("copyFailed"));
    }
  }

  return (
    <Panel title={t("apiKeyTitle")}>
      <p className="mb-3 text-sm text-muted">{t("apiKeyHelp")}</p>
      <div className="flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 basis-64 break-all rounded-lg border border-border bg-slate-50 px-3 py-2 font-mono text-xs">
          {key ?? "•".repeat(32)}
        </code>
        {key ? (
          <>
            <SmallButton onClick={() => void copy()}>{copied ? t("copied") : t("copy")}</SmallButton>
            <SmallButton onClick={() => setKey(null)}>{t("hide")}</SmallButton>
          </>
        ) : (
          <SmallButton onClick={() => void show()}>{t("show")}</SmallButton>
        )}
      </div>
      <p className="mt-3 text-xs text-muted">{t("apiKeyWarning")}</p>
    </Panel>
  );
}

function OrganizationForm({ organization, onClose }: { organization: Organization; onClose: () => void }) {
  const t = useTranslations("admin");
  const feedback = useFeedback();
  const errorText = useErrorText();
  const { edit } = useOrganizationActions();
  const [form, setForm] = useState<OrganizationEdit>({
    phone: organization.phone ?? "",
    email: organization.email ?? "",
    website: organization.website ?? "",
    address: organization.address ?? "",
    contactName: organization.contactName ?? "",
  });
  const set = (patch: Partial<OrganizationEdit>) => setForm((f) => ({ ...f, ...patch }));

  async function save() {
    try {
      await edit.mutateAsync(form);
      onClose();
    } catch (e) {
      await feedback.alert(errorText(e, t("actionFailed")));
    }
  }

  return (
    <FormModal title={t("editContact")} onClose={onClose} onSubmit={save} saving={edit.isPending}>
      <p className="mb-4 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">{t("organizationEditWarning")}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label={t("phone")} value={form.phone} onChange={(v) => set({ phone: v })} type="tel" />
        <TextField label={t("email")} value={form.email} onChange={(v) => set({ email: v })} type="email" />
        <TextField label={t("website")} value={form.website} onChange={(v) => set({ website: v })} />
        <TextField label={t("contactName")} value={form.contactName} onChange={(v) => set({ contactName: v })} />
        <TextField label={t("address")} value={form.address} onChange={(v) => set({ address: v })} span />
      </div>
    </FormModal>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-2">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-words">{value || "—"}</dd>
    </div>
  );
}
