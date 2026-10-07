import "server-only";
import { selectEnvironment } from "./environments";

function requireSecret(name: string, minLength: number): string {
  const value = process.env[name];
  if (!value || value.length < minLength) {
    throw new Error(`${name} must be set and at least ${minLength} characters long.`);
  }
  return value;
}

export const serverConfig = {
  get environment() {
    return selectEnvironment();
  },
  get sessionSecret() {
    return requireSecret("SESSION_SECRET", 32);
  },
  /** Sent as X-Client-App: the backend picks this app's session policy from it. */
  clientApp: "BookingWeb",
  clientVersion: process.env.npm_package_version ?? "0.1.0",
};
