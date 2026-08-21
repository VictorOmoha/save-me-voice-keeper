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
 *
 * SAVE-005 remediation (Sentinel F-005-5): extended the negative-test matrix
 * beyond entries / api_keys / nova_memories to cover more of the rules-matched
 * collections: shared_memories, users (doc-id = uid), reminders,
 * pending_notifications, and the demo_videos signed-in-read boundary. Final
 * remediation extends dynamic coverage to every tenant-owned Firestore match: all
 * user_id-owned collections, all uid-keyed settings collections, and storage_usage.
 * Cases follow the owner-allow / cross-tenant-deny pattern against the real rules;
 * no rule is weakened.
 */

import { assertEmulatorOnly } from "./emulator-guard";
import {
  TENANT_A_UID,
  TENANT_B_UID,
  TENANT_A_EMAIL,
  TENANT_B_EMAIL,
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

    // ── SAVE-005 F-005-5 extension fixtures (synthetic canaries only) ────────
    // shared_memories: tenant A owns one, tenant B owns one (cross-tenant read).
    await setDoc(doc(db, "shared_memories", "sm-a"), {
      user_id: TENANT_A_UID,
      content: "tenant A synthetic shared memory",
    });
    await setDoc(doc(db, "shared_memories", "sm-b"), {
      user_id: TENANT_B_UID,
      content: "tenant B synthetic shared memory",
    });

    // users: doc id IS the uid (rules use isOwner(userId)).
    await setDoc(doc(db, "users", TENANT_A_UID), {
      email: TENANT_A_EMAIL,
      subscriptionStatus: "active",
    });
    await setDoc(doc(db, "users", TENANT_B_UID), {
      email: TENANT_B_EMAIL,
      subscriptionStatus: "free",
    });

    // reminders: tenant A owns one (read/create owner-allow; update/delete deny).
    await setDoc(doc(db, "reminders", "rem-a"), {
      user_id: TENANT_A_UID,
      label: "synthetic reminder",
      status: "pending",
    });

    // pending_notifications: tenant A owns one (read owner; update = status→dismissed only).
    await setDoc(doc(db, "pending_notifications", "pn-a"), {
      user_id: TENANT_A_UID,
      kind: "synthetic",
      status: "pending",
    });

    // demo_videos: signed-in-read boundary doc (no user_id — public-to-authed).
    await setDoc(doc(db, "demo_videos", "dv-1"), {
      title: "synthetic demo video",
      url: "https://example.invalid/video.mp4",
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

// ─── SAVE-005 remediation (Sentinel F-005-5) — extended matrix ───────────────
// Each block asserts owner-allow AND cross-tenant-deny (and the relevant
// server-only or signed-in boundary) against the real baseline rules.

describe("tenant isolation — shared_memories", () => {
  beforeEach(seedMinimal);

  it("allows the owner to read their own shared memory", async () => {
    const ctx = testEnv.authenticatedContext(TENANT_A_UID);
    await assertSucceeds(getDoc(doc(ctx.firestore(), "shared_memories", "sm-a")));
  });

  it("denies a different tenant reading the shared memory", async () => {
    const ctx = testEnv.authenticatedContext(TENANT_B_UID);
    await assertFails(getDoc(doc(ctx.firestore(), "shared_memories", "sm-a")));
  });

  it("denies an unauthenticated read", async () => {
    const ctx = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(ctx.firestore(), "shared_memories", "sm-a")));
  });

  it("denies all client writes (writes go through Cloud Functions)", async () => {
    const ctx = testEnv.authenticatedContext(TENANT_A_UID);
    // rules: allow write: if false — even the owner cannot write via client SDK.
    await assertFails(
      setDoc(doc(ctx.firestore(), "shared_memories", "sm-a2"), {
        user_id: TENANT_A_UID,
        content: "owner write attempt",
      })
    );
    await assertFails(
      setDoc(doc(ctx.firestore(), "shared_memories", "sm-a"), {
        user_id: TENANT_A_UID,
        content: "overwrite attempt",
      })
    );
  });
});

describe("tenant isolation — users (doc id = uid)", () => {
  beforeEach(seedMinimal);

  it("allows a user to read their own users doc", async () => {
    const ctx = testEnv.authenticatedContext(TENANT_A_UID);
    await assertSucceeds(getDoc(doc(ctx.firestore(), "users", TENANT_A_UID)));
  });

  it("denies a user reading another tenant's users doc", async () => {
    const ctx = testEnv.authenticatedContext(TENANT_B_UID);
    await assertFails(getDoc(doc(ctx.firestore(), "users", TENANT_A_UID)));
  });

  it("allows a user to write their own users doc", async () => {
    const ctx = testEnv.authenticatedContext(TENANT_A_UID);
    await assertSucceeds(
      setDoc(doc(ctx.firestore(), "users", TENANT_A_UID), {
        email: TENANT_A_EMAIL,
        displayName: "Tenant A",
      }, {merge: true})
    );
  });

  it("denies the owner writing Stripe or plan fields on users/{uid}", async () => {
    const ctx = testEnv.authenticatedContext(TENANT_A_UID);
    await assertFails(
      setDoc(doc(ctx.firestore(), "users", TENANT_A_UID), {
        stripeCustomerId: "cus_forged",
      }, {merge: true})
    );
    await assertFails(
      setDoc(doc(ctx.firestore(), "users", TENANT_A_UID), {
        subscriptionTier: "premium",
        subscriptionActive: true,
      }, {merge: true})
    );
  });

  it("denies a user writing another tenant's users doc (privilege-escalation guard)", async () => {
    const ctx = testEnv.authenticatedContext(TENANT_B_UID);
    // Tenant B attempts to overwrite tenant A's doc (e.g. to flip role/status).
    await assertFails(
      setDoc(doc(ctx.firestore(), "users", TENANT_A_UID), {
        email: TENANT_A_EMAIL,
        role: "admin",
      })
    );
  });

  it("denies an unauthenticated read of a users doc", async () => {
    const ctx = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(ctx.firestore(), "users", TENANT_A_UID)));
  });
});

