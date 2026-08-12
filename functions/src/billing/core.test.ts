import {describe, expect, it} from "vitest";
import {BillingConfigurationError, customerBelongsToUser, loadPriceCatalog, normalizeLifecycle, planForPrice} from "./core";

const env = {
  STRIPE_MODE: "test",
  STRIPE_TEST_BASIC_MONTHLY_PRICE_ID: "price_test_basic_immutable",
  STRIPE_TEST_PREMIUM_MONTHLY_PRICE_ID: "price_test_premium_immutable",
};
const catalog = loadPriceCatalog(env);
const event = (overrides: Record<string, unknown> = {}) => ({
  id: "evt_1", created: 100, type: "customer.subscription.updated", status: "active",
  priceId: "price_test_basic_immutable", customerId: "cus_1", subscriptionId: "sub_1", ...overrides,
});

describe("SAVE-106 billing core", () => {
  it("maps configured immutable test prices to D-004 plans", () => {
    expect(planForPrice("price_test_basic_immutable", catalog)).toBe("basic");
    expect(planForPrice("price_test_premium_immutable", catalog)).toBe("premium");
    expect(normalizeLifecycle("u1", event(), catalog).plan).toBe("basic");
  });

  it("fails closed for unconfigured and unknown prices", () => {
    expect(() => loadPriceCatalog({STRIPE_MODE: "test"})).toThrow(BillingConfigurationError);
    const result = normalizeLifecycle("u1", event({priceId: "price_unknown"}), catalog);
    expect(result).toMatchObject({plan: "free", entitled: false, status: "active"});
    expect(result.mappingError).toContain("price_unknown");
  });

  it("is stable for duplicate normalization", () => {
    const first = normalizeLifecycle("u1", event(), catalog);
    expect(normalizeLifecycle("u1", event(), catalog, first)).toEqual(first);
  });

  it("ignores an out-of-order update", () => {
    const current = normalizeLifecycle("u1", event({id: "evt_new", created: 200, priceId: "price_test_premium_immutable"}), catalog);
    const stale = normalizeLifecycle("u1", event({id: "evt_old", created: 199}), catalog, current);
    expect(stale).toBe(current);
    expect(stale.plan).toBe("premium");
  });

  it("retains paid entitlement during payment failure grace", () => {
    const active = normalizeLifecycle("u1", event(), catalog);
    const failed = normalizeLifecycle("u1", event({id: "evt_fail", created: 101, type: "invoice.payment_failed", status: undefined, priceId: undefined}), catalog, active);
    expect(failed).toMatchObject({plan: "basic", status: "past_due", entitled: true});
  });

  it("cancellation safely downgrades to free", () => {
    const active = normalizeLifecycle("u1", event(), catalog);
    const canceled = normalizeLifecycle("u1", event({id: "evt_cancel", created: 101, type: "customer.subscription.deleted", status: "canceled"}), catalog, active);
    expect(canceled).toMatchObject({plan: "free", status: "canceled", entitled: false});
  });

  it("requires portal/checkout customer ownership metadata", () => {
    expect(customerBelongsToUser({metadata: {firebaseUserId: "u1"}}, "u1")).toBe(true);
    expect(customerBelongsToUser({metadata: {firebaseUserId: "attacker"}}, "u1")).toBe(false);
    expect(customerBelongsToUser({deleted: true, metadata: {firebaseUserId: "u1"}}, "u1")).toBe(false);
  });
});
