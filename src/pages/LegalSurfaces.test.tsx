import React from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import { KNOWN_PROCESSORS } from "@/content/legalContent";

const renderRoute = (component: React.ReactNode) => render(<MemoryRouter>{component}</MemoryRouter>);

beforeAll(() => { window.scrollTo = vi.fn(); });

describe("legal surfaces", () => {
  it("keeps the human legal-approval gate and accessible legal links visible", () => {
    renderRoute(<PrivacyPolicy />);
    expect(screen.getByRole("status").textContent).toMatch(/human legal approval required/i);
    expect(screen.getByRole("navigation", { name: "Legal documents" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Terms of Service" }).getAttribute("href")).toBe("/terms");
    expect(screen.getByRole("link", { name: "Privacy contact" }).getAttribute("href")).toMatch(/^mailto:/);
  });

  it.each(KNOWN_PROCESSORS)("does not lose known processor $name", ({ name }) => {
    renderRoute(<PrivacyPolicy />);
    expect((document.body.textContent || "").toLowerCase()).toContain(name.toLowerCase());
  });

  it("links terms back to the privacy draft and avoids unsupported commercial promises", () => {
    renderRoute(<TermsOfService />);
    expect(screen.getByRole("link", { name: "Privacy Policy" }).getAttribute("href")).toBe("/privacy");
    const text = document.body.textContent || "";
    expect(text).toContain("no paid trial");
    expect(text).toContain("Stripe-hosted card checkout");
    expect(text).not.toMatch(/PayPal|14-day trial|prorated refund|multi-factor authentication available/i);
  });
});
