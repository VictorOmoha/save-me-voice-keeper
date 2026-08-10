/**
 * SAVE-005 / D-009 — Firebase Storage path-contract and isolation tests.
 *
 * Exercises the source-controlled storage.rules against the real Storage
 * emulator. The test matrix proves the current application prefixes
 * (documents/{uid}/... and images/{uid}/...), preserves the legacy/future
 * users/{uid}/... prefix, confirms demo-videos public-read/client-write-deny,
 * and verifies the default-deny catch-all.
 */

import { assertEmulatorOnly } from "./emulator-guard";
import { TENANT_A_UID, TENANT_B_UID } from "./seed";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteObject, getBytes, ref, uploadBytes } from "firebase/storage";
import fs from "node:fs";
import path from "node:path";

const PROJECT_ID = process.env.EMULATOR_PROJECT_ID ?? "demo-saveme";
const RULES_PATH = path.resolve(process.cwd(), "storage.rules");
const STORAGE_PORT = Number(process.env.FIREBASE_STORAGE_EMULATOR_PORT ?? 9199);
const BYTES = new Uint8Array([0x53, 0x41, 0x56, 0x45]); // "SAVE" canary

let testEnv: RulesTestEnvironment;
let sequence = 0;
const unique = (prefix: string) => `${prefix}/case-${++sequence}.bin`;

beforeAll(async () => {
  assertEmulatorOnly({ projectId: PROJECT_ID });
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    storage: {
      rules: fs.readFileSync(RULES_PATH, "utf8"),
      host: "127.0.0.1",
      port: STORAGE_PORT,
    },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

async function seedWithoutRules(objectPath: string) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await uploadBytes(ref(context.storage(), objectPath), BYTES, {
      contentType: "application/octet-stream",
    });
  });
}

for (const prefix of ["users", "documents", "images"] as const) {
  describe(`Storage isolation — ${prefix}/{uid}/**`, () => {
    it("allows the owner to upload, read, and delete", async () => {
      const objectPath = unique(`${prefix}/${TENANT_A_UID}`);
      const ownerRef = ref(
        testEnv.authenticatedContext(TENANT_A_UID).storage(),
        objectPath
      );

      await assertSucceeds(uploadBytes(ownerRef, BYTES));
      await assertSucceeds(getBytes(ownerRef));
      await assertSucceeds(deleteObject(ownerRef));
    });

    it("denies cross-user upload and read", async () => {
      const objectPath = unique(`${prefix}/${TENANT_A_UID}`);
      await seedWithoutRules(objectPath);
      const attackerRef = ref(
        testEnv.authenticatedContext(TENANT_B_UID).storage(),
        objectPath
      );

      await assertFails(uploadBytes(attackerRef, BYTES));
      await assertFails(getBytes(attackerRef));
    });

    it("denies unauthenticated upload and read", async () => {
      const objectPath = unique(`${prefix}/${TENANT_A_UID}`);
      await seedWithoutRules(objectPath);
      const anonymousRef = ref(testEnv.unauthenticatedContext().storage(), objectPath);

      await assertFails(uploadBytes(anonymousRef, BYTES));
      await assertFails(getBytes(anonymousRef));
    });
  });
}

describe("Storage boundary — demo-videos/**", () => {
  it("allows unauthenticated and authenticated reads", async () => {
    const objectPath = unique("demo-videos");
    await seedWithoutRules(objectPath);

    await assertSucceeds(
      getBytes(ref(testEnv.unauthenticatedContext().storage(), objectPath))
    );
    await assertSucceeds(
      getBytes(
        ref(testEnv.authenticatedContext(TENANT_A_UID).storage(), objectPath)
      )
    );
  });

  it("denies client writes, including authenticated clients", async () => {
    const anonymousRef = ref(
      testEnv.unauthenticatedContext().storage(),
      unique("demo-videos")
    );
    const authenticatedRef = ref(
      testEnv.authenticatedContext(TENANT_A_UID).storage(),
      unique("demo-videos")
    );

    await assertFails(uploadBytes(anonymousRef, BYTES));
    await assertFails(uploadBytes(authenticatedRef, BYTES));
  });
});

describe("Storage boundary — unmatched paths", () => {
  it("default-denies reads and writes for authenticated and anonymous clients", async () => {
    const objectPath = unique("unmatched-private-prefix");
    await seedWithoutRules(objectPath);

    const ownerRef = ref(
      testEnv.authenticatedContext(TENANT_A_UID).storage(),
      objectPath
    );
    const anonymousRef = ref(testEnv.unauthenticatedContext().storage(), objectPath);

    await assertFails(getBytes(ownerRef));
    await assertFails(uploadBytes(ownerRef, BYTES));
    await assertFails(getBytes(anonymousRef));
  });
});
