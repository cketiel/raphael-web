"use client";

import { useTranslations } from "next-intl";
import { useFeedback } from "@/components/Feedback";
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

  return (
    <button type="button" onClick={(e) => void toggle(e)} disabled={contract.isPending || (on && !row.isActive)}
      title={on && !row.isActive ? t("inactiveCannotContract") : undefined}
      className={`rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-50 ${
        on ? "bg-[#198754] text-white" : "border border-[#dc3545] text-[#dc3545] hover:bg-red-50"
      }`}>
      {on ? t("contract") : t("remove")}
    </button>
  );
}
