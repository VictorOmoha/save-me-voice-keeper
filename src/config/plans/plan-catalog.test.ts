/**
 * SAVE-003 — Tests for the non-operative typed plan catalog.
 *
 * These tests pin the catalog's contract: stable IDs, one claim per field,
 * per-environment Stripe mapping, safe price→plan resolution, and the lifecycle
 * state machine mapping. They run under the existing Vitest config
 * (`vitest.config.ts`, jsdom environment, `@` alias) with no new dependencies.
 *
 * The catalog is NOT wired into production; these tests guard the design so a
 * future wiring PR can trust the module.
 */

import { describe, it, expect } from "vitest";
import {
  PLAN_CATALOG,
  PLANS_IN_ORDER,
  getPlan,
  isPlanId,
  resolveStripePriceId,
  planFromStripePriceId,
  lifecycleFromStripeStatus,
  stateEntitlesToPlan,
  type PlanId,
  type LifecycleState,
} from "./plan-catalog";

describe("PLAN_CATALOG — identity", () => {
  it("contains exactly the three D-004 launch plan IDs", () => {
    expect(Object.keys(PLAN_CATALOG).sort()).toEqual([
      "basic",
      "free",
      "premium",
    ]);
  });

  it("uses the plan ID as the record key (no drift between key and id)", () => {
    for (const plan of PLANS_IN_ORDER) {
      expect(PLAN_CATALOG[plan.id].id).toBe(plan.id);
    }
  });

  it("gives every plan a display name and a copy key", () => {
    for (const plan of PLANS_IN_ORDER) {
      expect(plan.displayName.length).toBeGreaterThan(0);
      expect(plan.copyKey).toMatch(/^plans\./);
    }
  });

  it("exposes plans in stable display order: free, basic, premium", () => {
    expect(PLANS_IN_ORDER.map((p) => p.id)).toEqual([
      "free",
      "basic",
      "premium",
    ]);
  });
});

describe("PLAN_CATALOG — pricing", () => {
  it("free plan costs nothing and has no billing period", () => {
    expect(PLAN_CATALOG.free.price).toEqual({
      amount: 0,
      currency: "USD",
      period: "none",
    });
  });

  it("basic and premium are monthly USD plans", () => {
    expect(PLAN_CATALOG.basic.price.period).toBe("month");
    expect(PLAN_CATALOG.premium.price.period).toBe("month");
    expect(PLAN_CATALOG.basic.price.currency).toBe("USD");
    expect(PLAN_CATALOG.premium.price.currency).toBe("USD");
  });

  it("only basic and premium are sellable via self-serve checkout", () => {
    const sellable = PLANS_IN_ORDER.filter((p) => p.sellable).map((p) => p.id);
    expect(sellable.sort()).toEqual(["basic", "premium"]);
  });

  it("no paid plan carries a real Stripe price ID in source (placeholders only)", () => {
    // Guard against someone committing a live price ID into the catalog.
    // Live Stripe price IDs start with "price_" followed by a long random suffix;
    // the placeholders here are short, human-readable sentinels shared with
    // functions/src/billing/functions.ts.
    for (const plan of PLANS_IN_ORDER) {
      for (const env of ["test", "live"] as const) {
        const byPeriod = plan.stripe[env];
        if (!byPeriod) continue;
        for (const period of Object.keys(byPeriod) as Array<"month" | "year">) {
          const mapping = byPeriod[period];
          expect(mapping?.resolvedFromEnv).toBe(false);
        }
      }
    }
  });
});

describe("PLAN_CATALOG — entitlements", () => {
  it("free plan has a finite entry cap; paid plans are unlimited", () => {
    expect(PLAN_CATALOG.free.entitlements.maxEntries).toBe(50);
    expect(PLAN_CATALOG.basic.entitlements.maxEntries).toBeNull();
    expect(PLAN_CATALOG.premium.entitlements.maxEntries).toBeNull();
  });

  it("storage quotas increase monotonically free < basic < premium", () => {
    const f = PLAN_CATALOG.free.entitlements.maxStorageBytes!;
    const b = PLAN_CATALOG.basic.entitlements.maxStorageBytes!;
    const p = PLAN_CATALOG.premium.entitlements.maxStorageBytes!;
    expect(f).toBeLessThan(b);
    expect(b).toBeLessThan(p);
  });

  it("free storage matches the client hook (500 MB)", () => {
    expect(PLAN_CATALOG.free.entitlements.maxStorageBytes).toBe(500 * 1024 * 1024);
  });

  it("implements D-004's real feature gates", () => {
    expect(PLAN_CATALOG.free.entitlements.platforms).toEqual(["web"]);
    expect(PLAN_CATALOG.basic.entitlements.platforms).toContain("browser-extension");
    expect(PLAN_CATALOG.premium.entitlements.platforms).toContain("browser-extension");
    expect(PLAN_CATALOG.free.entitlements.advancedSearch).toBe(false);
    expect(PLAN_CATALOG.basic.entitlements.advancedSearch).toBe(true);
    expect(PLAN_CATALOG.free.entitlements.agentApiAccess).toBe(false);
    expect(PLAN_CATALOG.basic.entitlements.agentApiAccess).toBe(false);
    expect(PLAN_CATALOG.premium.entitlements.agentApiAccess).toBe(true);
    for (const plan of PLANS_IN_ORDER) {
      expect(plan.entitlements.voiceInput).toBe(true);
      expect(plan.entitlements.dataExport).toBe(true);
      expect(plan.entitlements.dataBackup).toBe(false);
      expect(plan.entitlements.customIntegrations).toBe(false);
      expect(plan.entitlements.enhancedPrivacyControls).toBe(false);
      expect(plan.entitlements.supportLevel).toBe("standard");
      expect(plan.entitlements.platforms).not.toContain("mobile");
      expect(plan.entitlements.platforms).not.toContain("desktop");
    }
  });
});

