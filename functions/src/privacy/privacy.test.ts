import {describe, expect, it} from "vitest";
import {AccountDeletionService} from "./deletionService";
import {AsyncUserExportService, UserExportService} from "./exportService";
import {
  DeletionEffects,
  DeletionReceipt,
  DeletionStateStore,
  ExportJob,
  ExportJobStore,
  ExportSource,
  UserDataManifest,
} from "./models";

const NOW = Date.parse("2026-08-08T12:00:00.000Z");
const auth = (uid: string) => ({assertedUid: uid, authenticatedAtMs: NOW - 1000});

const manifest = (): UserDataManifest => ({
  schemaVersion: "1.0.0",
  entries: [
    {resourceType: "firestoreCollection", location: "entries", ownerSelector: "field:user_id", exportPolicy: "full", deletePolicy: "delete-doc", deleteOrder: 10, retentionPolicy: "none", verificationStatus: "verified-in-source"},
    {resourceType: "storagePrefix", location: "images/{uid}/*", ownerSelector: "field:user_id", exportPolicy: "presigned-urls", deletePolicy: "recursive-delete", deleteOrder: 30, retentionPolicy: "none", verificationStatus: "verified-in-source"},
    {resourceType: "firestoreCollection", location: "api_keys", ownerSelector: "field:user_id", exportPolicy: "metadata-only-no-hash", deletePolicy: "revoke-then-delete", deleteOrder: 94, retentionPolicy: "none", verificationStatus: "verified-in-source"},
    {resourceType: "authIdentity", location: "firebaseAuth:users/{uid}", ownerSelector: "serverOnly", exportPolicy: "full", deletePolicy: "delete-auth-user", deleteOrder: 100, retentionPolicy: "none", verificationStatus: "verified-in-source"},
  ],
});

class MemoryState implements DeletionStateStore {
  readonly receipts = new Map<string, DeletionReceipt>();
  async load(id: string) { return this.receipts.get(id) ?? null; }
  async save(receipt: DeletionReceipt) { this.receipts.set(receipt.operationId, structuredClone(receipt)); }
}

describe("SAVE-101 account deletion foundation", () => {
  it("resumes after a retryable failure and keeps Auth identity last", async () => {
    const state = new MemoryState();
    const calls: string[] = [];
    let failStorageOnce = true;
    const effects: DeletionEffects = {
      revokeAgentKeys: async () => { calls.push("revoke"); },
      stopScheduledEffects: async () => { calls.push("stop"); },
      purgeResource: async (_uid, entry) => {
        calls.push(entry.location);
        if (entry.resourceType === "storagePrefix" && failStorageOnce) {
          failStorageOnce = false;
          throw new Error("synthetic storage outage");
        }
      },
      deleteAuthIdentity: async () => { calls.push("auth"); },
    };
    const service = new AccountDeletionService(manifest(), state, effects, "test", () => NOW);
    const request = {operationId: "delete-1", uid: "user-a", auth: auth("user-a")};

    expect((await service.run(request)).status).toBe("retryable");
    expect(calls).toEqual(["revoke", "stop", "entries", "images/{uid}/*"]);
    expect((await service.run(request)).status).toBe("completed");
    expect(calls).toEqual(["revoke", "stop", "entries", "images/{uid}/*", "images/{uid}/*", "api_keys", "auth"]);

    await service.run(request);
    expect(calls[calls.length - 1]).toBe("auth");
    expect(calls.filter((call) => call === "auth")).toHaveLength(1);
  });

  it("lets a trusted worker resume an owner-bound receipt after recent auth becomes stale", async () => {
    const state = new MemoryState();
    let clock = NOW;
    let failOnce = true;
    const calls: string[] = [];
    const effects: DeletionEffects = {
      revokeAgentKeys: async () => { calls.push("revoke"); },
      stopScheduledEffects: async () => { calls.push("stop"); },
      purgeResource: async (_uid, entry) => {
        calls.push(entry.location);
        if (failOnce) {
          failOnce = false;
          throw new Error("synthetic retry");
        }
      },
      deleteAuthIdentity: async () => { calls.push("auth"); },
    };
    const service = new AccountDeletionService(manifest(), state, effects, "test", () => clock);
    const staleAuth = auth("user-a");

    expect((await service.run({operationId: "delete-stale", uid: "user-a", auth: staleAuth})).status).toBe("retryable");
    clock += 6 * 60 * 1000;
    await expect(service.run({operationId: "delete-stale", uid: "user-a", auth: staleAuth})).rejects.toThrow("recent authentication required");
    await expect(service.resume("missing", "user-a")).rejects.toThrow("not found");
    await expect(service.resume("delete-stale", "user-b")).rejects.toThrow("another user");
    expect((await service.resume("delete-stale", "user-a")).status).toBe("completed");
    expect(calls.filter((call) => call === "revoke")).toHaveLength(1);
    expect(calls[calls.length - 1]).toBe("auth");
  });

  it("binds idempotency state and recent-auth proof to one user", async () => {
    const state = new MemoryState();
    const touched = new Map<string, number>();
    const touch = (uid: string): void => { touched.set(uid, (touched.get(uid) ?? 0) + 1); };
    const effects: DeletionEffects = {
      revokeAgentKeys: async (uid) => touch(uid),
      stopScheduledEffects: async (uid) => touch(uid),
      purgeResource: async (uid) => touch(uid),
      deleteAuthIdentity: async (uid) => touch(uid),
    };
    const service = new AccountDeletionService(manifest(), state, effects, "emulator", () => NOW);
    await service.run({operationId: "same-id", uid: "user-a", auth: auth("user-a")});
    const firstRunTouches = touched.get("user-a");
    await service.run({operationId: "same-id", uid: "user-a", auth: auth("user-a")});
    expect(touched.get("user-a")).toBe(firstRunTouches);
    await expect(service.run({operationId: "same-id", uid: "user-b", auth: auth("user-b")})).rejects.toThrow("another user");
    await expect(service.run({operationId: "new-id", uid: "user-a", auth: auth("user-b")})).rejects.toThrow("uid mismatch");
    await expect(service.run({operationId: "stale-id", uid: "user-a", auth: {assertedUid: "user-a", authenticatedAtMs: NOW - 6 * 60 * 1000}})).rejects.toThrow("recent authentication required");
    expect(touched.has("user-b")).toBe(false);
  });

  it("fails closed on production or unknown manifest resources", () => {
    const state = new MemoryState();
    const effects: DeletionEffects = {revokeAgentKeys: async () => {}, stopScheduledEffects: async () => {}, purgeResource: async () => {}, deleteAuthIdentity: async () => {}};
    expect(() => new AccountDeletionService(manifest(), state, effects, "production")).toThrow("non-production");
    const bad = manifest();
    bad.entries[0].verificationStatus = "unknown";
    expect(() => new AccountDeletionService(bad, state, effects, "test")).toThrow("unverified");
  });
});

