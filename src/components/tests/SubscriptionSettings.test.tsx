import React from "react";
import {describe, expect, it, vi} from "vitest";
import {render, screen} from "@testing-library/react";
import {SubscriptionSettings} from "@/components/settings/SubscriptionSettings";

vi.mock("sonner", () => ({
  toast: {error: vi.fn(), info: vi.fn(), success: vi.fn()},
}));

vi.mock("@/lib/analytics", () => ({
  trackActivationEvent: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: {subscriptionTier: "free", subscriptionActive: false},
  }),
}));

vi.mock("@/services/billingClient", () => ({
  billingClient: {
    createCheckout: vi.fn(),
    createPortal: vi.fn(),
  },
}));

describe("SubscriptionSettings", () => {
  it("shows the launch catalog and a working checkout CTA", () => {
    render(<SubscriptionSettings />);
    expect(screen.getByText("Current Plan")).toBeTruthy();
    expect(screen.getByText("Open Basic")).toBeTruthy();
    expect(screen.getByText("Open Premium")).toBeTruthy();
    expect(screen.getByText("Open Billing Portal")).toBeTruthy();
    expect(screen.queryByText("Enterprise")).toBeNull();
    expect(screen.queryByText(/14-day/i)).toBeNull();
  });
});