describe("getPlan / isPlanId", () => {
  it("round-trips known IDs", () => {
    for (const id of ["free", "basic", "premium"] as PlanId[]) {
      expect(isPlanId(id)).toBe(true);
      expect(getPlan(id)?.id).toBe(id);
    }
  });

  it("rejects unknown IDs instead of defaulting to a paid plan", () => {
    expect(isPlanId("pro")).toBe(false);
    expect(isPlanId("teams")).toBe(false);
    expect(isPlanId("")).toBe(false);
    expect(getPlan("pro")).toBeUndefined();
  });
});

describe("resolveStripePriceId", () => {
  it("returns the placeholder when no env var is set", () => {
    expect(resolveStripePriceId("basic", "month", "test", {})).toBe(
      "price_basic_monthly"
    );
    expect(resolveStripePriceId("premium", "month", "live", {})).toBe(
      "price_premium_monthly"
    );
  });

  it("prefers a real env var over the placeholder", () => {
    expect(
      resolveStripePriceId("basic", "month", "live", {
        STRIPE_BASIC_PRICE_ID: "price_REAL_from_env",
      })
    ).toBe("price_REAL_from_env");
  });

  it("returns null for the free plan (no price)", () => {
    expect(resolveStripePriceId("free", "month", "test", {})).toBeNull();
  });

  it("returns null for a period the plan does not offer (no annual SKU)", () => {
    expect(resolveStripePriceId("basic", "year", "test", {})).toBeNull();
  });
});

describe("planFromStripePriceId", () => {
  it("maps known placeholder prices to their plans", () => {
    expect(planFromStripePriceId("price_basic_monthly")).toBe("basic");
    expect(planFromStripePriceId("price_premium_monthly")).toBe("premium");
  });

  it("returns undefined for an unknown price ID (never defaults to a paid plan)", () => {
    // Regression guard for functions/src/billing/functions.ts getPlanFromPriceId,
    // which currently returns "basic" for any unknown price.
    expect(planFromStripePriceId("price_does_not_exist")).toBeUndefined();
    expect(planFromStripePriceId("")).toBeUndefined();
  });
});

describe("lifecycleFromStripeStatus", () => {
  it("maps Stripe statuses to lifecycle states", () => {
    expect(lifecycleFromStripeStatus("trialing")).toBe("trialing");
    expect(lifecycleFromStripeStatus("active")).toBe("active");
    expect(lifecycleFromStripeStatus("past_due")).toBe("past_due");
    expect(lifecycleFromStripeStatus("canceled")).toBe("canceled");
    expect(lifecycleFromStripeStatus("unpaid")).toBe("canceled");
    expect(lifecycleFromStripeStatus("something-else")).toBe("free");
  });

  it("treats past_due as still-entitled (grace), unlike the current webhook", () => {
    // The current webhook maps any non-active status to free, which would cut off
    // a user whose card simply failed once. The catalog's mapping keeps them
    // entitled through the grace window.
    const state: LifecycleState = lifecycleFromStripeStatus("past_due");
    expect(stateEntitlesToPlan(state)).toBe(true);
  });

  it("canceled and free do not entitle", () => {
    expect(stateEntitlesToPlan("canceled")).toBe(false);
    expect(stateEntitlesToPlan("free")).toBe(false);
  });

  it("trialing and active entitle", () => {
    expect(stateEntitlesToPlan("trialing")).toBe(true);
    expect(stateEntitlesToPlan("active")).toBe(true);
  });
});

describe("catalog ↔ audit consistency", () => {
  it("has one field for every claim the audit flagged as a paid differentiator", () => {
    // These are the claims the audit found advertised but unenforced
    // (export, backup, agent API, privacy controls, custom integrations).
    const premium = PLAN_CATALOG.premium.entitlements;
    expect(premium).toHaveProperty("dataExport");
    expect(premium).toHaveProperty("dataBackup");
    expect(premium).toHaveProperty("agentApiAccess");
    expect(premium).toHaveProperty("enhancedPrivacyControls");
    expect(premium).toHaveProperty("customIntegrations");
  });

  it("implements D-004's no-paid-trial contract", () => {
    for (const plan of PLANS_IN_ORDER) {
      expect(plan.trial.days).toBe(0);
    }
  });
});
