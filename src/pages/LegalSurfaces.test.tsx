import React from "react";
import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import { KNOWN_PROCESSORS } from "@/content/legalContent";

const renderRoute = (component: React.ReactNode) => render(<MemoryRouter>{component}</MemoryRouter>);
const repoRoot = path.resolve(__dirname, "../..");
const readSource = (file: string) => fs.readFileSync(path.resolve(repoRoot, file), "utf8");

beforeAll(() => { window.scrollTo = vi.fn(); });

describe("effective legal surfaces", () => {
  it("preserves the previously effective privacy policy at /privacy", () => {
    renderRoute(<PrivacyPolicy />);
    expect(screen.getByRole("heading", { name: "Privacy Policy" })).toBeTruthy();
    expect(document.body.textContent).toContain("Effective Date: January 15, 2026");
    expect(document.body.textContent).not.toMatch(/SAVE-103 engineering draft|Pending legal approval/i);
  });

  it("preserves the previously effective terms at /terms", () => {
    renderRoute(<TermsOfService />);
    expect(screen.getByRole("heading", { name: "Terms of Service" })).toBeTruthy();
    expect(document.body.textContent).toContain("Effective Date: January 15, 2026");
    expect(document.body.textContent).not.toMatch(/SAVE-103 engineering draft|Pending legal approval/i);
  });

  it("does not expose unapproved draft content from public legal routes", () => {
    const publicRoutes = `${readSource("src/pages/PrivacyPolicy.tsx")}\n${readSource("src/pages/TermsOfService.tsx")}`;
    expect(publicRoutes).not.toContain("@/content/legalContent");
    for (const processor of KNOWN_PROCESSORS) {
      if (["OpenAI", "MiniMax", "GoatCounter", "Google Analytics", "Google Fonts"].includes(processor.name)) {
        expect(publicRoutes).not.toContain(processor.name);
      }
    }
  });
});

describe("internal legal review artifacts", () => {
  it("retains the gated draft metadata and processor review inventory", () => {
    const privacyDraft = readSource("PRIVACY_POLICY.md");
    const termsDraft = readSource("TERMS_OF_SERVICE.md");
    expect(`${privacyDraft}\n${termsDraft}`).toMatch(/Pending legal approval — not effective/);
    expect(`${privacyDraft}\n${termsDraft}`).toMatch(/must not be published or treated as effective/i);
    expect(KNOWN_PROCESSORS.length).toBeGreaterThan(0);
  });
});
