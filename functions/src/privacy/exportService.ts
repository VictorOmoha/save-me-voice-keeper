import {createHash} from "crypto";
import {
  ExportArchiveFile,
  ExportArchiveV1,
  ExportJob,
  ExportJobStore,
  ExportRecord,
  ExportSource,
  RecentAuthProof,
  UserDataManifest,
  UserDataManifestEntry,
} from "./models";
import {assertNonProductionPrivacyEnvironment, assertRecentAuth, validateManifest} from "./safety";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const SECRET_FIELD = /(^|_)(secret|token|password|api_key|key_hash|private_key)$/i;

const stableJson = (value: unknown): string => {
  const normalize = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map(normalize);
    if (input && typeof input === "object") {
      return Object.fromEntries(Object.entries(input as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b)).map(([key, nested]) => [key, normalize(nested)]));
    }
    return input;
  };
  return `${JSON.stringify(normalize(value), null, 2)}\n`;
};

const sha256 = (content: string, encoding: "utf8" | "base64"): string =>
  createHash("sha256").update(content, encoding).digest("hex");

const archiveFile = (path: string, mediaType: string, content: string, encoding: "utf8" | "base64" = "utf8"): ExportArchiveFile => ({
  path, mediaType, encoding, content, sha256: sha256(content, encoding), sizeBytes: Buffer.byteLength(content, encoding),
});

const scrubSecrets = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(scrubSecrets);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !SECRET_FIELD.test(key)).map(([key, nested]) => [key, scrubSecrets(nested)]));
};

const sanitizeRecord = (entry: UserDataManifestEntry, record: ExportRecord): ExportRecord => {
  const scrubbed = scrubSecrets(record.data) as Record<string, unknown>;
  if (entry.location === "api_keys") {
    const safeFields = ["name", "agent_type", "agent_source", "key_prefix", "permissions", "is_active", "created_at", "last_used_at"];
    return {id: record.id, data: Object.fromEntries(safeFields.filter((key) => key in scrubbed).map((key) => [key, scrubbed[key]]))};
  }
  return {id: record.id, data: scrubbed};
};

const safePathSegment = (value: string): string => value.replace(/[^a-zA-Z0-9._-]/g, "_");

export interface CreateExportRequest {
  archiveId: string;
  requesterUid: string;
  ownerUid: string;
  auth: RecentAuthProof;
}

export class UserExportService {
  constructor(
    private readonly manifest: UserDataManifest,
    private readonly source: ExportSource,
    environment: string | undefined,
    private readonly now: () => number = Date.now
  ) {
    assertNonProductionPrivacyEnvironment(environment);
    validateManifest(manifest);
  }

