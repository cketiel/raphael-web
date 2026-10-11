"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        // Data is kept for 10 minutes before a screen that shows it again asks for it again. Edits
        // refresh what they change (each mutation invalidates its own query), so nothing waits on this.
        defaultOptions: { queries: { staleTime: 10 * 60_000, retry: 1, refetchOnWindowFocus: false } },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
