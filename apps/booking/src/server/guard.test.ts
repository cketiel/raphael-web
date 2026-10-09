import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));
const { rejectCrossSite } = await import("./guard");

const PUBLIC = "https://app-raphael-booking-prod-scus.azurewebsites.net";

/**
 * A request as App Service hands it to the Node server: TLS ends at the front end, so the server
 * listens on http://0.0.0.0:8080 while the browser called the public host.
 */
function behindAppService(headers: Record<string, string>) {
  return new NextRequest("http://0.0.0.0:8080/api/auth/login", {
    method: "POST",
    headers: { host: "app-raphael-booking-prod-scus.azurewebsites.net", "x-forwarded-proto": "https", ...headers },
  });
}

describe("rejectCrossSite", () => {
  it("lets our own page through behind the App Service front end", () => {
    expect(rejectCrossSite(behindAppService({ origin: PUBLIC, "x-raphael-bff": "1" }))).toBeNull();
  });

  it("lets it through on a custom domain, by the forwarded host", () => {
    const request = behindAppService({
      origin: "https://booking.raphaeldh.com",
      "x-forwarded-host": "booking.raphaeldh.com",
      "x-raphael-bff": "1",
    });
    expect(rejectCrossSite(request)).toBeNull();
  });

  it("refuses another site", () => {
    expect(rejectCrossSite(behindAppService({ origin: "https://evil.example", "x-raphael-bff": "1" }))?.status).toBe(403);
  });

  it("refuses a malformed origin", () => {
    expect(rejectCrossSite(behindAppService({ origin: "null", "x-raphael-bff": "1" }))?.status).toBe(403);
  });

  it("refuses a call without the BFF header", () => {
    expect(rejectCrossSite(behindAppService({ origin: PUBLIC }))?.status).toBe(403);
  });

  it("still works locally", () => {
    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { host: "localhost:3000", origin: "http://localhost:3000", "x-raphael-bff": "1" },
    });
    expect(rejectCrossSite(request)).toBeNull();
  });
});
