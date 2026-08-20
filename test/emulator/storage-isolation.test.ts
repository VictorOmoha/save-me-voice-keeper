/**
 * SAVE-005 / D-009 / SAVE-109 — Firebase Storage path-contract and isolation tests.
 *
 * Exercises the source-controlled storage.rules against the real Storage
 * emulator. The SAVE-005 matrix proves owner isolation for the application
 * prefixes, preserves the legacy/future users/{uid}/... prefix, confirms
 * demo-videos public-read/client-write-deny, and verifies the default-deny
 * catch-all.
 *
 * SAVE-109 extends the matrix with:
 *   - approved content-type allowlists (image/* and document types);
 *   - explicit object-size ceilings (10 MiB images, 25 MiB documents/users);
 *   - path-traversal / malformed-path denial;
 *   - public/demo boundary assertions;
 *   - a verifiable admin-publication boundary that does NOT trust any
 *     client-readable role document (custom-claim-only, and still client-write
 *     denied — publication is Admin-SDK-only).
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

const SMALL = new Uint8Array([0x53, 0x41, 0x56, 0x45]); // "SAVE" canary
const OVER_10MIB = new Uint8Array(10 * 1024 * 1024 + 1);
const OVER_25MIB = new Uint8Array(25 * 1024 * 1024 + 1);

const CT = {
  jpeg: "image/jpeg",
  png: "image/png",
  pdf: "application/pdf",
  exe: "application/x-msdownload",
  octet: "application/octet-stream",
} as const;

let testEnv: RulesTestEnvironment;
let sequence = 0;
const uniqueName = () => `case-${++sequence}`;

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

/** Seed an object bypassing rules (seed type/shape is independent of rules). */
async function seedWithoutRules(objectPath: string) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await uploadBytes(ref(context.storage(), objectPath), SMALL, {
      contentType: CT.octet,
    });
  });
}

function storageFor(uid: string | null) {
  return uid === null
    ? testEnv.unauthenticatedContext().storage()
    : testEnv.authenticatedContext(uid).storage();
}

// ─── SAVE-005 owner isolation, retargeted to SAVE-109-compliant shapes ───────

describe("Storage isolation — users/{uid}/{file}", () => {
  it("allows the owner to upload, read, and delete", async () => {
    const p = `users/${TENANT_A_UID}/${uniqueName()}.bin`;
    const r = ref(storageFor(TENANT_A_UID), p);
    await assertSucceeds(uploadBytes(r, SMALL, { contentType: CT.octet }));
    await assertSucceeds(getBytes(r));
    await assertSucceeds(deleteObject(r));
  });

  it("denies cross-user upload and read", async () => {
    const p = `users/${TENANT_A_UID}/${uniqueName()}.bin`;
    await seedWithoutRules(p);
    const r = ref(storageFor(TENANT_B_UID), p);
    await assertFails(uploadBytes(r, SMALL, { contentType: CT.octet }));
    await assertFails(getBytes(r));
  });

  it("denies unauthenticated upload and read", async () => {
    const p = `users/${TENANT_A_UID}/${uniqueName()}.bin`;
    await seedWithoutRules(p);
    const r = ref(storageFor(null), p);
    await assertFails(uploadBytes(r, SMALL, { contentType: CT.octet }));
    await assertFails(getBytes(r));
  });
});

