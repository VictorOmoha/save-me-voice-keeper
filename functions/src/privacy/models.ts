export type PrivacyEnvironment = "test" | "emulator";

export type ManifestResourceType =
  | "firestoreCollection"
  | "storagePrefix"
  | "authIdentity"
  | "billingLinkage"
  | "browserStore"
  | "extensionStorage"
  | "logSink";

export type OwnerSelector =
  | "field:user_id"
  | "docIdEqualsUid"
  | "serverOnly"
  | "publicRead"
  | "publicCreate";

export interface UserDataManifestEntry {
  resourceType: ManifestResourceType;
  location: string;
  ownerSelector: OwnerSelector;
  exportPolicy: string;
  deletePolicy: string;
  deleteOrder: number;
  retentionPolicy: string;
  verificationStatus: string;
}

export interface UserDataManifest {
  schemaVersion: string;
  entries: UserDataManifestEntry[];
}

export interface RecentAuthProof {
  authenticatedAtMs: number;
  assertedUid: string;
}

export interface DeletionReceipt {
  operationId: string;
  uid: string;
  status: "pending" | "retryable" | "completed";
  completedSteps: string[];
  attempts: number;
  lastError?: string;
  updatedAt: string;
}

export interface DeletionStateStore {
  load(operationId: string): Promise<DeletionReceipt | null>;
  save(receipt: DeletionReceipt): Promise<void>;
}

export interface DeletionEffects {
  revokeAgentKeys(uid: string): Promise<void>;
  stopScheduledEffects(uid: string): Promise<void>;
  purgeResource(uid: string, entry: UserDataManifestEntry): Promise<void>;
  deleteAuthIdentity(uid: string): Promise<void>;
}

export interface ExportRecord {
  id: string;
  data: Record<string, unknown>;
}

export interface ExportOriginalFile {
  path: string;
  mediaType: string;
  contentBase64: string;
}

export interface ExportSource {
  readResource(uid: string, entry: UserDataManifestEntry): Promise<ExportRecord[]>;
  readOriginalFiles?(uid: string, entry: UserDataManifestEntry): Promise<ExportOriginalFile[]>;
}

export interface ExportArchiveFile {
  path: string;
  mediaType: string;
  encoding: "utf8" | "base64";
  content: string;
  sha256: string;
  sizeBytes: number;
}

export interface ExportArchiveV1 {
  schema: "save-me.export/v1";
  archiveId: string;
  ownerUid: string;
  createdAt: string;
  expiresAt: string;
  manifest: {
    path: "ARCHIVE_MANIFEST.json";
    schemaVersion: "1.0.0";
    sourceManifestVersion: string;
  };
  files: ExportArchiveFile[];
  index: {
    path: "INDEX.md";
    resourceCounts: Record<string, number>;
  };
}

export interface ExportJob {
  archiveId: string;
  ownerUid: string;
  status: "pending" | "running" | "retryable" | "completed" | "expired";
  attempts: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  lastError?: string;
  archive?: ExportArchiveV1;
}

export interface ExportJobStore {
  load(archiveId: string): Promise<ExportJob | null>;
  save(job: ExportJob): Promise<void>;
}
