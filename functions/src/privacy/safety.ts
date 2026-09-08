import {PrivacyEnvironment, UserDataManifest, UserDataManifestEntry} from "./models";

const KNOWN_RESOURCE_TYPES = new Set([
  "firestoreCollection",
  "storagePrefix",
  "authIdentity",
  "billingLinkage",
  "browserStore",
  "extensionStorage",
  "logSink",
]);
const KNOWN_OWNER_SELECTORS = new Set([
  "field:user_id",
  "docIdEqualsUid",
  "serverOnly",
  "publicRead",
  "publicCreate",
]);
const KNOWN_EXPORT_POLICIES = new Set([
  "full",
  "full-excluding-byok-key",
  "full-excluding-secrets",
  "metadata-only-no-hash",
  "not-applicable",
  "not-user-owned",
  "presigned-urls",
  "client-side-only",
]);
const KNOWN_DELETE_POLICIES = new Set([
  "add-revocation-endpoint-then-delete",
  "cancel-subscription-delete-customer",
  "cascade-derived-and-storage",
  "clear-on-logout",
  "delete-all-user-docs",
  "delete-auth-user",
  "delete-doc",
  "delete-doc-cancel-stripe-delete-auth",
  "delete-doc-retract-on-forget",
  "delete-doc-scrub-byok",
  "delete-with-either-endpoint",
  "delete-with-owning-entry",
  "hard-purge-and-retract-mirror",
  "not-applicable",
  "recompute-or-delete",
  "recursive-delete",
  "retention-policy-gcp",
  "revoke-on-account-deletion",
  // Test-only shorthand retained for small domain fixtures.
  "revoke-then-delete",
]);
const KNOWN_VERIFICATION_STATUSES = new Set(["verified-in-source"]);

export const assertNonProductionPrivacyEnvironment = (
  environment: string | undefined
): PrivacyEnvironment => {
  if (environment !== "test" && environment !== "emulator") {
    throw new Error("privacy services are non-production only and fail closed");
  }
  return environment;
};

export const assertRecentAuth = (
  uid: string,
  proof: {authenticatedAtMs: number; assertedUid: string},
  nowMs: number,
  maxAgeMs = 5 * 60 * 1000
): void => {
  if (proof.assertedUid !== uid) throw new Error("recent-auth uid mismatch");
  const age = nowMs - proof.authenticatedAtMs;
  if (!Number.isFinite(age) || age < 0 || age > maxAgeMs) {
    throw new Error("recent authentication required");
  }
};

const assertKnownEntry = (entry: UserDataManifestEntry): void => {
  if (!KNOWN_RESOURCE_TYPES.has(entry.resourceType)) {
    throw new Error(`unknown manifest resource type: ${entry.resourceType}`);
  }
  if (!KNOWN_OWNER_SELECTORS.has(entry.ownerSelector)) {
    throw new Error(`unknown manifest owner selector: ${entry.ownerSelector}`);
  }
  if (!KNOWN_EXPORT_POLICIES.has(entry.exportPolicy)) {
    throw new Error(`unknown manifest export policy for ${entry.location}: ${entry.exportPolicy}`);
  }
  if (!KNOWN_DELETE_POLICIES.has(entry.deletePolicy)) {
    throw new Error(`unknown manifest delete policy for ${entry.location}: ${entry.deletePolicy}`);
  }
  if (!KNOWN_VERIFICATION_STATUSES.has(entry.verificationStatus)) {
    throw new Error(`unverified manifest resource: ${entry.location}`);
  }
  if (!Number.isInteger(entry.deleteOrder) || entry.deleteOrder < 0) {
    throw new Error(`invalid delete order for ${entry.location}`);
  }
};

export const validateManifest = (manifest: UserDataManifest): void => {
  if (manifest.schemaVersion !== "1.0.0") {
    throw new Error(`unsupported manifest schema: ${manifest.schemaVersion}`);
  }
  const locations = new Set<string>();
  for (const entry of manifest.entries) {
    assertKnownEntry(entry);
    if (locations.has(entry.location)) throw new Error(`duplicate manifest resource: ${entry.location}`);
    locations.add(entry.location);
  }
};

export const isServerActionable = (entry: UserDataManifestEntry): boolean =>
  entry.deleteOrder > 0 &&
  entry.deletePolicy !== "not-applicable" &&
  entry.ownerSelector !== "publicRead" &&
  entry.ownerSelector !== "publicCreate" &&
  entry.resourceType !== "browserStore" &&
  entry.resourceType !== "extensionStorage" &&
  entry.resourceType !== "logSink";
