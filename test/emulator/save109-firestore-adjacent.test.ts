/** SAVE-109 — Adjacent Firestore boundary coverage. */
import { assertEmulatorOnly } from "./emulator-guard";
import { TENANT_A_UID, TENANT_B_UID } from "./seed";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
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

afterEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv?.cleanup();
});

async function seed(collectionName: string, documentId: string, data: object) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), collectionName, documentId), data);
  });
}

describe("public_demo_videos", () => {
  beforeEach(async () => {
    await seed("public_demo_videos", "demo-1", { title: "public demo" });
  });

  it("allows unauthenticated and authenticated reads", async () => {
    await assertSucceeds(
      getDoc(doc(testEnv.unauthenticatedContext().firestore(), "public_demo_videos", "demo-1"))
    );
    await assertSucceeds(
      getDoc(
        doc(
          testEnv.authenticatedContext(TENANT_A_UID).firestore(),
          "public_demo_videos",
          "demo-1"
        )
      )
    );
  });

  it("denies all client writes", async () => {
    for (const context of [
      testEnv.unauthenticatedContext(),
      testEnv.authenticatedContext(TENANT_A_UID),
    ]) {
      await assertFails(
        setDoc(doc(context.firestore(), "public_demo_videos", "client-write"), {
          title: "forbidden",
        })
      );
      await assertFails(deleteDoc(doc(context.firestore(), "public_demo_videos", "demo-1")));
    }
  });
});

describe("waiting_list", () => {
  it("allows public signup create but denies read, update, and delete", async () => {
    const anonymous = testEnv.unauthenticatedContext();
    const signup = doc(anonymous.firestore(), "waiting_list", "signup-1");
    await assertSucceeds(setDoc(signup, { email: "synthetic@example.invalid" }));
    await assertFails(getDoc(signup));
    await assertFails(updateDoc(signup, { email: "changed@example.invalid" }));
    await assertFails(deleteDoc(signup));
  });
});

describe("users delete and unauthenticated writes", () => {
  beforeEach(async () => {
    await seed("users", TENANT_A_UID, { displayName: "Tenant A" });
  });

  it("allows owner delete and denies cross-user delete", async () => {
    await assertFails(
      deleteDoc(doc(testEnv.authenticatedContext(TENANT_B_UID).firestore(), "users", TENANT_A_UID))
    );
    await assertSucceeds(
      deleteDoc(doc(testEnv.authenticatedContext(TENANT_A_UID).firestore(), "users", TENANT_A_UID))
    );
  });

  it("denies unauthenticated create, update, and delete", async () => {
    const anonymous = testEnv.unauthenticatedContext();
    await assertFails(
      setDoc(doc(anonymous.firestore(), "users", "anonymous"), { displayName: "no" })
    );
    await assertFails(
      updateDoc(doc(anonymous.firestore(), "users", TENANT_A_UID), { displayName: "no" })
    );
    await assertFails(deleteDoc(doc(anonymous.firestore(), "users", TENANT_A_UID)));
  });
});

describe("pending_notifications status/deletion boundaries", () => {
  beforeEach(async () => {
    await seed("pending_notifications", "pending-1", {
      user_id: TENANT_A_UID,
      status: "pending",
      kind: "synthetic",
    });
  });

  it("allows only the owner status transition to dismissed", async () => {
    await assertSucceeds(
      updateDoc(
        doc(
          testEnv.authenticatedContext(TENANT_A_UID).firestore(),
          "pending_notifications",
          "pending-1"
        ),
        { status: "dismissed" }
      )
    );
  });

  it("denies deleting the status field or the notification document", async () => {
    const ownerRef = doc(
      testEnv.authenticatedContext(TENANT_A_UID).firestore(),
      "pending_notifications",
      "pending-1"
    );
    await assertFails(
      setDoc(
        ownerRef,
        { user_id: TENANT_A_UID, kind: "synthetic" },
        { merge: false }
      )
    );
    await assertFails(deleteDoc(ownerRef));
  });
});

describe("storage_usage document-id binding", () => {
  it("denies owner read when user_id matches but document id does not", async () => {
    await seed("storage_usage", TENANT_B_UID, {
      user_id: TENANT_A_UID,
      bytes: 123,
    });
    await assertFails(
      getDoc(
        doc(
          testEnv.authenticatedContext(TENANT_A_UID).firestore(),
          "storage_usage",
          TENANT_B_UID
        )
      )
    );
  });
});
