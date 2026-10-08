"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { useFeedback } from "@/components/Feedback";
import { useErrorText } from "@/i18n/useErrorText";
import { localToday } from "@/features/booking/rules";
import { useSpaceTypes } from "@/features/booking/catalogs";
import {
  useBillingItemActions,
  useBillingItems,
  useFundingSource,
  useFundingSourceActions,
  useRateActions,
  useRates,
  useUnits,
  type BillingItem,
  type BillingItemEdit,
  type FundingSource,
  type FundingSourceEdit,
  type Rate,
  type RateEdit,
} from "./adminApi";
import { IconBilling, IconBuilding, IconCancelled, IconDelete, IconEdit, IconList } from "@/components/ui/Icon";
import { CheckField, FormModal, Notice, Panel, PrimaryButton, SelectField, SmallButton, TextField, toDateInput } from "./ui";

/**
 * What the clinic is billed with: its funding source, the billing items it defines, and the rates
 * on them. The office's rates on its funding source are shown too, read only (BOOKING_ADMIN.md §4).
 */
export function BillingSection() {
  const fundingSource = useFundingSource();
  const fs = fundingSource.data;
  // Without a funding source there is nothing to rate: the items still can be prepared.
  return (
    <div className="space-y-4">
      <FundingSourcePanel fs={fs} loading={fundingSource.isLoading} failed={fundingSource.isError} />
      <BillingItemsPanel />
      {fs && <RatesPanel canEdit={Boolean(fs.canEdit)} />}
    </div>
  );
}

// ------------------------------------------------------------------ funding source

const FLAGS = ["signaturePickup", "signatureDropoff", "driverSignaturePickup", "driverSignatureDropoff", "requireOdometer", "barcodeScanRequired"] as const;

