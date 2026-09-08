import { describe, expect, it } from "vitest";
import {
  getAllowedOrigin,
  getCheckoutPlanConfig,
  sanitizeReturnUrl,
} from "./safety";

describe("billing safety helpers", () => {
  it("maps public plan names to server-owned Stripe price IDs", () => {
    const env = {
      STRIPE_MODE: "test",
      STRIPE_TEST_BASIC_MONTHLY_PRICE_ID: "price_basic_real",
      STRIPE_TEST_PREMIUM_MONTHLY_PRICE_ID: "price_premium_real",
    };

    expect(getCheckoutPlanConfig("basic", env)).toEqual({ plan: "basic", priceId: "price_basic_real" });
    expect(getCheckoutPlanConfig("premium", env)).toEqual({ plan: "premium", priceId: "price_premium_real" });
    expect(getCheckoutPlanConfig("price_attacker", env)).toBeNull();
  });

  it("allowlists origins used for billing redirects and CORS", () => {
    expect(getAllowedOrigin("https://saveme.space")).toBe("https://saveme.space");
    expect(getAllowedOrigin("https://saveme-f5af0.web.app")).toBe("https://saveme-f5af0.web.app");
    expect(getAllowedOrigin("https://evil.example")).toBeNull();
  });

  it("sanitizes billing return URLs", () => {
    expect(sanitizeReturnUrl("https://saveme.space/settings", "https://saveme.space", "/settings")).toBe("https://saveme.space/settings");
    expect(sanitizeReturnUrl("https://evil.example/settings", "https://saveme.space", "/settings")).toBe("https://saveme.space/settings");
    expect(sanitizeReturnUrl(undefined, "https://evil.example", "/subscription")).toBe("https://saveme.space/subscription");
  });
});
