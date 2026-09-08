import {describe, expect, it} from "vitest";
import {isSellablePlanId, launchCatalogSummary, publicPlanCards} from "./publicPlans";

describe("public plan cards", () => {
  it("exposes only the D-004 launch plans", () => {
    expect(publicPlanCards().map((plan) => plan.id)).toEqual(["free", "basic", "premium"]);
    expect(launchCatalogSummary()).toMatchObject({
      ids: ["basic", "free", "premium"],
      sellable: ["basic", "premium"],
      trialDays: [0, 0, 0],
      supportLevels: ["standard", "standard", "standard"],
    });
  });

  it("does not advertise trial, enterprise, or all-platform claims", () => {
    const text = publicPlanCards().flatMap((plan) => [plan.blurb, ...plan.features]).join(" ").toLowerCase();
    expect(text).not.toMatch(/trial|enterprise|paypal|24\/7|all platforms|priority support|custom integrations/);
    expect(isSellablePlanId("enterprise")).toBe(false);
    expect(isSellablePlanId("basic")).toBe(true);
  });
});
