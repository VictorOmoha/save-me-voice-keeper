import { describe, expect, it } from "vitest";
import {
  getAllowedOrigin,
  getCheckoutPlanConfig,
  getPlanFromPriceId,
  sanitizeReturnUrl,
} from "./safety";

describe("billing safety helpers", () => {
  it("assigns the purchased tier using configured prices and rejects unknown prices", () => {
    const env = {STRIPE_BASIC_PRICE_ID: "price_real_basic", STRIPE_PREMIUM_PRICE_ID: "price_real_premium"};
    expect(getPlanFromPriceId("price_real_premium", env)).toBe("premium");
    expect(getPlanFromPriceId("price_real_basic", env)).toBe("basic");
    expect(getPlanFromPriceId("price_unknown", env)).toBe("free");
  });
  it("maps public plan names to server-owned Stripe price IDs", () => {
    const env = {
      STRIPE_BASIC_PRICE_ID: "price_basic_real",
      STRIPE_PREMIUM_PRICE_ID: "price_premium_real",
    };

    expect(getCheckoutPlanConfig("basic", env)).toEqual({ plan: "basic", priceId: "price_basic_real" });
    expect(getCheckoutPlanConfig("premium", env)).toEqual({ plan: "premium", priceId: "price_premium_real" });
    expect(getCheckoutPlanConfig("price_attacker", env)).toBeNull();
  });

  it("allowlists origins used for billing redirects and CORS", () => {
    expect(getAllowedOrigin("https://saveme.space")).toBe("https://saveme.space");
    expect(getAllowedOrigin("https://saveme-f5af0.web.app")).toBe("https://saveme-f5af0.web.app");
    expect(getAllowedOrigin("http://localhost:8080")).toBe("http://localhost:8080");
    expect(getAllowedOrigin("https://evil.example")).toBeNull();
  });

  it("sanitizes billing return URLs", () => {
    expect(sanitizeReturnUrl("https://saveme.space/settings", "https://saveme.space", "/settings")).toBe("https://saveme.space/settings");
    expect(sanitizeReturnUrl("https://evil.example/settings", "https://saveme.space", "/settings")).toBe("https://saveme.space/settings");
    expect(sanitizeReturnUrl(undefined, "https://evil.example", "/subscription")).toBe("https://saveme.space/subscription");
  });
});
