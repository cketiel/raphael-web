// Both environments are declared and the choice is explicit (CLIENT_CONFIG_POLICY §2.1).
// PROD uses the custom domain, never the Azure host: moving the backend must stay a CNAME change.
export const ENVIRONMENTS = {
  dev: { name: "DEV", apiBaseUrl: "https://app-raphael-dev-scus.azurewebsites.net" },
  prod: { name: "PROD", apiBaseUrl: "https://api.raphaeldh.com" },
} as const;

export type EnvironmentKey = keyof typeof ENVIRONMENTS;

export function selectEnvironment() {
  const key = process.env.RAPHAEL_API_ENV as EnvironmentKey | undefined;
  if (!key || !(key in ENVIRONMENTS)) {
    throw new Error("RAPHAEL_API_ENV must be 'dev' or 'prod'. There is no implicit default.");
  }
  return ENVIRONMENTS[key];
}