  async create(request: CreateExportRequest): Promise<ExportArchiveV1> {
    if (request.requesterUid !== request.ownerUid) throw new Error("cross-user export denied");
    assertRecentAuth(request.ownerUid, request.auth, this.now());
    const exportEntries = this.manifest.entries
      .filter((entry) => !["not-applicable", "not-user-owned", "client-side-only"].includes(entry.exportPolicy))
      .filter((entry) => entry.ownerSelector !== "publicRead" && entry.ownerSelector !== "publicCreate")
      .sort((a, b) => a.location.localeCompare(b.location));
    const files: ExportArchiveFile[] = [];
    const resourceCounts: Record<string, number> = {};

    for (const entry of exportEntries) {
      const records = (await this.source.readResource(request.ownerUid, entry)).map((record) => sanitizeRecord(entry, record));
      resourceCounts[entry.location] = records.length;
      const content = stableJson({schema: "save-me.resource/v1", sourceManifestVersion: this.manifest.schemaVersion,
        resource: entry.location, resourceType: entry.resourceType, records});
      files.push(archiveFile(`data/${entry.resourceType}/${safePathSegment(entry.location)}.json`, "application/json", content));
      if (entry.resourceType === "storagePrefix") {
        if (!this.source.readOriginalFiles) throw new Error(`original-file export adapter missing for ${entry.location}`);
        const originals = await this.source.readOriginalFiles(request.ownerUid, entry);
        resourceCounts[`${entry.location}:originalFiles`] = originals.length;
        for (const original of originals) {
          const pathSegments = original.path.split("/");
          const unsafePath =
            original.path.startsWith("/") ||
            original.path.includes("\\") ||
            pathSegments.some((segment) => segment.length === 0 || segment === "." || segment === "..");
          if (unsafePath) throw new Error("unsafe original file path");
          files.push(archiveFile(`originals/${safePathSegment(entry.location)}/${original.path}`, original.mediaType, original.contentBase64, "base64"));
        }
      }
    }

    const createdAtMs = this.now();
    const createdAt = new Date(createdAtMs).toISOString();
    const expiresAt = new Date(createdAtMs + SEVEN_DAYS_MS).toISOString();
    const indexContent = ["# Save Me data export", "", `Archive: ${request.archiveId}`, `Created: ${createdAt}`,
      `Expires: ${expiresAt}`, "", "## Resources", ...Object.entries(resourceCounts).map(([location, count]) => `- ${location}: ${count}`), "",
      "JSON resources use save-me.resource/v1. Original uploaded files are under originals/.",
      "SHA-256 checksums and byte lengths are in ARCHIVE_MANIFEST.json.",
      "Credentials, key hashes, tokens, passwords, private keys, and BYOK secrets are excluded; agent keys contain safe metadata only.", ""].join("\n");
    files.unshift(archiveFile("INDEX.md", "text/markdown", indexContent));
    const archiveManifestContent = stableJson({schema: "save-me.archive-manifest/v1", schemaVersion: "1.0.0",
      sourceManifestVersion: this.manifest.schemaVersion, archiveId: request.archiveId, ownerUid: request.ownerUid, createdAt, expiresAt,
      files: files.map(({path, mediaType, encoding, sha256: checksum, sizeBytes}) => ({path, mediaType, encoding, sha256: checksum, sizeBytes}))});
    files.unshift(archiveFile("ARCHIVE_MANIFEST.json", "application/json", archiveManifestContent));
    return {schema: "save-me.export/v1", archiveId: request.archiveId, ownerUid: request.ownerUid, createdAt, expiresAt,
      manifest: {path: "ARCHIVE_MANIFEST.json", schemaVersion: "1.0.0", sourceManifestVersion: this.manifest.schemaVersion},
      files, index: {path: "INDEX.md", resourceCounts}};
  }

  assertCanAccess(archive: ExportArchiveV1, requesterUid: string): void {
    if (archive.ownerUid !== requesterUid) throw new Error("cross-user archive access denied");
    if (this.now() >= Date.parse(archive.expiresAt)) throw new Error("export archive expired");
  }
}

export class AsyncUserExportService {
  constructor(private readonly jobs: ExportJobStore, private readonly exporter: UserExportService,
    environment: string | undefined, private readonly now: () => number = Date.now) {
    assertNonProductionPrivacyEnvironment(environment);
  }

  async request(request: CreateExportRequest): Promise<ExportJob> {
    if (request.requesterUid !== request.ownerUid) throw new Error("cross-user export denied");
    assertRecentAuth(request.ownerUid, request.auth, this.now());
    const existing = await this.jobs.load(request.archiveId);
    if (existing) {
      if (existing.ownerUid !== request.ownerUid) throw new Error("export operation belongs to another user");
      return existing;
    }
    const createdAt = new Date(this.now()).toISOString();
    const job: ExportJob = {archiveId: request.archiveId, ownerUid: request.ownerUid, status: "pending", attempts: 0,
      createdAt, updatedAt: createdAt, expiresAt: new Date(this.now() + SEVEN_DAYS_MS).toISOString()};
    await this.jobs.save(job);
    return job;
  }

  async run(request: CreateExportRequest): Promise<ExportJob> {
    let job = await this.request(request);
    if (job.status === "completed" || job.status === "expired") return job;
    job = {...job, status: "running", attempts: job.attempts + 1, updatedAt: new Date(this.now()).toISOString()};
    delete job.lastError;
    await this.jobs.save(job);
    try {
      const archive = await this.exporter.create(request);
      job = {...job, status: "completed", archive, expiresAt: archive.expiresAt, updatedAt: new Date(this.now()).toISOString()};
    } catch (error) {
      job = {...job, status: "retryable", lastError: error instanceof Error ? error.message : "unknown export error",
        updatedAt: new Date(this.now()).toISOString()};
    }
    await this.jobs.save(job);
    return job;
  }

  async get(archiveId: string, requesterUid: string): Promise<ExportJob> {
    const job = await this.jobs.load(archiveId);
    if (!job || job.ownerUid !== requesterUid) throw new Error("export job access denied");
    if (this.now() >= Date.parse(job.expiresAt)) {
      const expired = {...job, status: "expired" as const, archive: undefined, updatedAt: new Date(this.now()).toISOString()};
      await this.jobs.save(expired);
      return expired;
    }
    return job;
  }
}