describe("tenant isolation — billing authority", () => {
  beforeEach(seedMinimal);

  it("allows only the owner to read the server-owned entitlement", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "billing_entitlements", TENANT_A_UID), {
        schemaVersion: 1,
        uid: TENANT_A_UID,
        plan: "premium",
        status: "active",
        entitled: true,
      });
    });
    const owner = testEnv.authenticatedContext(TENANT_A_UID);
    const other = testEnv.authenticatedContext(TENANT_B_UID);
    await assertSucceeds(getDoc(doc(owner.firestore(), "billing_entitlements", TENANT_A_UID)));
    await assertFails(getDoc(doc(other.firestore(), "billing_entitlements", TENANT_A_UID)));
  });

  it("denies clients writing entitlements or reading the Stripe event ledger", async () => {
    const owner = testEnv.authenticatedContext(TENANT_A_UID);
    await assertFails(setDoc(doc(owner.firestore(), "billing_entitlements", TENANT_A_UID), {
      plan: "premium",
      entitled: true,
    }));
    await assertFails(getDoc(doc(owner.firestore(), "stripe_event_ledger", "evt_canary")));
    await assertFails(setDoc(doc(owner.firestore(), "stripe_event_ledger", "evt_canary"), {
      uid: TENANT_A_UID,
    }));
  });
});

