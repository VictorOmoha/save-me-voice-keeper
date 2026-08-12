import {expect, test} from "vitest";
import {UserExportService} from "../../functions/src/privacy/exportService";
import {UserDataManifest} from "../../functions/src/privacy/models";

const manifest: UserDataManifest = {
  schemaVersion: "1.0.0",
  entries: [
    {resourceType: "firestoreCollection", location: "entries", ownerSelector: "field:user_id", exportPolicy: "full", deletePolicy: "delete-doc", deleteOrder: 10, retentionPolicy: "none", verificationStatus: "verified-in-source"},
    {resourceType: "authIdentity", location: "firebaseAuth:users/{uid}", ownerSelector: "serverOnly", exportPolicy: "full", deletePolicy: "delete-auth-user", deleteOrder: 100, retentionPolicy: "none", verificationStatus: "verified-in-source"},
  ],
};

// Collected by the emulator-only Vitest config. The source double deliberately
// rejects an owner mismatch, matching an Admin/Firestore adapter's required
// tenant predicate without reaching any production service.
test("privacy export adapter contract never reads another tenant", async () => {
  const now = Date.parse("2026-08-08T12:00:00.000Z");
  const seen: string[] = [];
  const service = new UserExportService(manifest, {
    readResource: async (uid) => {
      seen.push(uid);
      return [{id: "synthetic", data: {user_id: uid}}];
    },
  }, "emulator", () => now);

  await expect(service.create({
    archiveId: "emu-export-denied",
    requesterUid: "emu-tenant-b-00000000000000000002",
    ownerUid: "emu-tenant-a-00000000000000000001",
    auth: {assertedUid: "emu-tenant-b-00000000000000000002", authenticatedAtMs: now},
  })).rejects.toThrow("cross-user export denied");
  expect(seen).toEqual([]);
});
