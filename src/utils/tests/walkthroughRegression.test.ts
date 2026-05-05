import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.resolve(repoRoot, relativePath), "utf8");
const block = (source: string, marker: string) => {
  const start = source.indexOf(marker);
  if (start === -1) return "";
  const nextMethod = source.indexOf("\n  async ", start + marker.length);
  return source.slice(start, nextMethod === -1 ? undefined : nextMethod);
};

describe("walkthrough video regressions", () => {
  it("allows signed-in users to read only their own storage usage document", () => {
    const rules = read("firestore.rules");
    const storageUsageRules = rules.match(/match \/storage_usage\/{docId} \{[\s\S]*?\n {4}\}/)?.[0] || "";

    expect(storageUsageRules).toContain("allow read");
    expect(storageUsageRules).toContain("docId == request.auth.uid");
    expect(storageUsageRules).toContain("resource.data.user_id == request.auth.uid");
    expect(storageUsageRules).toContain("allow create, update, delete: if false");
  });

  it("scopes popular search reads to the current user so Firestore rules can allow the query", () => {
    const source = read("src/services/searchAnalytics.ts");
    const indexes = read("firestore.indexes.json");
    const popularSearches = block(source, "async getPopularSearches");

    expect(popularSearches).toContain("where('user_id', '==', user.uid)");
    expect(popularSearches.indexOf("where('user_id', '==', user.uid)")).toBeLessThan(
      popularSearches.indexOf("orderBy('created_at', 'desc')")
    );
    expect(indexes).toContain('"collectionGroup": "search_analytics"');
    expect(indexes).toContain('"fieldPath": "user_id"');
    expect(indexes).toContain('"fieldPath": "created_at"');
  });

  it("does not ship walkthrough-visible voice/form debug logs in production paths", () => {
    const debugSources = [
      "src/hooks/useVoiceAgent.ts",
      "src/contexts/VoiceFormContext.tsx",
      "src/components/DataEntryForm.tsx",
      "src/components/forms/useFormLogic.ts",
    ];

    for (const relativePath of debugSources) {
      const source = read(relativePath);
      expect(source, relativePath).not.toMatch(/console\.log\(/);
    }
  });

  it("adds browser autocomplete hints to auth form inputs", () => {
    const login = read("src/pages/Login.tsx");
    const signup = read("src/pages/Signup.tsx");

    expect(login).toContain('autoComplete="email"');
    expect(login).toContain('autoComplete="current-password"');
    expect(signup).toContain('autoComplete="name"');
    expect(signup).toContain('autoComplete="email"');
    expect(signup).toContain('autoComplete="new-password"');
  });
});