describe("tenant isolation — reminders", () => {
  beforeEach(seedMinimal);

  it("allows the owner to read their own reminder", async () => {
    const ctx = testEnv.authenticatedContext(TENANT_A_UID);
    await assertSucceeds(getDoc(doc(ctx.firestore(), "reminders", "rem-a")));
  });

  it("denies a different tenant reading the reminder", async () => {
    const ctx = testEnv.authenticatedContext(TENANT_B_UID);
    await assertFails(getDoc(doc(ctx.firestore(), "reminders", "rem-a")));
  });

  it("allows a user to create a reminder with their own user_id", async () => {
    const ctx = testEnv.authenticatedContext(TENANT_A_UID);
    await assertSucceeds(
      setDoc(doc(ctx.firestore(), "reminders", "rem-a2"), {
        user_id: TENANT_A_UID,
        label: "owner-created reminder",
        status: "pending",
      })
    );
  });

  it("denies creating a reminder with someone else's user_id", async () => {
    const ctx = testEnv.authenticatedContext(TENANT_A_UID);
    await assertFails(
      setDoc(doc(ctx.firestore(), "reminders", "rem-evil"), {
        user_id: TENANT_B_UID,
        label: "spoofed reminder",
        status: "pending",
      })
    );
  });

  it("denies client update and delete (server-only mutations)", async () => {
    const ctx = testEnv.authenticatedContext(TENANT_A_UID);
    // rules: allow update, delete: if false — even the owner cannot mutate.
    await assertFails(
      setDoc(doc(ctx.firestore(), "reminders", "rem-a"), {
        user_id: TENANT_A_UID,
        label: "updated",
        status: "done",
      })
    );
    await assertFails(deleteDoc(doc(ctx.firestore(), "reminders", "rem-a")));
  });
});

describe("tenant isolation — pending_notifications", () => {
  beforeEach(seedMinimal);

  it("allows the owner to read their own notification", async () => {
    const ctx = testEnv.authenticatedContext(TENANT_A_UID);
    await assertSucceeds(
      getDoc(doc(ctx.firestore(), "pending_notifications", "pn-a"))
    );
  });

  it("denies a different tenant reading the notification", async () => {
    const ctx = testEnv.authenticatedContext(TENANT_B_UID);
    await assertFails(
      getDoc(doc(ctx.firestore(), "pending_notifications", "pn-a"))
    );
  });

  it("allows the owner to dismiss (status -> dismissed only)", async () => {
    const ctx = testEnv.authenticatedContext(TENANT_A_UID);
    // rules: update allowed iff ONLY 'status' changes and new status == 'dismissed'.
    await assertSucceeds(
      setDoc(
        doc(ctx.firestore(), "pending_notifications", "pn-a"),
        { status: "dismissed" },
        { merge: true }
      )
    );
  });

  it("denies the owner changing a field other than status", async () => {
    const ctx = testEnv.authenticatedContext(TENANT_A_UID);
    await assertFails(
      setDoc(
        doc(ctx.firestore(), "pending_notifications", "pn-a"),
        { kind: "tampered" },
        { merge: true }
      )
    );
  });

  it("denies a non-dismissed status transition", async () => {
    const ctx = testEnv.authenticatedContext(TENANT_A_UID);
    await assertFails(
      setDoc(
        doc(ctx.firestore(), "pending_notifications", "pn-a"),
        { status: "sent" },
        { merge: true }
      )
    );
  });

  it("denies a different tenant dismissing the owner's notification", async () => {
    const ctx = testEnv.authenticatedContext(TENANT_B_UID);
    await assertFails(
      setDoc(
        doc(ctx.firestore(), "pending_notifications", "pn-a"),
        { status: "dismissed" },
        { merge: true }
      )
    );
  });

  it("denies client create and delete (server-only)", async () => {
    const ctx = testEnv.authenticatedContext(TENANT_A_UID);
    // rules: allow create, delete: if false.
    await assertFails(
      setDoc(doc(ctx.firestore(), "pending_notifications", "pn-new"), {
        user_id: TENANT_A_UID,
        kind: "synthetic",
        status: "pending",
      })
    );
    await assertFails(
      deleteDoc(doc(ctx.firestore(), "pending_notifications", "pn-a"))
    );
  });
});

describe("demo_videos — signed-in-read boundary", () => {
  beforeEach(seedMinimal);

  it("allows any signed-in user to read a demo video", async () => {
    const ctxA = testEnv.authenticatedContext(TENANT_A_UID);
    const ctxB = testEnv.authenticatedContext(TENANT_B_UID);
    await assertSucceeds(getDoc(doc(ctxA.firestore(), "demo_videos", "dv-1")));
    await assertSucceeds(getDoc(doc(ctxB.firestore(), "demo_videos", "dv-1")));
  });

  it("denies an unauthenticated read (signed-in boundary)", async () => {
    const ctx = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(ctx.firestore(), "demo_videos", "dv-1")));
  });

  it("denies all client writes (admin-only server-side)", async () => {
    const ctx = testEnv.authenticatedContext(TENANT_A_UID);
    // rules: allow write: if false.
    await assertFails(
      setDoc(doc(ctx.firestore(), "demo_videos", "dv-evil"), {
        title: "injected",
        url: "https://example.invalid/evil.mp4",
      })
    );
    await assertFails(deleteDoc(doc(ctx.firestore(), "demo_videos", "dv-1")));
  });
});


