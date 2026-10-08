"use client";

import { useTranslations } from "next-intl";
import { useFeedback } from "@/components/Feedback";
import { Button } from "@/components/ui/Button";
import { IconCheckCircle, IconClose } from "@/components/ui/Icon";
import { useErrorText } from "@/i18n/useErrorText";
import { useProviderActions, type ProviderRow } from "./catalogApi";

/**
 * Contract or remove straight from the list, for a clinic's admin. The backend checks the role
 * again; the button only saves opening the file. An inactive Provider cannot be contracted.
 */
export function ContractButton({ row }: { row: ProviderRow }) {
  const t = useTranslations("catalog");
  const feedback = useFeedback();
  const errorText = useErrorText();
  const { contract } = useProviderActions(row.id ?? 0);
  const on = !row.contracted;

  async function toggle(event: React.MouseEvent) {
    // The row itself opens the file: this click is only for the button.
    event.stopPropagation();
    if (!on && !(await feedback.confirm(t("confirmRemove", { name: row.name ?? "" })))) return;
    try {
      await contract.mutateAsync(on);
    } catch (e) {
      await feedback.alert(errorText(e, t("actionFailed")));
    }
  }

  return on ? (
    <Button size="sm" variant="success" icon={IconCheckCircle} loading={contract.isPending} disabled={!row.isActive}
      title={!row.isActive ? t("inactiveCannotContract") : undefined} onClick={(e) => void toggle(e)}>
      {t("contract")}
    </Button>
  ) : (
    <Button size="sm" variant="danger-outline" icon={IconClose} loading={contract.isPending} onClick={(e) => void toggle(e)}>
      {t("remove")}
    </Button>
  );
}