describe("SAVE-102 export archive foundation", () => {
  it("builds v1 checksummed archive, redacts key secrets, and expires in seven days", async () => {
    const source: ExportSource = {
      readResource: async (uid, entry) => entry.location === "api_keys" ? [{id: "key-1", data: {user_id: uid, name: "Agent", key_prefix: "sm_safe...", key_hash: "SECRET", api_key: "SECRET", permissions: ["read"]}}] : [{id: "one", data: {user_id: uid, value: "synthetic", nested: {token: "SECRET"}}}],
      readOriginalFiles: async (uid) => [{path: `${uid}/photo.txt`, mediaType: "text/plain", contentBase64: Buffer.from("synthetic original").toString("base64")}],
    };
    const service = new UserExportService(manifest(), source, "test", () => NOW);
    const archive = await service.create({archiveId: "export-1", requesterUid: "user-a", ownerUid: "user-a", auth: auth("user-a")});

    expect(archive.schema).toBe("save-me.export/v1");
    expect(Date.parse(archive.expiresAt) - Date.parse(archive.createdAt)).toBe(7 * 24 * 60 * 60 * 1000);
    expect(archive.files.every((file) => /^[a-f0-9]{64}$/.test(file.sha256))).toBe(true);
    expect(archive.files.map((file) => file.content).join("\n")).not.toContain("SECRET");
    expect(archive.files.map((file) => file.content).join("\n")).toContain("sm_safe...");
    expect(archive.files[0].path).toBe("ARCHIVE_MANIFEST.json");
    expect(archive.files[1].path).toBe("INDEX.md");
    expect(archive.manifest).toEqual({path: "ARCHIVE_MANIFEST.json", schemaVersion: "1.0.0", sourceManifestVersion: "1.0.0"});
    service.assertCanAccess(archive, "user-a");
    expect(() => service.assertCanAccess(archive, "user-b")).toThrow("cross-user");
  });

  it("denies cross-user export creation before reading data", async () => {
    let reads = 0;
    const service = new UserExportService(manifest(), {readResource: async () => { reads += 1; return []; }}, "emulator", () => NOW);
    await expect(service.create({archiveId: "export-x", requesterUid: "user-b", ownerUid: "user-a", auth: auth("user-b")})).rejects.toThrow("cross-user");
    expect(reads).toBe(0);
  });

  it("rejects traversal and backslash paths from original-file adapters", async () => {
    for (const unsafePath of ["../secret.txt", "folder/../secret.txt", "folder\\secret.txt", "/absolute.txt", "folder//empty.txt"]) {
      const source: ExportSource = {
        readResource: async () => [],
        readOriginalFiles: async () => [{path: unsafePath, mediaType: "text/plain", contentBase64: Buffer.from("x").toString("base64")}],
      };
      const service = new UserExportService(manifest(), source, "test", () => NOW);
      await expect(service.create({archiveId: `unsafe-${unsafePath}`, requesterUid: "user-a", ownerUid: "user-a", auth: auth("user-a")})).rejects.toThrow("unsafe original file path");
    }
  });

  it("models asynchronous idempotent archive creation, retry state, isolation, and expiry", async () => {
    class MemoryJobs implements ExportJobStore {
      readonly jobs = new Map<string, ExportJob>();
      async load(id: string) { return this.jobs.get(id) ?? null; }
      async save(job: ExportJob) { this.jobs.set(job.archiveId, structuredClone(job)); }
    }
    let clock = NOW;
    let reads = 0;
    const source: ExportSource = {
      readResource: async (uid) => {
        reads += 1;
        if (reads === 1) throw new Error("synthetic source outage");
        return [{id: "owned", data: {user_id: uid}}];
      },
      readOriginalFiles: async () => [],
    };
    const jobs = new MemoryJobs();
    const exporter = new UserExportService(manifest(), source, "test", () => clock);
    const asyncService = new AsyncUserExportService(jobs, exporter, "test", () => clock);
    const request = {archiveId: "async-1", requesterUid: "user-a", ownerUid: "user-a", auth: auth("user-a")};

    expect((await asyncService.run(request)).status).toBe("retryable");
    const completed = await asyncService.run(request);
    expect(completed.status).toBe("completed");
    expect(completed.attempts).toBe(2);
    expect((await asyncService.run(request)).attempts).toBe(2);
    await expect(asyncService.get("async-1", "user-b")).rejects.toThrow("access denied");
    clock = Date.parse(completed.expiresAt);
    expect((await asyncService.get("async-1", "user-a")).status).toBe("expired");
    expect((await asyncService.get("async-1", "user-a")).archive).toBeUndefined();
  });

  it("lets a trusted worker resume an owner-bound export job after recent auth becomes stale", async () => {
    class MemoryJobs implements ExportJobStore {
      readonly jobs = new Map<string, ExportJob>();
      async load(id: string) { return this.jobs.get(id) ?? null; }
      async save(job: ExportJob) { this.jobs.set(job.archiveId, structuredClone(job)); }
    }
    let clock = NOW;
    let reads = 0;
    const jobs = new MemoryJobs();
    const exporter = new UserExportService(manifest(), {
      readResource: async (uid) => {
        reads += 1;
        if (reads === 1) throw new Error("synthetic retry");
        return [{id: "owned", data: {user_id: uid}}];
      },
      readOriginalFiles: async () => [],
    }, "test", () => clock);
    const asyncService = new AsyncUserExportService(jobs, exporter, "test", () => clock);
    const staleRequest = {archiveId: "async-stale", requesterUid: "user-a", ownerUid: "user-a", auth: auth("user-a")};

    expect((await asyncService.run(staleRequest)).status).toBe("retryable");
    clock += 6 * 60 * 1000;
    await expect(asyncService.run(staleRequest)).rejects.toThrow("recent authentication required");
    await expect(asyncService.resume("missing", "user-a")).rejects.toThrow("not found");
    await expect(asyncService.resume("async-stale", "user-b")).rejects.toThrow("another user");
    const completed = await asyncService.resume("async-stale", "user-a");
    expect(completed.status).toBe("completed");
    expect(completed.attempts).toBe(2);
    expect(completed.archive?.ownerUid).toBe("user-a");
  });

  it("does not let the trusted exporter path be invoked without its internal capability", async () => {
    const exporter = new UserExportService(manifest(), {readResource: async () => []}, "test", () => NOW);
    await expect(exporter.createForTrustedWorker("new-export", "user-a", Symbol("untrusted"))).rejects.toThrow("trusted export worker required");
  });

  it("fails closed for unknown manifest policy configuration", () => {
    const bad = manifest();
    bad.entries[0].exportPolicy = "new-unreviewed-policy";
    expect(() => new UserExportService(bad, {readResource: async () => []}, "test")).toThrow("unknown manifest export policy");
  });
});
