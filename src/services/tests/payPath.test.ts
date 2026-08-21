import {readFileSync} from "node:fs";
import {describe, expect, it} from "vitest";

const read = (relativePath: string) => readFileSync(relativePath, "utf8");

describe("pay-path wiring", () => {
  it("uses the shared Cloud Functions URL helper for checkout and portal", () => {
    const source = read("src/services/billingClient.ts");
    expect(source).toContain("getCloudFunctionsBaseUrl");
    expect(source).toContain('post("createCheckout"');
    expect(source).toContain('post("customerPortal"');
    expect(source).not.toMatch(/const baseUrl = import\.meta\.env\.VITE_CLOUD_FUNCTIONS_URL/);
  });

  it("settings billing opens Stripe instead of a stub toast", () => {
    const source = read("src/components/settings/SubscriptionSettings.tsx");
    expect(source).toContain("billingClient.createCheckout");
    expect(source).toContain("billingClient.createPortal");
    expect(source).not.toContain("Billing is not configured in this environment yet.");
    expect(source).not.toContain("14-day free trial");
    expect(source).not.toContain("Enterprise");
  });

  it("landing and subscription pages read the public catalog", () => {
    expect(read("src/pages/Index.tsx")).toContain("publicPlanCards");
    expect(read("src/pages/Subscription.tsx")).toContain("publicPlanCards");
    expect(read("src/pages/Index.tsx")).not.toContain("24/7 support");
    expect(read("src/pages/Index.tsx")).not.toContain("All platforms");
  });

  it("keeps production env files out of git", () => {
    const gitignore = read(".gitignore");
    expect(gitignore).toMatch(/^\.env\.production$/m);
    expect(gitignore).toMatch(/^!\.env\.example$/m);
    const exampleKeys = read(".env.example")
      .split("\n")
      .map((line) => line.match(/^(VITE_[A-Z0-9_]+)=/)?.[1])
      .filter((name): name is string => Boolean(name));
    expect(exampleKeys.every((name) =>
      name.startsWith("VITE_FIREBASE_") ||
      name === "VITE_CLOUD_FUNCTIONS_URL" ||
      name === "VITE_GOOGLE_CLOUD_API_KEY"
    )).toBe(true);
  });

  it("CI runs unit tests and deploy fail-closes without client secrets", () => {
    const ci = read(".github/workflows/ci.yml");
    const deploy = read(".github/workflows/deploy.yml");
    expect(ci).toContain("npm test");
    expect(ci).toContain("npm --prefix functions test");
    expect(read("vitest.config.ts")).toContain('"**/functions/**"');
    expect(deploy).toContain("scripts/assert-production-env.mjs");
    expect(deploy).toContain("firebase deploy --only functions");
    expect(deploy).toContain("secrets.VITE_FIREBASE_API_KEY");
  });
});
