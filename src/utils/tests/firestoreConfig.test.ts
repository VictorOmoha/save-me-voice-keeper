import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(__dirname, "../../..");

const readRepoFile = (relativePath: string) =>
  readFileSync(resolve(repoRoot, relativePath), "utf8").replace(/\r\n?/g, "\n");

describe("Firestore production config", () => {
  it("allows authenticated users to create their own task reminders", () => {
    const rules = readRepoFile("firestore.rules");

    expect(rules).toContain("match /reminders/{docId}");
    expect(rules).toContain("allow create: if isSignedIn()\n        && request.resource.data.user_id == request.auth.uid");
  });

  it("allows users to dismiss only their own pending notifications", () => {
    const rules = readRepoFile("firestore.rules");

    expect(rules).toContain("match /pending_notifications/{docId}");
    expect(rules).toContain("allow update: if isSignedIn()\n        && resource.data.user_id == request.auth.uid\n        && request.resource.data.user_id == resource.data.user_id");
  });

  it("declares the pending notifications listener composite index", () => {
    const indexes = JSON.parse(readRepoFile("firestore.indexes.json"));

    expect(indexes.indexes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          collectionGroup: "pending_notifications",
          queryScope: "COLLECTION",
          fields: [
            { fieldPath: "user_id", order: "ASCENDING" },
            { fieldPath: "status", order: "ASCENDING" },
            { fieldPath: "created_at", order: "DESCENDING" },
          ],
        }),
      ])
    );
  });
});
