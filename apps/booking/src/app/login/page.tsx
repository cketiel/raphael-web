"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { bff, BffError } from "@/lib/bff";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await bff("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
      });
      router.replace("/");
    } catch (e) {
      setError(e instanceof BffError ? e.message : "Unable to sign in right now.");
      setBusy(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-navy px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl bg-surface p-8 shadow-xl">
        <h1 className="text-2xl font-bold">Raphael Booking Portal</h1>
        <p className="mt-1 text-sm text-muted">Sign in with your facility account.</p>

        <label className="mt-6 block text-sm font-medium" htmlFor="username">User</label>
        <input id="username" name="username" autoComplete="username" required
          className="mt-1 w-full rounded-lg border border-border px-3 py-2 outline-none focus:border-brand" />

        <label className="mt-4 block text-sm font-medium" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required
          className="mt-1 w-full rounded-lg border border-border px-3 py-2 outline-none focus:border-brand" />

        {error && <p role="alert" className="mt-4 whitespace-pre-line text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={busy}
          className="mt-6 w-full rounded-lg bg-gradient-to-r from-brand to-brand-2 py-2.5 font-semibold text-white disabled:opacity-60">
          {busy ? "Authenticating..." : "LOGIN"}
        </button>
      </form>
    </main>
  );
}
