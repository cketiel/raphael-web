"use client";

import { useTranslations } from "next-intl";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Button } from "./ui/Button";
import { IconInfo, IconWarning } from "./ui/Icon";

/**
 * The original portal used the browser's alert(), confirm() and a full-screen spinner.
 * Same moments and same messages, rendered inside the page instead of native dialogs.
 */
interface Feedback {
  alert(message: string): Promise<void>;
  confirm(message: string): Promise<boolean>;
  /** Shows the blocking overlay while the promise runs, and always hides it after. */
  busy<T>(work: () => Promise<T>): Promise<T>;
}

const FeedbackContext = createContext<Feedback | null>(null);

export function useFeedback() {
  const value = useContext(FeedbackContext);
  if (!value) throw new Error("useFeedback must be used inside <FeedbackProvider>.");
  return value;
}

interface DialogState {
  message: string;
  kind: "alert" | "confirm";
  resolve: (ok: boolean) => void;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("common");
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [pending, setPending] = useState(0);
  const okRef = useRef<HTMLButtonElement>(null);

  const open = useCallback(
    (kind: DialogState["kind"], message: string) =>
      new Promise<boolean>((resolve) => setDialog({ kind, message, resolve })),
    [],
  );

  const busy = useCallback(async <T,>(work: () => Promise<T>) => {
    setPending((n) => n + 1);
    try {
      return await work();
    } finally {
      setPending((n) => n - 1);
    }
  }, []);

  const value: Feedback = {
    alert: async (message) => void (await open("alert", message)),
    confirm: (message) => open("confirm", message),
    busy,
  };

  function close(ok: boolean) {
    dialog?.resolve(ok);
    setDialog(null);
  }

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      {pending > 0 && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-white/70 backdrop-blur-[1px]" aria-busy="true" aria-live="polite">
          <div className="size-11 animate-spin rounded-full border-4 border-brand-200 border-t-brand" role="status">
            <span className="sr-only">{t("loading")}</span>
          </div>
        </div>
      )}

      {dialog && (
        <div className="fixed inset-0 z-[3100] flex items-center justify-center bg-slate-900/55 p-4" role="presentation">
          <div role={dialog.kind === "confirm" ? "alertdialog" : "dialog"} aria-modal="true" aria-describedby="feedback-message"
            className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-pop">
            <div className="flex items-start gap-4">
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                dialog.kind === "confirm" ? "bg-warning-soft text-warning" : "bg-brand-100 text-brand-700"
              }`}>
                {dialog.kind === "confirm" ? <IconWarning size={18} aria-hidden /> : <IconInfo size={19} aria-hidden />}
              </span>
              <p id="feedback-message" className="whitespace-pre-line pt-2 text-[0.95rem] leading-relaxed">{dialog.message}</p>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              {dialog.kind === "confirm" && (
                <Button variant="secondary" onClick={() => close(false)}>{t("cancel")}</Button>
              )}
              <Button ref={okRef} autoFocus onClick={() => close(true)} className="min-w-24">{t("ok")}</Button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}
