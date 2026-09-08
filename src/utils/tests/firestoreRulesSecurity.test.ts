import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const rulesPath = path.resolve(process.cwd(), "firestore.rules");
const rules = fs.readFileSync(rulesPath, "utf8");

describe("Firestore security rules", () => {
  it("preserves user_id ownership when entries are updated", () => {
    const entryRules = rules.match(/match \/entries\/{docId} \{[\s\S]*?\n {4}\}/)?.[0] || "";

    expect(entryRules).toContain("allow update");
    expect(entryRules).toContain("request.resource.data.user_id == resource.data.user_id");
    expect(entryRules).toContain("resource.data.user_id == request.auth.uid");
  });

  it("preserves user_id ownership when action items are updated", () => {
    const actionItemRules = rules.match(/match \/action_items\/{docId} \{[\s\S]*?\n {4}\}/)?.[0] || "";

    expect(actionItemRules).toContain("allow update");
    expect(actionItemRules).toContain("request.resource.data.user_id == resource.data.user_id");
    expect(actionItemRules).toContain("resource.data.user_id == request.auth.uid");
  });

  it("keeps API key writes server-only", () => {
    const apiKeyRules = rules.match(/match \/api_keys\/{docId} \{[\s\S]*?\n {4}\}/)?.[0] || "";

    expect(apiKeyRules).toContain("allow create, update, delete: if false");
  });

  it("keeps Stripe and plan fields on users/{uid} server-owned", () => {
    const userRules = rules.match(/match \/users\/{userId} \{[\s\S]*?\n {4}\}/)?.[0] || "";

    expect(userRules).toContain("allow read: if isOwner(userId)");
    expect(userRules).toContain("stripeCustomerId");
    expect(userRules).toContain("subscriptionTier");
    expect(userRules).toContain("billingEntitlementVersion");
    expect(userRules).not.toMatch(/allow read, write: if isOwner\(userId\)/);
  });
});
