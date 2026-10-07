import type { NextConfig } from "next";

// ETA is published as plain static files to GoDaddy: no Node server, no server-side code.
const nextConfig: NextConfig = {
  output: "export",
  poweredByHeader: false,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