function FundingSourcePanel({ fs, loading, failed }: { fs: FundingSource | null | undefined; loading: boolean; failed: boolean }) {
  const t = useTranslations("admin");
  const [editing, setEditing] = useState(false);

  const action = fs === null
    ? <PrimaryButton onClick={() => setEditing(true)}>{t("createFundingSource")}</PrimaryButton>
    : fs?.canEdit && <SmallButton icon={IconEdit} onClick={() => setEditing(true)}>{t("edit")}</SmallButton>;

  return (
    <Panel title={t("fundingSourceTitle")} icon={IconBuilding} action={action}>
      {failed && <p className="text-sm text-red-600">{t("loadFailed")}</p>}
      {loading && <p className="text-sm text-muted">{t("loading")}</p>}
      {fs === null && <Notice tone="warning">{t("noFundingSource")}</Notice>}
      {fs?.isShared && <Notice tone="warning">{t("fundingSourceShared")}</Notice>}
      {fs && (
        <div className="grid gap-6 md:grid-cols-2">
          <dl className="space-y-2 text-sm">
            <Row label={t("name")} value={fs.name} />
            <Row label={t("accountNumber")} value={fs.accountNumber} />
            <Row label={t("address")} value={fs.address} />
            <Row label={t("phone")} value={fs.phone} />
            <Row label={t("fax")} value={fs.fax} />
            <Row label={t("email")} value={fs.email} />
            <Row label={t("contactName")} value={[fs.contactFirst, fs.contactLast].filter(Boolean).join(" ")} />
          </dl>
          <div>
            <h3 className="mb-2 text-sm font-bold">{t("tripRequirements")}</h3>
            <ul className="space-y-1.5 text-sm">
              {FLAGS.map((flag) => (
                <li key={flag} className="flex items-center gap-2">
                  <span aria-hidden="true" className={fs[flag] ? "text-[#198754]" : "text-slate-400"}>{fs[flag] ? "✔" : "—"}</span>
                  {t(`flags.${flag}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {editing && <FundingSourceForm fs={fs ?? null} onClose={() => setEditing(false)} />}
    </Panel>
  );
}

function FundingSourceForm({ fs, onClose }: { fs: FundingSource | null; onClose: () => void }) {
  const t = useTranslations("admin");
  const feedback = useFeedback();
  const errorText = useErrorText();
  const { create, edit } = useFundingSourceActions();
  const [form, setForm] = useState<FundingSourceEdit>({
    name: fs?.name ?? "",
    accountNumber: fs?.accountNumber ?? "",
    address: fs?.address ?? "",
    phone: fs?.phone ?? "",
    fax: fs?.fax ?? "",
    email: fs?.email ?? "",
    contactFirst: fs?.contactFirst ?? "",
    contactLast: fs?.contactLast ?? "",
    signaturePickup: fs?.signaturePickup ?? false,
    signatureDropoff: fs?.signatureDropoff ?? false,
    driverSignaturePickup: fs?.driverSignaturePickup ?? false,
    driverSignatureDropoff: fs?.driverSignatureDropoff ?? false,
    requireOdometer: fs?.requireOdometer ?? false,
    barcodeScanRequired: fs?.barcodeScanRequired ?? false,
  });
  const set = (patch: Partial<FundingSourceEdit>) => setForm((f) => ({ ...f, ...patch }));

  async function save() {
    try {
      if (fs) await edit.mutateAsync(form);
      else await create.mutateAsync(form);
      onClose();
    } catch (e) {
      await feedback.alert(errorText(e, t("actionFailed")));
    }
  }

  return (
    <FormModal title={fs ? t("editFundingSource") : t("createFundingSource")} onClose={onClose} onSubmit={save} saving={create.isPending || edit.isPending}>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label={t("name")} value={form.name} onChange={(v) => set({ name: v })} required span />
        <TextField label={t("accountNumber")} value={form.accountNumber} onChange={(v) => set({ accountNumber: v })} />
        <TextField label={t("phone")} value={form.phone} onChange={(v) => set({ phone: v })} type="tel" />
        <TextField label={t("fax")} value={form.fax} onChange={(v) => set({ fax: v })} type="tel" />
        <TextField label={t("email")} value={form.email} onChange={(v) => set({ email: v })} type="email" />
        <TextField label={t("contactFirst")} value={form.contactFirst} onChange={(v) => set({ contactFirst: v })} />
        <TextField label={t("contactLast")} value={form.contactLast} onChange={(v) => set({ contactLast: v })} />
        <TextField label={t("address")} value={form.address} onChange={(v) => set({ address: v })} span />
      </div>
      <h3 className="mb-2 mt-5 text-sm font-bold">{t("tripRequirements")}</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {FLAGS.map((flag) => <CheckField key={flag} label={t(`flags.${flag}`)} checked={form[flag]} onChange={(v) => set({ [flag]: v })} />)}
      </div>
    </FormModal>
  );
}

// ------------------------------------------------------------------ billing items

function BillingItemsPanel() {
  const t = useTranslations("admin");
  const feedback = useFeedback();
  const errorText = useErrorText();
  const items = useBillingItems();
  const { remove } = useBillingItemActions();
  const [dialog, setDialog] = useState<{ item: BillingItem | null } | null>(null);

  async function del(item: BillingItem) {
    if (!(await feedback.confirm(t("confirmDeleteItem", { name: item.description ?? "" })))) return;
    try {
      await remove.mutateAsync(item.id ?? 0);
    } catch (e) {
      await feedback.alert(errorText(e, t("actionFailed")));
    }
  }

  const list = items.data ?? [];

  return (
    <Panel title={t("billingItemsTitle")} icon={IconList} description={t("billingItemsHelp")} action={<PrimaryButton onClick={() => setDialog({ item: null })}>{t("newBillingItem")}</PrimaryButton>}>
      {items.isError && <p className="text-sm text-red-600">{t("loadFailed")}</p>}
      {items.isSuccess && list.length === 0 && <p className="text-sm text-muted">{t("noBillingItems")}</p>}
      {list.length > 0 && (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {list.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{item.description}</p>
                <p className="text-xs text-muted">
                  {item.unitAbbreviation}{item.isCopay ? ` · ${t("copay")}` : ""}{item.isAssigned ? ` · ${t("hasRates")}` : ""}
                </p>
              </div>
              <div className="flex gap-1.5">
                <SmallButton icon={IconEdit} onClick={() => setDialog({ item })}>{t("edit")}</SmallButton>
                <SmallButton tone="danger" icon={IconDelete} onClick={() => void del(item)} disabled={Boolean(item.isAssigned) || remove.isPending}
                  title={item.isAssigned ? t("cannotDeleteAssigned") : undefined}>
                  {t("delete")}
                </SmallButton>
              </div>
            </li>
          ))}
        </ul>
      )}
      {dialog && <BillingItemForm item={dialog.item} onClose={() => setDialog(null)} />}
    </Panel>
  );
}

function BillingItemForm({ item, onClose }: { item: BillingItem | null; onClose: () => void }) {
  const t = useTranslations("admin");
  const feedback = useFeedback();
  const errorText = useErrorText();
  const units = useUnits();
  const { create, edit } = useBillingItemActions();
  const [form, setForm] = useState<BillingItemEdit>({
    description: item?.description ?? "",
    unitId: item?.unitId ?? 0,
    isCopay: item?.isCopay ?? false,
    arAccount: item?.arAccount ?? "",
    arSubAccount: item?.arSubAccount ?? "",
    arCompany: item?.arCompany ?? "",
    apAccount: item?.apAccount ?? "",
    apSubAccount: item?.apSubAccount ?? "",
    apCompany: item?.apCompany ?? "",
  });
  const set = (patch: Partial<BillingItemEdit>) => setForm((f) => ({ ...f, ...patch }));

  async function save() {
    try {
      if (item) await edit.mutateAsync({ id: item.id ?? 0, body: form });
      else await create.mutateAsync(form);
      onClose();
    } catch (e) {
      await feedback.alert(errorText(e, t("actionFailed")));
    }
  }

  return (
    <FormModal title={item ? t("editBillingItem") : t("newBillingItem")} onClose={onClose} onSubmit={save} saving={create.isPending || edit.isPending}>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label={t("description")} value={form.description} onChange={(v) => set({ description: v })} required span />
        <SelectField label={t("unit")} value={form.unitId || ""} onChange={(v) => set({ unitId: Number(v) })} required>
          <option value="">{t("choose")}</option>
          {(units.data ?? []).map((u) => <option key={u.id} value={u.id}>{u.abbreviation} — {u.description}</option>)}
        </SelectField>
        <div className="flex items-end pb-2"><CheckField label={t("copay")} checked={form.isCopay} onChange={(v) => set({ isCopay: v })} /></div>
      </div>
      <h3 className="mb-2 mt-5 text-sm font-bold">{t("accounting")}</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <TextField label={t("arAccount")} value={form.arAccount} onChange={(v) => set({ arAccount: v })} />
        <TextField label={t("arSubAccount")} value={form.arSubAccount} onChange={(v) => set({ arSubAccount: v })} />
        <TextField label={t("arCompany")} value={form.arCompany} onChange={(v) => set({ arCompany: v })} />
        <TextField label={t("apAccount")} value={form.apAccount} onChange={(v) => set({ apAccount: v })} />
        <TextField label={t("apSubAccount")} value={form.apSubAccount} onChange={(v) => set({ apSubAccount: v })} />
        <TextField label={t("apCompany")} value={form.apCompany} onChange={(v) => set({ apCompany: v })} />
      </div>
    </FormModal>
  );
}

// ------------------------------------------------------------------ rates

function RatesPanel({ canEdit }: { canEdit: boolean }) {
  const t = useTranslations("admin");
  const format = useFormatter();
  const feedback = useFeedback();
  const errorText = useErrorText();
  const rates = useRates();
  const items = useBillingItems();
  const { edit } = useRateActions();
  const [dialog, setDialog] = useState<{ rate: Rate | null } | null>(null);
  const today = localToday();

  const money = (value: number | null | undefined) => (value == null ? "—" : format.number(value, { style: "currency", currency: "USD" }));
  const day = (value: string | null | undefined) => (value ? format.dateTime(new Date(`${toDateInput(value)}T12:00:00`), { dateStyle: "medium" }) : "—");
  const isClosed = (r: Rate) => toDateInput(r.toDate) < today;

  /** Ends a rate today. Rates are never deleted, so what was billed under it stays explainable. */
  async function close(rate: Rate) {
    if (!(await feedback.confirm(t("confirmCloseRate", { item: rate.billingItemDescription ?? "", date: day(today) })))) return;
    try {
      await edit.mutateAsync({ id: rate.id ?? 0, body: { ...toEdit(rate), toDate: today } });
    } catch (e) {
      await feedback.alert(errorText(e, t("actionFailed")));
    }
  }

  const list = rates.data ?? [];
  const hasOwnItems = (items.data?.length ?? 0) > 0;

  return (
    <Panel title={t("ratesTitle")} icon={IconBilling} description={t("ratesHelp")}
      action={canEdit && <PrimaryButton onClick={() => (hasOwnItems ? setDialog({ rate: null }) : void feedback.alert(t("createItemFirst")))}>{t("newRate")}</PrimaryButton>}>
      {rates.isError && <p className="text-sm text-red-600">{t("loadFailed")}</p>}
      {rates.isSuccess && list.length === 0 && <p className="text-sm text-muted">{t("noRates")}</p>}
      {list.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold">
              <tr>
                <th className="px-3 py-2">{t("billingItem")}</th>
                <th className="px-3">{t("spaceType")}</th>
                <th className="px-3 text-right">{t("rate")}</th>
                <th className="px-3">{t("per")}</th>
                <th className="px-3">{t("minMax")}</th>
                <th className="px-3">{t("validity")}</th>
                <th className="px-3 text-right">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className={`border-t border-border ${isClosed(r) ? "text-muted" : ""}`}>
                  <td className="px-3 py-2">
                    <span className="font-semibold">{r.billingItemDescription}</span>
                    <span className="ml-1 text-xs text-muted">{r.billingItemUnitAbbreviation}</span>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {r.isOffice && <Tag className="bg-slate-200 text-slate-700">{t("officeRate")}</Tag>}
                      {r.isDefault && <Tag className="bg-sky-100 text-sky-800">{t("default")}</Tag>}
                      {isClosed(r) && <Tag className="bg-amber-100 text-amber-800">{t("closed")}</Tag>}
                    </div>
                  </td>
                  <td className="px-3">{r.spaceTypeName}</td>
                  <td className="px-3 text-right font-semibold">{money(r.rate)}</td>
                  <td className="px-3">{r.per || "—"}</td>
                  <td className="px-3 text-xs">{money(r.minCharge)} / {money(r.maxCharge)}</td>
                  <td className="px-3 text-xs">{day(r.fromDate)} → {day(r.toDate)}</td>
                  <td className="px-3 py-2">
                    {r.canEdit && (
                      <div className="flex justify-end gap-1.5">
                        <SmallButton icon={IconEdit} onClick={() => setDialog({ rate: r })}>{t("edit")}</SmallButton>
                        {!isClosed(r) && <SmallButton tone="danger" icon={IconCancelled} onClick={() => void close(r)} disabled={edit.isPending}>{t("closeRate")}</SmallButton>}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {dialog && <RateForm rate={dialog.rate} onClose={() => setDialog(null)} />}
    </Panel>
  );
}

function toEdit(r: Rate): RateEdit {
  return {
    billingItemId: r.billingItemId,
    spaceTypeId: r.spaceTypeId,
    rate: r.rate,
    per: r.per,
    isDefault: r.isDefault,
    procedureCode: r.procedureCode,
    minCharge: r.minCharge,
    maxCharge: r.maxCharge,
    greaterThanMinQty: r.greaterThanMinQty,
    lessOrEqualMaxQty: r.lessOrEqualMaxQty,
    freeQty: r.freeQty,
    fromDate: toDateInput(r.fromDate),
    toDate: toDateInput(r.toDate),
  };
}

/** Empty text is "not set", not zero: a minimum charge of $0 and no minimum are different things. */
const num = (v: string) => (v.trim() === "" ? null : Number(v));

function RateForm({ rate, onClose }: { rate: Rate | null; onClose: () => void }) {
  const t = useTranslations("admin");
  const feedback = useFeedback();
  const errorText = useErrorText();
  const items = useBillingItems();
  const spaceTypes = useSpaceTypes();
  const { create, edit } = useRateActions();
  const today = localToday();
  const [form, setForm] = useState<RateEdit>(
    rate ? toEdit(rate) : { billingItemId: 0, spaceTypeId: 0, rate: 0, per: "", isDefault: false, fromDate: today, toDate: `${today.slice(0, 4)}-12-31` },
  );
  const set = (patch: Partial<RateEdit>) => setForm((f) => ({ ...f, ...patch }));

  async function save() {
    try {
      if (rate) await edit.mutateAsync({ id: rate.id ?? 0, body: form });
      else await create.mutateAsync(form);
      onClose();
    } catch (e) {
      await feedback.alert(errorText(e, t("actionFailed")));
    }
  }

  return (
    <FormModal title={rate ? t("editRate") : t("newRate")} onClose={onClose} onSubmit={save} saving={create.isPending || edit.isPending}>
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField label={t("billingItem")} value={form.billingItemId || ""} onChange={(v) => set({ billingItemId: Number(v) })} required>
          <option value="">{t("choose")}</option>
          {(items.data ?? []).map((i) => <option key={i.id} value={i.id}>{i.description} ({i.unitAbbreviation})</option>)}
        </SelectField>
        <SelectField label={t("spaceType")} value={form.spaceTypeId || ""} onChange={(v) => set({ spaceTypeId: Number(v) })} required>
          <option value="">{t("choose")}</option>
          {(spaceTypes.data ?? []).filter((s) => s.isActive !== false || s.id === form.spaceTypeId).map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </SelectField>
      </div>

      <h3 className="mb-2 mt-5 text-sm font-bold">{t("pricing")}</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <TextField label={t("rate")} value={form.rate} onChange={(v) => set({ rate: Number(v) })} type="number" step="0.01" min="0" required />
        <TextField label={t("per")} value={form.per} onChange={(v) => set({ per: v })} />
        <TextField label={t("procedureCode")} value={form.procedureCode} onChange={(v) => set({ procedureCode: v })} />
        <TextField label={t("minCharge")} value={form.minCharge} onChange={(v) => set({ minCharge: num(v) })} type="number" step="0.01" min="0" />
        <TextField label={t("maxCharge")} value={form.maxCharge} onChange={(v) => set({ maxCharge: num(v) })} type="number" step="0.01" min="0" />
        <div className="flex items-end pb-2"><CheckField label={t("default")} checked={form.isDefault} onChange={(v) => set({ isDefault: v })} /></div>
      </div>

      <h3 className="mb-2 mt-5 text-sm font-bold">{t("quantityRules")}</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <TextField label={t("greaterThanMinQty")} value={form.greaterThanMinQty} onChange={(v) => set({ greaterThanMinQty: num(v) })} type="number" min="0" />
        <TextField label={t("lessOrEqualMaxQty")} value={form.lessOrEqualMaxQty} onChange={(v) => set({ lessOrEqualMaxQty: num(v) })} type="number" min="0" />
        <TextField label={t("freeQty")} value={form.freeQty} onChange={(v) => set({ freeQty: num(v) })} type="number" min="0" />
      </div>

      <h3 className="mb-2 mt-5 text-sm font-bold">{t("validity")}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label={t("fromDate")} value={toDateInput(form.fromDate)} onChange={(v) => set({ fromDate: v })} type="date" required />
        <TextField label={t("toDate")} value={toDateInput(form.toDate)} onChange={(v) => set({ toDate: v })} type="date" required />
      </div>
    </FormModal>
  );
}

function Tag({ children, className }: { children: ReactNode; className: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${className}`}>{children}</span>;
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-2">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-words">{value || "—"}</dd>
    </div>
  );
}