// ─── Final F-005-5 closure — exhaustive tenant-owned match coverage ──────────

const SERVER_ONLY_USER_ID_COLLECTIONS = [
  "nova_conversations",
  "entry_links",
  "entry_entities",
  "entity_graph",
  "user_patterns",
  "user_category_patterns",
] as const;

for (const collectionName of SERVER_ONLY_USER_ID_COLLECTIONS) {
  describe(`tenant isolation — ${collectionName}`, () => {
    const ownedDocId = `${collectionName}-a`;

    beforeEach(async () => {
      await seedMinimal();
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), collectionName, ownedDocId), {
          user_id: TENANT_A_UID,
          value: "synthetic owner data",
        });
      });
    });

    it("allows the owner to read and denies another tenant", async () => {
      const owner = testEnv.authenticatedContext(TENANT_A_UID);
      const other = testEnv.authenticatedContext(TENANT_B_UID);
      await assertSucceeds(getDoc(doc(owner.firestore(), collectionName, ownedDocId)));
      await assertFails(getDoc(doc(other.firestore(), collectionName, ownedDocId)));
    });

    it("denies unauthenticated reads and all client writes", async () => {
      const unauthenticated = testEnv.unauthenticatedContext();
      const owner = testEnv.authenticatedContext(TENANT_A_UID);
      await assertFails(
        getDoc(doc(unauthenticated.firestore(), collectionName, ownedDocId))
      );
      await assertFails(
        setDoc(doc(owner.firestore(), collectionName, `${collectionName}-new`), {
          user_id: TENANT_A_UID,
          value: "client write attempt",
        })
      );
      await assertFails(
        deleteDoc(doc(owner.firestore(), collectionName, ownedDocId))
      );
    });
  });
}

describe("tenant isolation — action_items", () => {
  const ownedDocId = "action-a";

  beforeEach(async () => {
    await seedMinimal();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "action_items", ownedDocId), {
        user_id: TENANT_A_UID,
        title: "synthetic action",
      });
    });
  });

  it("allows owner CRUD and denies cross-tenant access", async () => {
    const owner = testEnv.authenticatedContext(TENANT_A_UID);
    const other = testEnv.authenticatedContext(TENANT_B_UID);
    await assertSucceeds(getDoc(doc(owner.firestore(), "action_items", ownedDocId)));
    await assertFails(getDoc(doc(other.firestore(), "action_items", ownedDocId)));
    await assertSucceeds(
      setDoc(doc(owner.firestore(), "action_items", "action-new"), {
        user_id: TENANT_A_UID,
        title: "owner action",
      })
    );
    await assertFails(
      setDoc(doc(owner.firestore(), "action_items", "action-spoofed"), {
        user_id: TENANT_B_UID,
        title: "spoof attempt",
      })
    );
    await assertSucceeds(deleteDoc(doc(owner.firestore(), "action_items", ownedDocId)));
  });
});

const CREATE_READ_ONLY_COLLECTIONS = [
  "search_analytics",
  "webhook_events",
  "support_tickets",
] as const;

