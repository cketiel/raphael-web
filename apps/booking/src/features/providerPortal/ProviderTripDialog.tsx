"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Form";
import { IconCheckCircle, IconClose, IconUser } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { Notice } from "@/components/ui/Surface";
import { useErrorText } from "@/i18n/useErrorText";
import type { TripLine } from "@/features/booking/tripLines";
import { providerTrips } from "./providerPortalApi";
import { toTimeSpan } from "./providerTripRules";

/** "accept" needs no dialog: it is one click, on one trip or on the ones selected. */
export type ProviderTripAction = "accept" | "reject" | "noShow" | "complete";

const ICON = { reject: IconClose, noShow: IconUser, complete: IconCheckCircle };

/**
 * The three guided reports of an external Provider on one of its trips. The status field is never
 * open: each one is a question with its own answers, and the backend checks it again.
 * - Reject: the reason, which the clinic reads. The trip keeps the Provider, marked.
 * - No-show: the reason. Cancelled as a driver's no-show, the return with it.
 * - Complete: the real pickup and drop-off times, which the production report bills with.
 */
export function ProviderTripDialog({ action, line, onClose, onDone }: {
  action: Exclude<ProviderTripAction, "accept">; line: TripLine; onClose: () => void; onDone: () => void;
}) {
  const t = useTranslations("providerPortal");
  const tc = useTranslations("common");
  const errorText = useErrorText();
  const [reason, setReason] = useState("");
  const [times, setTimes] = useState({ pickupArrivedAt: "", pickedUpAt: "", dropoffArrivedAt: "", droppedOffAt: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (action === "complete") {
      if (!times.pickedUpAt || !times.droppedOffAt) return setError(t("timesRequired"));
      if (times.droppedOffAt < times.pickedUpAt) return setError(t("dropoffBeforePickup"));
    } else if (!reason.trim()) {
      return setError(t("reasonRequired"));
    }
    setBusy(true);
    try {
      const id = line.trip.id;
      if (action === "reject") await providerTrips.reject(id, reason.trim());
      else if (action === "noShow") await providerTrips.noShow(id, reason.trim());
      else await providerTrips.complete(id, {
        pickupArrivedAt: toTimeSpan(times.pickupArrivedAt),
        pickedUpAt: toTimeSpan(times.pickedUpAt) ?? "",
        dropoffArrivedAt: toTimeSpan(times.dropoffArrivedAt),
        droppedOffAt: toTimeSpan(times.droppedOffAt) ?? "",
      });
      onDone();
    } catch (e) {
      setError(errorText(e, t("failed")));
      setBusy(false);
    }
  }

  const time = (key: keyof typeof times, label: string, required: boolean) => (
    <Field label={label} htmlFor={`pt-${key}`} required={required}>
      <Input id={`pt-${key}`} type="time" required={required} value={times[key]}
        onChange={(e) => setTimes((v) => ({ ...v, [key]: e.target.value }))} />
    </Field>
  );

  return (
    <Modal title={t(`${action}Title`, { id: line.number })} icon={ICON[action]} size="sm" onClose={onClose} onSubmit={submit} labelledBy="provider-trip-title"
      footer={<>
        <Button variant="secondary" onClick={onClose}>{tc("cancel")}</Button>
        <Button type="submit" variant={action === "complete" ? "success" : "danger"} loading={busy}>{t(`${action}Confirm`)}</Button>
      </>}>
      <div className="space-y-4">
        <p className="text-sm text-muted">{line.patient} · {line.day} {line.time ?? ""}</p>
        <Notice tone={action === "complete" ? "info" : "warning"}>{t(`${action}Text`)}</Notice>
        {action === "complete" ? (
          <div className="grid grid-cols-2 gap-3">
            {time("pickupArrivedAt", t("pickupArrivedAt"), false)}
            {time("pickedUpAt", t("pickedUpAt"), true)}
            {time("dropoffArrivedAt", t("dropoffArrivedAt"), false)}
            {time("droppedOffAt", t("droppedOffAt"), true)}
          </div>
        ) : (
          <Field label={t("reason")} htmlFor="pt-reason" required>
            <Textarea id="pt-reason" required maxLength={500} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        )}
        {error && <Notice tone="danger"><span role="alert">{error}</span></Notice>}
      </div>
    </Modal>
  );
}
