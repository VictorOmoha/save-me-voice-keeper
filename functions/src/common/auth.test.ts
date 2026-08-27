import {describe, expect, it} from "vitest";
import {AuthenticatedUser, legacyAgentFallbackAllowed} from "./auth";

const legacyUser = (legacyFallback: boolean): AuthenticatedUser => ({
  uid: legacyFallback ? "nia-openclaw-agent" : "owner-1",
  saveMeApiKey: {
    permissions: ["read", "write"],
    legacy: true,
    legacyFallback,
  },
} as AuthenticatedUser);

describe("legacy AGENT_API_KEY migration policy", () => {
  it("preserves the historical unbound fallback outside production", () => {
    expect(legacyAgentFallbackAllowed(legacyUser(true), {NODE_ENV: "development"})).toBe(true);
  });

  it("fails closed for the unbound fallback in production", () => {
    expect(legacyAgentFallbackAllowed(legacyUser(true), {K_SERVICE: "shared-memory"})).toBe(false);
  });

  it("requires an explicit production migration flag to retain the fallback", () => {
    expect(legacyAgentFallbackAllowed(legacyUser(true), {
      K_SERVICE: "shared-memory",
      ALLOW_LEGACY_AGENT_FALLBACK: "true",
    })).toBe(true);
  });

  it("never bypasses entitlement checks for an explicitly owner-bound key", () => {
    expect(legacyAgentFallbackAllowed(legacyUser(false), {
      NODE_ENV: "development",
      ALLOW_LEGACY_AGENT_FALLBACK: "true",
    })).toBe(false);
  });
});