for (const collectionName of CREATE_READ_ONLY_COLLECTIONS) {
  describe(`tenant isolation — ${collectionName}`, () => {
    const ownedDocId = `${collectionName}-a`;

    beforeEach(async () => {
      await seedMinimal();
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), collectionName, ownedDocId), {
          user_id: TENANT_A_UID,
          value: "synthetic owner data",
        });
      });
    });

    it("allows owner read/create and denies cross-tenant access or spoofed ownership", async () => {
      const owner = testEnv.authenticatedContext(TENANT_A_UID);
      const other = testEnv.authenticatedContext(TENANT_B_UID);
      await assertSucceeds(getDoc(doc(owner.firestore(), collectionName, ownedDocId)));
      await assertFails(getDoc(doc(other.firestore(), collectionName, ownedDocId)));
      await assertSucceeds(
        setDoc(doc(owner.firestore(), collectionName, `${collectionName}-new`), {
          user_id: TENANT_A_UID,
          value: "owner create",
        })
      );
      await assertFails(
        setDoc(doc(owner.firestore(), collectionName, `${collectionName}-spoofed`), {
          user_id: TENANT_B_UID,
          value: "spoof attempt",
        })
      );
    });

    it("denies client update and delete", async () => {
      const owner = testEnv.authenticatedContext(TENANT_A_UID);
      await assertFails(
        setDoc(
          doc(owner.firestore(), collectionName, ownedDocId),
          { value: "update attempt" },
          { merge: true }
        )
      );
      await assertFails(deleteDoc(doc(owner.firestore(), collectionName, ownedDocId)));
    });
  });
}

const UID_KEYED_COLLECTIONS = [
  "profiles",
  "user_preferences",
  "search_preferences",
] as const;

for (const collectionName of UID_KEYED_COLLECTIONS) {
  describe(`tenant isolation — ${collectionName} (doc id = uid)`, () => {
    beforeEach(async () => {
      await seedMinimal();
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), collectionName, TENANT_A_UID), {
          value: "tenant A synthetic settings",
        });
      });
    });

    it("allows owner read/write and denies another tenant", async () => {
      const owner = testEnv.authenticatedContext(TENANT_A_UID);
      const other = testEnv.authenticatedContext(TENANT_B_UID);
      await assertSucceeds(getDoc(doc(owner.firestore(), collectionName, TENANT_A_UID)));
      await assertSucceeds(
        setDoc(doc(owner.firestore(), collectionName, TENANT_A_UID), {
          value: "owner update",
        })
      );
      await assertFails(getDoc(doc(other.firestore(), collectionName, TENANT_A_UID)));
      await assertFails(
        setDoc(doc(other.firestore(), collectionName, TENANT_A_UID), {
          value: "cross-tenant write",
        })
      );
    });

    it("denies unauthenticated access", async () => {
      const ctx = testEnv.unauthenticatedContext();
      await assertFails(getDoc(doc(ctx.firestore(), collectionName, TENANT_A_UID)));
    });
  });
}

describe("tenant isolation — nova_user_profile (doc id = uid, server writes)", () => {
  beforeEach(async () => {
    await seedMinimal();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "nova_user_profile", TENANT_A_UID), {
        value: "tenant A synthetic profile",
      });
    });
  });

  it("allows owner read and denies cross-tenant or unauthenticated reads", async () => {
    const owner = testEnv.authenticatedContext(TENANT_A_UID);
    const other = testEnv.authenticatedContext(TENANT_B_UID);
    const unauthenticated = testEnv.unauthenticatedContext();
    await assertSucceeds(
      getDoc(doc(owner.firestore(), "nova_user_profile", TENANT_A_UID))
    );
    await assertFails(
      getDoc(doc(other.firestore(), "nova_user_profile", TENANT_A_UID))
    );
    await assertFails(
      getDoc(doc(unauthenticated.firestore(), "nova_user_profile", TENANT_A_UID))
    );
  });

  it("denies all client writes", async () => {
    const owner = testEnv.authenticatedContext(TENANT_A_UID);
    await assertFails(
      setDoc(doc(owner.firestore(), "nova_user_profile", TENANT_A_UID), {
        value: "client write attempt",
      })
    );
  });
});

