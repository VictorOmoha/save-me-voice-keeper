/** SAVE-109 — Firebase Storage contract, validation, and isolation tests. */
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
const SMALL = new Uint8Array([0x53, 0x41, 0x56, 0x45]);
const MiB = 1024 * 1024;

let testEnv: RulesTestEnvironment;
let sequence = 0;
const nextName = (extension = "bin") => `case-${++sequence}.${extension}`;
const imagePath = (uid: string, extension = "png") =>
  `images/${uid}/${nextName(extension)}`;
const documentPath = (uid: string, extension = "pdf") =>
  `documents/${uid}/entry-${++sequence}/${nextName(extension)}`;
const legacyPath = (uid: string) => `users/${uid}/${nextName()}`;

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

async function seedWithoutRules(objectPath: string, bytes = SMALL) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await uploadBytes(ref(context.storage(), objectPath), bytes, {
      contentType: "application/octet-stream",
    });
  });
}

async function ownerUpload(
  objectPath: string,
  contentType: string,
  bytes: Uint8Array = SMALL
) {
  return uploadBytes(
    ref(testEnv.authenticatedContext(TENANT_A_UID).storage(), objectPath),
    bytes,
    { contentType }
  );
}

describe.each([
  ["images", () => imagePath(TENANT_A_UID), "image/png"],
  ["documents", () => documentPath(TENANT_A_UID), "application/pdf"],
  ["users", () => legacyPath(TENANT_A_UID), "application/octet-stream"],
] as const)("owner isolation — %s", (_prefix, makePath, contentType) => {
  it("allows owner create/read/delete", async () => {
    const objectPath = makePath();
    const ownerRef = ref(testEnv.authenticatedContext(TENANT_A_UID).storage(), objectPath);
    await assertSucceeds(uploadBytes(ownerRef, SMALL, { contentType }));
    await assertSucceeds(getBytes(ownerRef));
    await assertSucceeds(deleteObject(ownerRef));
  });

  it("denies cross-user create/read/delete", async () => {
    const objectPath = makePath();
    await seedWithoutRules(objectPath);
    const attackerRef = ref(testEnv.authenticatedContext(TENANT_B_UID).storage(), objectPath);
    await assertFails(uploadBytes(attackerRef, SMALL, { contentType }));
    await assertFails(getBytes(attackerRef));
    await assertFails(deleteObject(attackerRef));
  });

  it("denies unauthenticated create/read/delete", async () => {
    const objectPath = makePath();
    await seedWithoutRules(objectPath);
    const anonymousRef = ref(testEnv.unauthenticatedContext().storage(), objectPath);
    await assertFails(uploadBytes(anonymousRef, SMALL, { contentType }));
    await assertFails(getBytes(anonymousRef));
    await assertFails(deleteObject(anonymousRef));
  });
});

const IMAGE_MIMES = [
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/gif", "gif"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
  ["image/svg+xml", "svg"],
] as const;

describe("images MIME and size validation", () => {
  it.each(IMAGE_MIMES)("allows approved MIME %s", async (contentType, extension) => {
    await assertSucceeds(ownerUpload(imagePath(TENANT_A_UID, extension), contentType));
  });

  it.each(["application/pdf", "image/bmp", "text/plain", "application/octet-stream"])(
    "denies unapproved MIME %s",
    async (contentType) => {
      await assertFails(ownerUpload(imagePath(TENANT_A_UID), contentType));
    }
  );

  it("allows exactly 10 MiB and denies one byte over", async () => {
    await assertSucceeds(
      ownerUpload(imagePath(TENANT_A_UID), "image/png", new Uint8Array(10 * MiB))
    );
    await assertFails(
      ownerUpload(imagePath(TENANT_A_UID), "image/png", new Uint8Array(10 * MiB + 1))
    );
  });
});

