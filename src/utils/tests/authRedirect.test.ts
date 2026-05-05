import { describe, expect, it } from "vitest";
import { resolvePostAuthDestination } from "@/utils/authRedirect";

describe("resolvePostAuthDestination", () => {
  it("allows known internal next destinations", () => {
    expect(resolvePostAuthDestination({ next: "/settings" })).toBe("/settings");
    expect(resolvePostAuthDestination({ next: "/subscription?plan=basic" })).toBe("/subscription?plan=basic");
  });

  it("rejects external and protocol-relative next destinations", () => {
    expect(resolvePostAuthDestination({ next: "https://evil.example/phish" })).toBe("/dashboard");
    expect(resolvePostAuthDestination({ next: "//evil.example/phish" })).toBe("/dashboard");
  });

  it("falls back to the requested plan only when no safe next destination exists", () => {
    expect(resolvePostAuthDestination({ requestedPlan: "basic" })).toBe("/subscription?plan=basic");
    expect(resolvePostAuthDestination({ requestedPlan: "premium" })).toBe("/subscription?plan=premium");
    expect(resolvePostAuthDestination({ requestedPlan: "enterprise" })).toBe("/dashboard");
  });
});
