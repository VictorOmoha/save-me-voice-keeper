/**
 * SAVE-005 — Emulator seed.
 *
 * Seeds the Firebase emulator suite with a known, synthetic multi-tenant state:
 *   - two regular users (tenant A, tenant B)
 *   - one admin user
 *   - one read-only agent API key (for tenant A)
 *   - one read/write agent API key (for tenant A)
 *
 * SYNTHETIC DATA ONLY. All values are invented; agent key hashes are canaries.
 *
 * Entry point contract (consumed by Vector Platform's CI lane):
 *   - Exports `seedEmulator(): Promise<SeedResult>`.
 *   - Runnable directly: `npx tsx test/emulator/seed.ts`
 *     (or via the root script Vector wires up).
 *   - Requires the emulator suite to be running; `assertEmulatorOnly()` is
 *     called first and will abort on any production-shaped environment.
 *
 * Env var contract (see docs/hardening/emulator-harness.md):
 *   FIRESTORE_EMULATOR_HOST, FIREBASE_AUTH_EMULATOR_HOST,
 *   FIREBASE_STORAGE_EMULATOR_HOST, FUNCTIONS_EMULATOR_HOST (optional)
 *   EMULATOR_PROJECT_ID (optional; defaults to "demo-saveme")
 */

import { assertEmulatorOnly } from "./emulator-guard";

// Synthetic identifiers — stable across runs so tests can assert against them.
export const TENANT_A_UID = "emu-tenant-a-00000000000000000001";
export const TENANT_B_UID = "emu-tenant-b-00000000000000000002";
export const ADMIN_UID = "emu-admin-000000000000000000000003";

export const TENANT_A_EMAIL = "tenant.a@emulator.invalid";
export const TENANT_B_EMAIL = "tenant.b@emulator.invalid";
export const ADMIN_EMAIL = "admin@emulator.invalid";

/** SHA-256 canary hashes — NOT real keys. */
export const AGENT_KEY_RO_HASH =
  "11111111111111111111111111111111111111111111111111111111111111aa";
export const AGENT_KEY_RW_HASH =
  "22222222222222222222222222222222222222222222222222222222222222bb";

export interface SeedResult {
  projectId: string;
  tenants: { a: string; b: string; admin: string };
  agentKeys: { readOnly: string; readWrite: string };
}

/**
 * Seed the emulator. Uses the Firebase Admin SDK pointed at the emulator hosts.
 * The Admin SDK is imported lazily so this module can be type-checked without a
 * live emulator.
 */
export async function seedEmulator(): Promise<SeedResult> {
  const projectId = assertEmulatorOnly({
    projectId: process.env.EMULATOR_PROJECT_ID ?? "demo-saveme",
  });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const admin = await import("firebase-admin");

  if (admin.apps.length === 0) {
    admin.initializeApp({ projectId });
  }
  const db = admin.firestore();
  const auth = admin.auth();
  const now = admin.firestore.FieldValue.serverTimestamp();

  // ── Auth users ────────────────────────────────────────────────────────────
  const ensureUser = async (uid: string, email: string, displayName: string) => {
    try {
      await auth.getUser(uid);
    } catch {
      await auth.createUser({ uid, email, displayName });
    }
  };
  await ensureUser(TENANT_A_UID, TENANT_A_EMAIL, "Tenant A");
  await ensureUser(TENANT_B_UID, TENANT_B_EMAIL, "Tenant B");
  await ensureUser(ADMIN_UID, ADMIN_EMAIL, "Admin");

  // ── users docs ────────────────────────────────────────────────────────────
  await db.collection("users").doc(TENANT_A_UID).set({
    email: TENANT_A_EMAIL,
    subscriptionStatus: "active",
    subscriptionTier: "premium",
    created_at: now,
    updated_at: now,
  });
  await db.collection("users").doc(TENANT_B_UID).set({
    email: TENANT_B_EMAIL,
    subscriptionStatus: "active",
    subscriptionTier: "free",
    created_at: now,
    updated_at: now,
  });
  await db.collection("users").doc(ADMIN_UID).set({
    email: ADMIN_EMAIL,
    role: "admin",
    created_at: now,
    updated_at: now,
  });

  // ── Per-tenant entries (for tenant-isolation tests) ───────────────────────
  await db.collection("entries").doc("seed-entry-a-001").set({
    title: "Tenant A entry",
    fields: { content: "Tenant A synthetic content", category: "Work" },
    category: "Work",
    user_id: TENANT_A_UID,
    created_at: now,
    updated_at: now,
  });
  await db.collection("entries").doc("seed-entry-b-001").set({
    title: "Tenant B entry",
    fields: { content: "Tenant B synthetic content", category: "Personal" },
    category: "Personal",
    user_id: TENANT_B_UID,
    created_at: now,
    updated_at: now,
  });

  // ── Agent API keys (tenant A): one read-only, one read/write ─────────────
  await db.collection("api_keys").doc("seed-key-ro-001").set({
    user_id: TENANT_A_UID,
    name: "Seed read-only key",
    agent_type: "custom",
    agent_source: "custom_agent",
    key_hash: AGENT_KEY_RO_HASH,
    key_prefix: "sm_seedro...",
    permissions: ["read"],
    is_active: true,
    created_at: now,
  });
  await db.collection("api_keys").doc("seed-key-rw-001").set({
    user_id: TENANT_A_UID,
    name: "Seed read-write key",
    agent_type: "custom",
    agent_source: "custom_agent",
    key_hash: AGENT_KEY_RW_HASH,
    key_prefix: "sm_seedrw...",
    permissions: ["read", "write"],
    is_active: true,
    created_at: now,
  });

  return {
    projectId,
    tenants: { a: TENANT_A_UID, b: TENANT_B_UID, admin: ADMIN_UID },
    agentKeys: { readOnly: "seed-key-ro-001", readWrite: "seed-key-rw-001" },
  };
}

// Allow direct execution: `npx tsx test/emulator/seed.ts`.
// SAVE-005 remediation: the frozen ref used `if (require.main === module)`,
// but this package is `"type": "module"`, so `require` is undefined at module
// scope and that line throws ReferenceError under any ESM TS runner — the seed
// could never self-execute. Use the ESM-correct entry check instead: compare
// the invoked script path (process.argv[1]) against this module's file URL.
import { fileURLToPath } from "node:url";
import path from "node:path";

const invokedAsScript = (() => {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return path.resolve(entry) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
})();

if (invokedAsScript) {
  seedEmulator()
    .then((r) => {
      // eslint-disable-next-line no-console
      console.log("[seed] emulator seeded:", JSON.stringify(r, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error("[seed] failed:", err);
      process.exit(1);
    });
}
