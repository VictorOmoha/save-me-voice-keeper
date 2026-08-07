/**
 * SAVE-005 — Tenant-isolation rule tests.
 *
 * Asserts same-user allow / cross-user deny against the ACTUAL `firestore.rules`
 * at baseline, using @firebase/rules-unit-testing against the Firestore
 * emulator. Rules are never weakened to make these pass.
 *
 * Requires the Firestore emulator to be running. `assertEmulatorOnly()` guards
 * against accidentally targeting production.
 *
 * These tests assume the seed in `test/emulator/seed.ts` has run (tenant A and
 * tenant B each own an `entries` doc; tenant A owns agent keys).
 */

import { assertEmulatorOnly } from "./emulator-guard";
import {
  TENANT_A_UID,
  TENANT_B_UID,
} from "./seed";

// @firebase/rules-unit-testing is a devDependency provided by the harness
// (Vector wires installation + CI invocation; see emulator-harness.md).
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import fs from "node:fs";
import path from "node:path";

const PROJECT_ID = process.env.EMULATOR_PROJECT_ID ?? "demo-saveme";
const RULES_PATH = path.resolve(process.cwd(), "firestore.rules");

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  assertEmulatorOnly({ projectId: PROJECT_ID });
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync(RULES_PATH, "utf8"),
      host: "127.0.0.1",
      port: Number(process.env.FIRESTORE_EMULATOR_PORT ?? 8080),
    },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

afterEach(async () => {
  await testEnv?.clearFirestore();
});

// Re-seed the minimal docs each test needs (independent of seed.ts runtime).
async function seedMinimal() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "entries", "entry-a"), {
      title: "A",
      user_id: TENANT_A_UID,
      fields: { content: "a", category: "Work" },
    });
    await setDoc(doc(db, "entries", "entry-b"), {
      title: "B",
      user_id: TENANT_B_UID,
      fields: { content: "b", category: "Personal" },
    });
    await setDoc(doc(db, "api_keys", "key-a"), {
      user_id: TENANT_A_UID,
      key_hash: "canary",
      is_active: true,
      permissions: ["read"],
    });
  });
}

describe("tenant isolation — entries", () => {
  beforeEach(seedMinimal);

  it("allows the owner to read their own entry", async () => {
    const ctx = testEnv.authenticatedContext(TENANT_A_UID);
    await assertSucceeds(getDoc(doc(ctx.firestore(), "entries", "entry-a")));
  });

  it("denies a different user reading another tenant's entry", async () => {
    const ctx = testEnv.authenticatedContext(TENANT_B_UID);
    await assertFails(getDoc(doc(ctx.firestore(), "entries", "entry-a")));
  });

  it("denies an unauthenticated read", async () => {
    const ctx = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(ctx.firestore(), "entries", "entry-a")));
  });

  it("allows a user to create an entry with their own user_id", async () => {
    const ctx = testEnv.authenticatedContext(TENANT_A_UID);
    await assertSucceeds(
      setDoc(doc(ctx.firestore(), "entries", "entry-a2"), {
        title: "A2",
        user_id: TENANT_A_UID,
        fields: { content: "a2", category: "Work" },
      })
    );
  });

  it("denies creating an entry with someone else's user_id", async () => {
    const ctx = testEnv.authenticatedContext(TENANT_A_UID);
    await assertFails(
      setDoc(doc(ctx.firestore(), "entries", "entry-evil"), {
        title: "evil",
        user_id: TENANT_B_UID,
        fields: { content: "x", category: "Work" },
      })
    );
  });

  it("denies a cross-tenant list query (rules filter by user_id)", async () => {
    const ctx = testEnv.authenticatedContext(TENANT_B_UID);
    // A query without the user_id filter must fail under the rules.
    await assertFails(getDocs(collection(ctx.firestore(), "entries")));
    // A query filtered to the caller's own user_id must succeed.
    await assertSucceeds(
      getDocs(
        query(
          collection(ctx.firestore(), "entries"),
          where("user_id", "==", TENANT_B_UID)
        )
      )
    );
  });
});

describe("tenant isolation — api_keys (revocation gap)", () => {
  beforeEach(seedMinimal);

  it("allows the owner to read their own key metadata", async () => {
    const ctx = testEnv.authenticatedContext(TENANT_A_UID);
    await assertSucceeds(getDoc(doc(ctx.firestore(), "api_keys", "key-a")));
  });

  it("denies a different tenant reading the key", async () => {
    const ctx = testEnv.authenticatedContext(TENANT_B_UID);
    await assertFails(getDoc(doc(ctx.firestore(), "api_keys", "key-a")));
  });

  it("denies client-side delete (documents the broken revocation path)", async () => {
    const ctx = testEnv.authenticatedContext(TENANT_A_UID);
    // rules: allow create, update, delete: if false — so even the owner cannot
    // delete via the client SDK. This is the documented SAVE-001 gap.
    await assertFails(deleteDoc(doc(ctx.firestore(), "api_keys", "key-a")));
  });
});

describe("tenant isolation — server-only collections", () => {
  beforeEach(seedMinimal);

  it("denies client writes to nova_memories (server-only)", async () => {
    const ctx = testEnv.authenticatedContext(TENANT_A_UID);
    await assertFails(
      setDoc(doc(ctx.firestore(), "nova_memories", "m1"), {
        user_id: TENANT_A_UID,
        content: "x",
      })
    );
  });

  it("denies cross-tenant read of nova_memories", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "nova_memories", "m-a"), {
        user_id: TENANT_A_UID,
        content: "a memory",
      });
    });
    const ctx = testEnv.authenticatedContext(TENANT_B_UID);
    await assertFails(getDoc(doc(ctx.firestore(), "nova_memories", "m-a")));
  });
});