describe("tenant isolation — storage_usage", () => {
  beforeEach(async () => {
    await seedMinimal();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "storage_usage", TENANT_A_UID), {
        user_id: TENANT_A_UID,
        bytes: 123,
      });
    });
  });

  it("allows only the matching uid owner to read", async () => {
    const owner = testEnv.authenticatedContext(TENANT_A_UID);
    const other = testEnv.authenticatedContext(TENANT_B_UID);
    await assertSucceeds(
      getDoc(doc(owner.firestore(), "storage_usage", TENANT_A_UID))
    );
    await assertFails(
      getDoc(doc(other.firestore(), "storage_usage", TENANT_A_UID))
    );
  });

  it("denies all client writes", async () => {
    const owner = testEnv.authenticatedContext(TENANT_A_UID);
    await assertFails(
      setDoc(doc(owner.firestore(), "storage_usage", TENANT_A_UID), {
        user_id: TENANT_A_UID,
        bytes: 456,
      })
    );
    await assertFails(
      deleteDoc(doc(owner.firestore(), "storage_usage", TENANT_A_UID))
    );
  });
});


// ─── Operation-level closure after independent adversarial review ────────────

describe("operation completeness — entries", () => {
  beforeEach(seedMinimal);

  it("allows owner update/delete and denies ownership reassignment", async () => {
    const owner = testEnv.authenticatedContext(TENANT_A_UID);
    await assertSucceeds(
      setDoc(doc(owner.firestore(), "entries", "entry-a"), {
        title: "owner update",
        user_id: TENANT_A_UID,
        fields: { content: "updated", category: "Work" },
      })
    );
    await assertFails(
      setDoc(doc(owner.firestore(), "entries", "entry-a"), {
        title: "ownership transfer",
        user_id: TENANT_B_UID,
        fields: { content: "x", category: "Work" },
      })
    );
    await assertSucceeds(deleteDoc(doc(owner.firestore(), "entries", "entry-a")));
  });
});

describe("operation completeness — nova_memories", () => {
  beforeEach(async () => {
    await seedMinimal();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "nova_memories", "owner-memory"), {
        user_id: TENANT_A_UID,
        content: "synthetic owner memory",
      });
    });
  });

  it("allows positive owner read and denies unauthenticated read", async () => {
    const owner = testEnv.authenticatedContext(TENANT_A_UID);
    const unauthenticated = testEnv.unauthenticatedContext();
    await assertSucceeds(
      getDoc(doc(owner.firestore(), "nova_memories", "owner-memory"))
    );
    await assertFails(
      getDoc(doc(unauthenticated.firestore(), "nova_memories", "owner-memory"))
    );
  });
});

describe("operation completeness — action_items", () => {
  beforeEach(async () => {
    await seedMinimal();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "action_items", "action-complete"), {
        user_id: TENANT_A_UID,
        title: "synthetic action",
      });
    });
  });

  it("allows owner update, rejects ownership reassignment, and denies unauthenticated access", async () => {
    const owner = testEnv.authenticatedContext(TENANT_A_UID);
    const unauthenticated = testEnv.unauthenticatedContext();
    await assertSucceeds(
      setDoc(doc(owner.firestore(), "action_items", "action-complete"), {
        user_id: TENANT_A_UID,
        title: "owner update",
      })
    );
    await assertFails(
      setDoc(doc(owner.firestore(), "action_items", "action-complete"), {
        user_id: TENANT_B_UID,
        title: "transfer attempt",
      })
    );
    await assertFails(
      getDoc(doc(unauthenticated.firestore(), "action_items", "action-complete"))
    );
  });
});

describe("operation completeness — api_keys", () => {
  beforeEach(seedMinimal);

  it("denies unauthenticated read and client create/update separately", async () => {
    const unauthenticated = testEnv.unauthenticatedContext();
    const owner = testEnv.authenticatedContext(TENANT_A_UID);
    await assertFails(getDoc(doc(unauthenticated.firestore(), "api_keys", "key-a")));
    await assertFails(
      setDoc(doc(owner.firestore(), "api_keys", "key-new"), {
        user_id: TENANT_A_UID,
        key_hash: "canary-new",
        is_active: true,
      })
    );
    await assertFails(
      setDoc(
        doc(owner.firestore(), "api_keys", "key-a"),
        { is_active: false },
        { merge: true }
      )
    );
  });
});