describe("Storage isolation — images/{uid}/{file}", () => {
  it("allows the owner to upload, read, and delete (approved type)", async () => {
    const p = `images/${TENANT_A_UID}/${uniqueName()}.jpg`;
    const r = ref(storageFor(TENANT_A_UID), p);
    await assertSucceeds(uploadBytes(r, SMALL, { contentType: CT.jpeg }));
    await assertSucceeds(getBytes(r));
    await assertSucceeds(deleteObject(r));
  });

  it("denies cross-user upload and read", async () => {
    const p = `images/${TENANT_A_UID}/${uniqueName()}.jpg`;
    await seedWithoutRules(p);
    const r = ref(storageFor(TENANT_B_UID), p);
    await assertFails(uploadBytes(r, SMALL, { contentType: CT.jpeg }));
    await assertFails(getBytes(r));
  });

  it("denies unauthenticated upload and read", async () => {
    const p = `images/${TENANT_A_UID}/${uniqueName()}.jpg`;
    await seedWithoutRules(p);
    const r = ref(storageFor(null), p);
    await assertFails(uploadBytes(r, SMALL, { contentType: CT.jpeg }));
    await assertFails(getBytes(r));
  });
});

describe("Storage isolation — documents/{uid}/{entryId}/{file}", () => {
  it("allows the owner to upload, read, and delete (approved type)", async () => {
    const p = `documents/${TENANT_A_UID}/entry-${uniqueName()}/file.pdf`;
    const r = ref(storageFor(TENANT_A_UID), p);
    await assertSucceeds(uploadBytes(r, SMALL, { contentType: CT.pdf }));
    await assertSucceeds(getBytes(r));
    await assertSucceeds(deleteObject(r));
  });

  it("denies cross-user upload and read", async () => {
    const p = `documents/${TENANT_A_UID}/entry-${uniqueName()}/file.pdf`;
    await seedWithoutRules(p);
    const r = ref(storageFor(TENANT_B_UID), p);
    await assertFails(uploadBytes(r, SMALL, { contentType: CT.pdf }));
    await assertFails(getBytes(r));
  });

  it("denies unauthenticated upload and read", async () => {
    const p = `documents/${TENANT_A_UID}/entry-${uniqueName()}/file.pdf`;
    await seedWithoutRules(p);
    const r = ref(storageFor(null), p);
    await assertFails(uploadBytes(r, SMALL, { contentType: CT.pdf }));
    await assertFails(getBytes(r));
  });
});

// ─── SAVE-109: approved content types ────────────────────────────────────────

describe("SAVE-109 content types — images/{uid}/{file}", () => {
  it("accepts each approved image type", async () => {
    for (const [ext, ct] of [
      ["jpg", "image/jpeg"],
      ["png", "image/png"],
      ["gif", "image/gif"],
      ["webp", "image/webp"],
      ["avif", "image/avif"],
      ["svg", "image/svg+xml"],
    ] as const) {
      const p = `images/${TENANT_A_UID}/${uniqueName()}.${ext}`;
      await assertSucceeds(
        uploadBytes(ref(storageFor(TENANT_A_UID), p), SMALL, { contentType: ct })
      );
    }
  });

  it("rejects a disallowed type (executable masquerading as an image)", async () => {
    const p = `images/${TENANT_A_UID}/${uniqueName()}.jpg`;
    await assertFails(
      uploadBytes(ref(storageFor(TENANT_A_UID), p), SMALL, { contentType: CT.exe })
    );
  });

  it("rejects application/octet-stream on the image prefix", async () => {
    const p = `images/${TENANT_A_UID}/${uniqueName()}.jpg`;
    await assertFails(
      uploadBytes(ref(storageFor(TENANT_A_UID), p), SMALL, { contentType: CT.octet })
    );
  });
});

