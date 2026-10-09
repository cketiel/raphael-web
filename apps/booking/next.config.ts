import type { NextConfig } from "next";
import packageJson from "./package.json";

// Headers for every response, API routes included. The CSP itself is set per request in
// src/proxy.ts because it carries a fresh nonce.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // Inlined at build time. The release tag must match the version the portal shows (GIT_WORKFLOW).
  env: { APP_VERSION: packageJson.version },
  transpilePackages: ["@raphael/api-client"],
  // next-intl finds its request config through this alias. Its plugin would set it, but the plugin
  // loads @swc/core's native binary, which does not start on this machine; the alias is all it adds here.
  // The language comes from the signed-in user's own cookie, not from the URL (src/i18n/request.ts).
  turbopack: { resolveAlias: { "next-intl/config": "./src/i18n/request.ts" } },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