for (const collectionName of SERVER_ONLY_USER_ID_COLLECTIONS) {
  describe(`operation completeness — ${collectionName} update denial`, () => {
    const ownedDocId = `${collectionName}-update-a`;

    beforeEach(async () => {
      await seedMinimal();
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), collectionName, ownedDocId), {
          user_id: TENANT_A_UID,
          value: "synthetic",
        });
      });
    });

    it("denies owner client update explicitly", async () => {
      const owner = testEnv.authenticatedContext(TENANT_A_UID);
      await assertFails(
        setDoc(
          doc(owner.firestore(), collectionName, ownedDocId),
          { value: "update attempt" },
          { merge: true }
        )
      );
    });
  });
}

describe("operation completeness — reminders authentication", () => {
  beforeEach(seedMinimal);

  it("denies unauthenticated read and create", async () => {
    const ctx = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(ctx.firestore(), "reminders", "rem-a")));
    await assertFails(
      setDoc(doc(ctx.firestore(), "reminders", "rem-unauth"), {
        user_id: TENANT_A_UID,
        status: "pending",
      })
    );
  });
});

describe("operation completeness — pending_notifications authentication", () => {
  beforeEach(seedMinimal);

  it("denies unauthenticated read and update", async () => {
    const ctx = testEnv.unauthenticatedContext();
    await assertFails(
      getDoc(doc(ctx.firestore(), "pending_notifications", "pn-a"))
    );
    await assertFails(
      setDoc(
        doc(ctx.firestore(), "pending_notifications", "pn-a"),
        { status: "dismissed" },
        { merge: true }
      )
    );
  });
});

for (const collectionName of CREATE_READ_ONLY_COLLECTIONS) {
  describe(`operation completeness — ${collectionName} authentication`, () => {
    const ownedDocId = `${collectionName}-auth-a`;

    beforeEach(async () => {
      await seedMinimal();
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), collectionName, ownedDocId), {
          user_id: TENANT_A_UID,
          value: "synthetic",
        });
      });
    });

    it("denies unauthenticated read and create", async () => {
      const ctx = testEnv.unauthenticatedContext();
      await assertFails(getDoc(doc(ctx.firestore(), collectionName, ownedDocId)));
      await assertFails(
        setDoc(doc(ctx.firestore(), collectionName, `${collectionName}-unauth`), {
          user_id: TENANT_A_UID,
          value: "unauth create",
        })
      );
    });
  });
}

for (const collectionName of UID_KEYED_COLLECTIONS) {
  describe(`operation completeness — ${collectionName} delete/write boundaries`, () => {
    beforeEach(async () => {
      await seedMinimal();
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), collectionName, TENANT_A_UID), {
          value: "synthetic",
        });
      });
    });

    it("allows owner delete and denies cross-tenant delete", async () => {
      const other = testEnv.authenticatedContext(TENANT_B_UID);
      await assertFails(deleteDoc(doc(other.firestore(), collectionName, TENANT_A_UID)));
      const owner = testEnv.authenticatedContext(TENANT_A_UID);
      await assertSucceeds(deleteDoc(doc(owner.firestore(), collectionName, TENANT_A_UID)));
    });

    it("denies unauthenticated create/update/delete", async () => {
      const ctx = testEnv.unauthenticatedContext();
      await assertFails(
        setDoc(doc(ctx.firestore(), collectionName, TENANT_A_UID), {
          value: "unauth write",
        })
      );
      await assertFails(deleteDoc(doc(ctx.firestore(), collectionName, TENANT_A_UID)));
    });
  });
}

describe("operation completeness — storage_usage", () => {
  beforeEach(async () => {
    await seedMinimal();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "storage_usage", TENANT_A_UID), {
        user_id: TENANT_A_UID,
        bytes: 123,
      });
    });
  });

  it("denies unauthenticated read and client create", async () => {
    const unauthenticated = testEnv.unauthenticatedContext();
    const owner = testEnv.authenticatedContext(TENANT_A_UID);
    await assertFails(
      getDoc(doc(unauthenticated.firestore(), "storage_usage", TENANT_A_UID))
    );
    await assertFails(
      setDoc(doc(owner.firestore(), "storage_usage", "storage-new"), {
        user_id: TENANT_A_UID,
        bytes: 1,
      })
    );
  });
});