describe("SAVE-109 content types — documents/{uid}/{entryId}/{file}", () => {
  it("accepts representative approved document types", async () => {
    for (const [ext, ct] of [
      ["pdf", "application/pdf"],
      ["txt", "text/plain"],
      ["md", "text/markdown"],
      ["csv", "text/csv"],
      ["json", "application/json"],
      ["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
      ["mp3", "audio/mpeg"],
      ["mp4", "video/mp4"],
    ] as const) {
      const p = `documents/${TENANT_A_UID}/entry-${uniqueName()}/file.${ext}`;
      await assertSucceeds(
        uploadBytes(ref(storageFor(TENANT_A_UID), p), SMALL, { contentType: ct })
      );
    }
  });

  it("rejects a disallowed executable type", async () => {
    const p = `documents/${TENANT_A_UID}/entry-${uniqueName()}/file.exe`;
    await assertFails(
      uploadBytes(ref(storageFor(TENANT_A_UID), p), SMALL, { contentType: CT.exe })
    );
  });
});

// ─── SAVE-109: object-size ceilings ──────────────────────────────────────────

describe("SAVE-109 size ceilings", () => {
  it("allows an image at/below the 10 MiB ceiling", async () => {
    const p = `images/${TENANT_A_UID}/${uniqueName()}.png`;
    await assertSucceeds(
      uploadBytes(ref(storageFor(TENANT_A_UID), p), SMALL, { contentType: CT.png })
    );
  });

  it("denies an image over 10 MiB", async () => {
    const p = `images/${TENANT_A_UID}/${uniqueName()}.jpg`;
    await assertFails(
      uploadBytes(ref(storageFor(TENANT_A_UID), p), OVER_10MIB, {
        contentType: CT.jpeg,
      })
    );
  });

  it("denies a document over 25 MiB", async () => {
    const p = `documents/${TENANT_A_UID}/entry-${uniqueName()}/big.pdf`;
    await assertFails(
      uploadBytes(ref(storageFor(TENANT_A_UID), p), OVER_25MIB, {
        contentType: CT.pdf,
      })
    );
  });

  it("denies a users/ blob over 25 MiB", async () => {
    const p = `users/${TENANT_A_UID}/${uniqueName()}.bin`;
    await assertFails(
      uploadBytes(ref(storageFor(TENANT_A_UID), p), OVER_25MIB, {
        contentType: CT.octet,
      })
    );
  });
});

// ─── SAVE-109: path traversal / malformed paths ──────────────────────────────

describe("SAVE-109 path traversal and malformed paths", () => {
  it("denies a write when the captured filename segment contains a separator", async () => {
    // documents/{userId}/{entryId}/{fileName} — a 4th segment means {fileName}
    // would capture "dir/file.pdf", which segmentOk() rejects.
    const p = `documents/${TENANT_A_UID}/entry-1/dir/file.pdf`;
    await assertFails(
      uploadBytes(ref(storageFor(TENANT_A_UID), p), SMALL, { contentType: CT.pdf })
    );
  });

  it("denies an image write with extra nesting under the filename", async () => {
    const p = `images/${TENANT_A_UID}/nested/${uniqueName()}.jpg`;
    await assertFails(
      uploadBytes(ref(storageFor(TENANT_A_UID), p), SMALL, { contentType: CT.jpeg })
    );
  });

  it("denies a literal '..' path segment (escape attempt)", async () => {
    const p = `images/${TENANT_A_UID}/../${uniqueName()}.jpg`;
    await assertFails(
      uploadBytes(ref(storageFor(TENANT_A_UID), p), SMALL, { contentType: CT.jpeg })
    );
  });

  it("denies reads of seeded objects at malformed (extra-segment) paths", async () => {
    const p = `images/${TENANT_A_UID}/evil/${uniqueName()}.jpg`;
    await seedWithoutRules(p); // seed bypasses rules to create the object
    await assertFails(getBytes(ref(storageFor(TENANT_A_UID), p)));
  });
});

// ─── SAVE-109: public/demo boundary ──────────────────────────────────────────

describe("Storage boundary — demo-videos/{file}", () => {
  it("allows unauthenticated and authenticated reads", async () => {
    const p = `demo-videos/${uniqueName()}.mp4`;
    await seedWithoutRules(p);
    await assertSucceeds(getBytes(ref(storageFor(null), p)));
    await assertSucceeds(getBytes(ref(storageFor(TENANT_A_UID), p)));
  });

  it("denies client writes, including authenticated clients", async () => {
    await assertFails(
      uploadBytes(ref(storageFor(null), `demo-videos/${uniqueName()}.mp4`), SMALL, {
        contentType: "video/mp4",
      })
    );
    await assertFails(
      uploadBytes(
        ref(storageFor(TENANT_A_UID), `demo-videos/${uniqueName()}.mp4`),
        SMALL,
        { contentType: "video/mp4" }
      )
    );
  });

  it("denies writes with nested paths under demo-videos (no traversal)", async () => {
    const p = `demo-videos/nested/${uniqueName()}.mp4`;
    await assertFails(
      uploadBytes(ref(storageFor(TENANT_A_UID), p), SMALL, {
        contentType: "video/mp4",
      })
    );
  });
});

// ─── SAVE-109: admin-public boundary (no client-readable role trust) ────────

describe("Storage boundary — admin-public/{file} (server-only publication)", () => {
  it("allows signed-in reads of published assets", async () => {
    const p = `admin-public/${uniqueName()}.png`;
    await seedWithoutRules(p);
    await assertSucceeds(getBytes(ref(storageFor(TENANT_A_UID), p)));
  });

  it("denies unauthenticated reads", async () => {
    const p = `admin-public/${uniqueName()}.png`;
    await seedWithoutRules(p);
    await assertFails(getBytes(ref(storageFor(null), p)));
  });

  it("denies ALL client writes, even for an otherwise-privileged user", async () => {
    // A client cannot mint an admin custom claim, and rules grant no storage
    // write to admin claims anyway — publication is Admin-SDK-only.
    await assertFails(
      uploadBytes(
        ref(storageFor(TENANT_A_UID), `admin-public/${uniqueName()}.png`),
        SMALL,
        { contentType: CT.png }
      )
    );
  });

  it("denies nested-path writes under admin-public", async () => {
    const p = `admin-public/nested/${uniqueName()}.png`;
    await assertFails(
      uploadBytes(ref(storageFor(TENANT_A_UID), p), SMALL, { contentType: CT.png })
    );
  });
});

// ─── SAVE-109: admin custom claim carries no Storage write privilege ─────────

describe("SAVE-109 admin custom-claim non-authority", () => {
  it("denies a client presenting an admin claim from writing demo-videos", async () => {
    const adminCtx = testEnv.authenticatedContext(TENANT_A_UID, { admin: true });
    await assertFails(
      uploadBytes(ref(adminCtx.storage(), `demo-videos/${uniqueName()}.mp4`), SMALL, {
        contentType: "video/mp4",
      })
    );
  });

  it("denies a client presenting an admin claim from writing admin-public", async () => {
    const adminCtx = testEnv.authenticatedContext(TENANT_A_UID, { admin: true });
    await assertFails(
      uploadBytes(ref(adminCtx.storage(), `admin-public/${uniqueName()}.png`), SMALL, {
        contentType: CT.png,
      })
    );
  });

  it("denies a client presenting an admin claim from writing another user's prefix", async () => {
    const adminCtx = testEnv.authenticatedContext(TENANT_B_UID, { admin: true });
    const p = `images/${TENANT_A_UID}/${uniqueName()}.jpg`;
    await assertFails(
      uploadBytes(ref(adminCtx.storage(), p), SMALL, { contentType: CT.jpeg })
    );
  });
});

// ─── Default-deny catch-all ──────────────────────────────────────────────────

describe("Storage boundary — unmatched paths", () => {
  it("default-denies reads and writes for authenticated and anonymous clients", async () => {
    const p = `unmatched-private-prefix/${uniqueName()}.bin`;
    await seedWithoutRules(p);
    const ownerRef = ref(storageFor(TENANT_A_UID), p);
    const anonymousRef = ref(storageFor(null), p);
    await assertFails(getBytes(ownerRef));
    await assertFails(uploadBytes(ownerRef, SMALL, { contentType: CT.octet }));
    await assertFails(getBytes(anonymousRef));
  });
});
