"use client";

import { useTranslations } from "next-intl";
import type { ComponentType, FormEvent, ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Check, Field, Input, Select } from "@/components/ui/Form";
import { IconPlus } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { Card, CardHeader, Notice as KitNotice } from "@/components/ui/Surface";

type IconComponent = ComponentType<{ size?: number | string; className?: string; "aria-hidden"?: boolean }>;

/** The Admin tab's form dialog: the portal's Modal with Cancel and Save. */
export function FormModal({ title, icon, children, onClose, onSubmit, saving, submitLabel }: {
  title: string;
  icon?: IconComponent;
  children: ReactNode;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
  saving: boolean;
  submitLabel?: string;
}) {
  const tc = useTranslations("common");
  const t = useTranslations("admin");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSubmit();
  }

  return (
    <Modal title={title} icon={icon} onClose={onClose} onSubmit={submit} labelledBy="admin-form-title"
      footer={<>
        <Button variant="secondary" onClick={onClose}>{tc("cancel")}</Button>
        <Button type="submit" loading={saving}>{submitLabel ?? t("save")}</Button>
      </>}>
      {children}
    </Modal>
  );
}

export function TextField({ label, value, onChange, type = "text", required, disabled, span, autoComplete, step, min }: {
  label: string;
  value: string | number | null | undefined;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  span?: boolean;
  autoComplete?: string;
  step?: string;
  min?: string;
}) {
  const id = `admin-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <Field label={label} htmlFor={id} required={required} className={span ? "sm:col-span-2" : ""}>
      <Input id={id} type={type} value={value ?? ""} required={required} disabled={disabled} autoComplete={autoComplete} step={step} min={min}
        onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function SelectField({ label, value, onChange, children, required, disabled }: {
  label: string;
  value: string | number | null | undefined;
  onChange: (value: string) => void;
  children: ReactNode;
  required?: boolean;
  disabled?: boolean;
}) {
  const id = `admin-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <Field label={label} htmlFor={id} required={required}>
      <Select id={id} value={value ?? ""} required={required} disabled={disabled} onChange={(e) => onChange(e.target.value)}>{children}</Select>
    </Field>
  );
}

export function CheckField({ label, checked, onChange, disabled }: {
  label: string;
  checked: boolean | null | undefined;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return <Check label={label} checked={Boolean(checked)} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />;
}

/** A section of the Admin tab: a card with its title, icon and main action. */
export function Panel({ title, description, icon, action, children }: {
  title: string;
  description?: ReactNode;
  icon?: IconComponent;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader title={title} description={description} icon={icon} actions={action} />
      {children}
    </Card>
  );
}

export function PrimaryButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <Button icon={IconPlus} onClick={onClick}>{children}</Button>;
}

export function SmallButton({ children, onClick, tone = "neutral", disabled, title, icon }: {
  children: ReactNode;
  onClick: () => void;
  tone?: "neutral" | "danger" | "success";
  disabled?: boolean;
  title?: string;
  icon?: IconComponent;
}) {
  const variant = tone === "danger" ? "danger-outline" : tone === "success" ? "secondary" : "secondary";
  return (
    <Button size="sm" variant={variant} icon={icon} onClick={onClick} disabled={disabled} title={title}
      className={tone === "success" ? "!text-success" : ""}>
      {children}
    </Button>
  );
}

/** Read-only notice at the top of a section: shared funding source, office rates… */
export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warning" }) {
  return <KitNotice tone={tone} className="mb-4">{children}</KitNotice>;
}

/** "2026-10-01T00:00:00" → "2026-10-01", what a date input wants. */
export function toDateInput(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}