const DOCUMENT_MIMES = [
  ["application/pdf", "pdf"],
  ["application/msword", "doc"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"],
  ["application/vnd.openxmlformats-officedocument.presentationml.presentation", "pptx"],
  ["application/vnd.ms-excel", "xls"],
  ["application/vnd.ms-powerpoint", "ppt"],
  ["application/vnd.oasis.opendocument.text", "odt"],
  ["application/vnd.oasis.opendocument.spreadsheet", "ods"],
  ["application/vnd.oasis.opendocument.presentation", "odp"],
  ["text/plain", "txt"],
  ["text/html", "html"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["text/markdown", "md"],
  ["text/x-markdown", "markdown"],
  ["text/csv", "csv"],
  ["application/json", "json"],
  ["application/rtf", "rtf"],
  ["text/rtf", "rtf"],
  ["application/zip", "zip"],
  ["application/x-zip-compressed", "zip"],
  ["audio/mpeg", "mp3"],
  ["audio/wav", "wav"],
  ["video/mp4", "mp4"],
  ["video/webm", "webm"],
] as const;

describe("documents MIME and size validation", () => {
  it.each(DOCUMENT_MIMES)("allows approved MIME %s", async (contentType, extension) => {
    await assertSucceeds(ownerUpload(documentPath(TENANT_A_UID, extension), contentType));
  });

  it.each(["image/gif", "application/octet-stream", "application/x-msdownload"])(
    "denies unapproved MIME %s",
    async (contentType) => {
      await assertFails(ownerUpload(documentPath(TENANT_A_UID), contentType));
    }
  );

  it("allows exactly 25 MiB and denies one byte over", async () => {
    await assertSucceeds(
      ownerUpload(documentPath(TENANT_A_UID), "application/pdf", new Uint8Array(25 * MiB))
    );
    await assertFails(
      ownerUpload(documentPath(TENANT_A_UID), "application/pdf", new Uint8Array(25 * MiB + 1))
    );
  });
});

describe("legacy users size boundary", () => {
  it("allows exactly 25 MiB regardless of MIME and denies one byte over", async () => {
    await assertSucceeds(
      ownerUpload(legacyPath(TENANT_A_UID), "application/octet-stream", new Uint8Array(25 * MiB))
    );
    await assertFails(
      ownerUpload(legacyPath(TENANT_A_UID), "application/octet-stream", new Uint8Array(25 * MiB + 1))
    );
  });
});

describe("path-shape validation", () => {
  it.each([
    [
      `images/${TENANT_A_UID}/Sam's photo (final) — 東京.png`,
      "image/png",
    ],
    [
      `documents/${TENANT_A_UID}/Résumé (été)/Owner's résumé (final) — 東京.pdf`,
      "application/pdf",
    ],
    [
      `users/${TENANT_A_UID}/Owner's archive (旧).bin`,
      "application/octet-stream",
    ],
  ])("allows harmless punctuation and Unicode in %s", async (objectPath, contentType) => {
    await assertSucceeds(ownerUpload(objectPath, contentType));
  });

  it.each([
    `images/${TENANT_A_UID}/nested/${nextName("png")}`,
    `images/${TENANT_A_UID}/..evil.png`,
    `images/${TENANT_A_UID}/bad\\name.png`,
    `images/${TENANT_A_UID}/bad\u0000name.png`,
    `images/${TENANT_A_UID}/bad\u001fname.png`,
    `images/${TENANT_A_UID}/bad\u007fname.png`,
    `documents/${TENANT_A_UID}/${nextName("pdf")}`,
    `documents/${TENANT_A_UID}//${nextName("pdf")}`,
    `documents/${TENANT_A_UID}/entry/nested/${nextName("pdf")}`,
    `documents/${TENANT_A_UID}/../escape.pdf`,
    `documents/${TENANT_A_UID}/entry/bad\\name.pdf`,
    `users/${TENANT_A_UID}/nested/${nextName()}`,
    `users/${TENANT_A_UID}/bad\\name.bin`,
  ])("denies malformed or over-nested path %s", async (objectPath) => {
    const contentType = objectPath.startsWith("images/") ? "image/png" : "application/pdf";
    await assertFails(ownerUpload(objectPath, contentType));
  });
});

describe.each(["demo-videos", "admin-public"])("public/Admin-SDK-only boundary — %s", (prefix) => {
  it("allows public reads of a safe, server-seeded object", async () => {
    const objectPath = `${prefix}/${nextName("mp4")}`;
    await seedWithoutRules(objectPath);
    await assertSucceeds(getBytes(ref(testEnv.unauthenticatedContext().storage(), objectPath)));
    await assertSucceeds(
      getBytes(ref(testEnv.authenticatedContext(TENANT_A_UID).storage(), objectPath))
    );
  });

  it("denies anonymous and authenticated client writes and deletes", async () => {
    const existingPath = `${prefix}/${nextName("mp4")}`;
    await seedWithoutRules(existingPath);
    for (const context of [
      testEnv.unauthenticatedContext(),
      testEnv.authenticatedContext(TENANT_A_UID),
    ]) {
      await assertFails(
        uploadBytes(ref(context.storage(), `${prefix}/${nextName("mp4")}`), SMALL, {
          contentType: "video/mp4",
        })
      );
      await assertFails(deleteObject(ref(context.storage(), existingPath)));
    }
  });

  it("denies malformed and nested public paths", async () => {
    for (const objectPath of [
      `${prefix}/nested/${nextName("mp4")}`,
      `${prefix}/bad\\name.mp4`,
      `${prefix}/..evil.mp4`,
    ]) {
      await seedWithoutRules(objectPath);
      await assertFails(getBytes(ref(testEnv.unauthenticatedContext().storage(), objectPath)));
    }
  });
});

describe("default deny", () => {
  it("denies reads, creates, and deletes on unmatched paths", async () => {
    const objectPath = `unmatched/${nextName()}`;
    await seedWithoutRules(objectPath);
    for (const context of [
      testEnv.unauthenticatedContext(),
      testEnv.authenticatedContext(TENANT_A_UID),
    ]) {
      const objectRef = ref(context.storage(), objectPath);
      await assertFails(getBytes(objectRef));
      await assertFails(uploadBytes(objectRef, SMALL));
      await assertFails(deleteObject(objectRef));
    }
  });
});
