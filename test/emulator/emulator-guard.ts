/**
 * SAVE-005 — No-production guard for the emulator harness.
 *
 * This module MUST be imported before any emulator test or seed runs. It fails
 * fast (throws) if the environment looks like it is pointed at production
 * Firebase/Google Cloud, so that emulator-only tests can never accidentally
 * touch live infrastructure.
 *
 * What it enforces:
 *  - The Firestore, Auth, Functions, and Storage emulator host env vars are set
 *    (i.e. the Firebase emulator suite is actually running).
 *  - No production-shaped Google/Firebase credentials or endpoints are present.
 *
 * This is a pure guard — it never mutates anything.
 */

const REQUIRED_EMULATOR_VARS = [
  "FIRESTORE_EMULATOR_HOST",
  "FIREBASE_AUTH_EMULATOR_HOST",
  "FIREBASE_STORAGE_EMULATOR_HOST",
] as const;

// Env vars that indicate a production / non-emulator Google Cloud context.
// If any of these are set to a real value, we refuse to run.
const PRODUCTION_INDICATOR_VARS = [
  "GOOGLE_APPLICATION_CREDENTIALS", // service-account key file path
  "GCLOUD_PROJECT", // set by gcloud for real projects
  "GCP_PROJECT", // real project id
  "FIREBASE_CONFIG", // present on deployed Cloud Functions / hosting
] as const;

// Values that are acceptable for the project id in an emulator context.
const EMULATOR_PROJECT_PREFIXES = ["demo-", "saveme-emulator", "test-"];
const EMULATOR_PROJECT_IDS = new Set(["saveme-emulator", "demo-saveme"]);

function isEmulatorProjectId(id: string | undefined): boolean {
  if (!id) return false;
  if (EMULATOR_PROJECT_IDS.has(id)) return true;
  return EMULATOR_PROJECT_PREFIXES.some((p) => id.startsWith(p));
}

export interface EmulatorGuardOptions {
  /** Expected emulator project id. Defaults to "demo-saveme". */
  projectId?: string;
}

/**
 * Assert that we are in a safe emulator context. Throws on any indication of a
 * production target. Returns the resolved emulator project id.
 */
export function assertEmulatorOnly(options: EmulatorGuardOptions = {}): string {
  const projectId = options.projectId ?? "demo-saveme";

  // 1. Emulators must be running.
  const missing = REQUIRED_EMULATOR_VARS.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(
      `[emulator-guard] Refusing to run: emulator env vars not set (${missing.join(
        ", "
      )}). Start the Firebase emulator suite before running tests/seed.`
    );
  }

  // 2. Production credentials / endpoints must NOT be present.
  const productionHits = PRODUCTION_INDICATOR_VARS.filter((v) => {
    const val = process.env[v];
    return val !== undefined && val !== "";
  });
  if (productionHits.length > 0) {
    throw new Error(
      `[emulator-guard] Refusing to run: production-shaped environment detected (${productionHits.join(
        ", "
      )}). Unset these variables before running the emulator harness.`
    );
  }

  // 3. Project id must be an emulator-style id (never the real project id).
  const envProject =
    process.env.GCLOUD_PROJECT ?? process.env.GCP_PROJECT ?? projectId;
  if (!isEmulatorProjectId(envProject)) {
    throw new Error(
      `[emulator-guard] Refusing to run: project id "${envProject}" does not look like an emulator project. ` +
        `Expected one of ${[...EMULATOR_PROJECT_IDS].join(", ")} or a "${EMULATOR_PROJECT_PREFIXES.join(
          '"/"'
        )}" prefix.`
    );
  }

  return envProject;
}

export default assertEmulatorOnly;
