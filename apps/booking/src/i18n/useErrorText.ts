"use client";

import { useTranslations } from "next-intl";
import { BffError } from "@/lib/bff";

/**
 * The text to show for a failed call. This portal's own messages are translated from their code;
 * the backend's arrive in English and are shown as they come.
 */
export function useErrorText() {
  const t = useTranslations("errors");
  return (error: unknown, fallback: string) => {
    if (!(error instanceof BffError)) return fallback;
    return error.code && t.has(error.code) ? t(error.code) : error.message;
  };
}
