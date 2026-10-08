// Browser-side access to our own server. Every call is same-origin and carries the BFF header;
// the session travels in the httpOnly cookie, so there is no token anywhere in this file.

export class BffError extends Error {
  constructor(
    message: string,
    readonly status: number,
    /** Set by this portal's own server for its messages, so the page can show them in the user's language. */
    readonly code?: string,
  ) {
    super(message);
  }
}

async function readError(response: Response): Promise<{ message: string; code?: string }> {
  const text = await response.text();
  try {
    const body = JSON.parse(text);
    // Messages of this portal's own server carry a code the page translates.
    if (typeof body?.code === "string") return { message: body.message ?? text, code: body.code };
    // BadRequest("...") arrives as a JSON string; the original showed it with its quotes.
    if (typeof body === "string") return { message: body };
    if (body?.errors && typeof body.errors === "object") {
      // ASP.NET ModelState: { errors: { Field: ["msg"] } }
      // Same wording as the original portal (Booking Web app.js:69-70).
      const lines = Object.entries(body.errors as Record<string, string[]>).map(
        ([field, messages]) => `- ${field}: ${messages.join(", ")}`,
      );
      return { message: `Validation Errors:\n${lines.join("\n")}` };
    }
    return { message: body?.message ?? body?.title ?? text };
  } catch {
    return { message: text || response.statusText };
  }
}

export async function bff<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("x-raphael-bff", "1");
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, { ...init, headers, credentials: "same-origin" });

  if (response.status === 401 && typeof window !== "undefined" && !path.startsWith("/api/auth/login")) {
    // A full reload on purpose: it also drops every patient record held in this tab's memory.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/login");
  }
  if (!response.ok) {
    const { message, code } = await readError(response);
    throw new BffError(message, response.status, code);
  }
  if (response.status === 204) return undefined as T;

  const type = response.headers.get("content-type") ?? "";
  return (type.includes("json") ? response.json() : response.text()) as Promise<T>;
}

/** Shorthand for Raphael.Api endpoints behind the BFF allow-list. */
export const api = <T>(path: string, init?: RequestInit) => bff<T>(`/api/backend/${path}`, init);
