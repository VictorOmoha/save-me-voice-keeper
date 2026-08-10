import {describe, expect, it} from "vitest";
import {
  assertAdvancedSearchAccess,
  assertAgentApiAccess,
  assertBrowserExtensionAccess,
  assertEntryAdmission,
  assertPortableExportAccess,
  assertStorageAdmission,
  assertVoiceAiAccess,
  entitlementErrorEnvelope,
  EntitlementError,
  PLAN_CATALOG,
  resolvePlan,
} from "./entitlements";

const expectCode = (action: () => void, code: string) => {
  try {
    action();
    throw new Error("expected entitlement failure");
  } catch (error) {
    expect(error).toBeInstanceOf(EntitlementError);
    expect((error as EntitlementError).code).toBe(code);
  }
};

describe("D-004 entitlement catalog", () => {
  it("defines every ratified plan and exact quotas", () => {
    expect(PLAN_CATALOG.free.entryLimit).toBe(50);
    expect(PLAN_CATALOG.free.storageLimitBytes).toBe(500 * 1024 * 1024);
    expect(PLAN_CATALOG.basic.entryLimit).toBeNull();
    expect(PLAN_CATALOG.basic.storageLimitBytes).toBe(5 * 1024 ** 3);
    expect(PLAN_CATALOG.premium.entryLimit).toBeNull();
    expect(PLAN_CATALOG.premium.storageLimitBytes).toBe(50 * 1024 ** 3);
  });

  it.each(["free", "basic", "premium"] as const)("resolves %s exactly", (plan) => {
    expect(resolvePlan(plan)).toBe(PLAN_CATALOG[plan]);
  });

  it("defaults missing user documents and missing plans to Free for migration", () => {
    expect(resolvePlan(undefined, false)).toBe(PLAN_CATALOG.free);
    expect(resolvePlan(undefined, true)).toBe(PLAN_CATALOG.free);
    expect(resolvePlan(null, true)).toBe(PLAN_CATALOG.free);
  });

  it("fails closed for explicit unknown plans with the stable envelope", () => {
    try {
      resolvePlan("enterprise");
      throw new Error("expected failure");
    } catch (error) {
      expect(error).toBeInstanceOf(EntitlementError);
      expect(entitlementErrorEnvelope(error as EntitlementError)).toEqual({
        error: {code: "ENTITLEMENT_UNKNOWN_PLAN", message: "Account plan is not recognized"},
      });
    }
  });
});

describe("D-004 capability enforcement", () => {
  it.each([PLAN_CATALOG.free, PLAN_CATALOG.basic, PLAN_CATALOG.premium])("keeps voice and export universal on $id", (plan) => {
    expect(() => assertVoiceAiAccess(plan)).not.toThrow();
    expect(() => assertPortableExportAccess(plan)).not.toThrow();
  });

  it("allows extension and advanced search only for Basic+", () => {
    expectCode(() => assertBrowserExtensionAccess(PLAN_CATALOG.free), "ENTITLEMENT_REQUIRED");
    expectCode(() => assertAdvancedSearchAccess(PLAN_CATALOG.free), "ENTITLEMENT_REQUIRED");
    for (const plan of [PLAN_CATALOG.basic, PLAN_CATALOG.premium]) {
      expect(() => assertBrowserExtensionAccess(plan)).not.toThrow();
      expect(() => assertAdvancedSearchAccess(plan)).not.toThrow();
    }
  });

  it("allows agent API only for Premium, preventing direct API-key bypass", () => {
    expectCode(() => assertAgentApiAccess(PLAN_CATALOG.free), "ENTITLEMENT_REQUIRED");
    expectCode(() => assertAgentApiAccess(PLAN_CATALOG.basic), "ENTITLEMENT_REQUIRED");
    expect(() => assertAgentApiAccess(PLAN_CATALOG.premium)).not.toThrow();
  });
});

describe("D-004 numeric admissions", () => {
  it("admits Free through entry 50 and rejects entry 51", () => {
    expect(() => assertEntryAdmission(PLAN_CATALOG.free, 49, 1)).not.toThrow();
    expectCode(() => assertEntryAdmission(PLAN_CATALOG.free, 50, 1), "ENTRY_QUOTA_EXCEEDED");
  });

  it.each([PLAN_CATALOG.basic, PLAN_CATALOG.premium])("keeps $id entries unlimited", (plan) => {
    expect(() => assertEntryAdmission(plan, 1_000_000, 100)).not.toThrow();
  });

  it.each([PLAN_CATALOG.free, PLAN_CATALOG.basic, PLAN_CATALOG.premium])("enforces exact storage boundary for $id", (plan) => {
    expect(() => assertStorageAdmission(plan, plan.storageLimitBytes - 1, 1)).not.toThrow();
    expectCode(() => assertStorageAdmission(plan, plan.storageLimitBytes, 1), "STORAGE_QUOTA_EXCEEDED");
  });
});
