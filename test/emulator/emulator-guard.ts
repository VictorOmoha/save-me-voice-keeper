/**
 * SAVE-005 — No-production guard for the emulator harness.
 *
 * This module MUST be imported before any emulator test or seed runs. It fails
 * fast (throws) if the environment looks like it is pointed at production
 * Firebase/Google Cloud, so that emulator-only tests can never accidentally
 * touch live infrastructure.
 *
 * What it enforces:
 *  - The Firestore, Auth, and Storage emulator host env vars are set
 *    (i.e. the Firebase emulator suite is actually running).
 *  - No production-shaped Google/Firebase credentials or endpoints are present.
 *  - The RESOLVED project id is emulator-style ("demo-" / "test-" prefixed, or
 *    saveme-emulator).
 *
 * SAVE-005 remediation (Sentinel F-005-1):
 *  GCLOUD_PROJECT is no longer treated as a blanket presence-based production
 *  indicator. The harness itself (test/emulator/run.mjs and the root
 *  package.json scripts) injects GCLOUD_PROJECT=demo-saveme, and gcloud-style
 *  tooling sets GCLOUD_PROJECT for BOTH real and demo projects — so mere
 *  presence is not a production signal. Instead, GCLOUD_PROJECT participates in
 *  project-id resolution (step 3 below) and is refused only when it holds a
 *  NON-emulator-style value. FIREBASE_CONFIG is also not a blanket refusal:
 *  firebase-tools sets it inside `emulators:exec`. Safety still requires every
 *  emulator host plus an emulator-style resolved project id. GCP_PROJECT and
 *  GOOGLE_APPLICATION_CREDENTIALS remain presence-based refusals.
 *
 * This is a pure guard — it never mutates anything.
 */

const REQUIRED_EMULATOR_VARS = [
  "FIRESTORE_EMULATOR_HOST",
  "FIREBASE_AUTH_EMULATOR_HOST",
  "FIREBASE_STORAGE_EMULATOR_HOST",
] as const;

// Env vars that indicate a production / non-emulator Google Cloud context and
// are ONLY ever set by real infrastructure. If any of these is set to a
// non-empty value, we refuse to run. (GCLOUD_PROJECT is deliberately NOT in
// this list — see the header comment; it is evaluated by value in step 3.)
const PRODUCTION_INDICATOR_VARS = [
  "GOOGLE_APPLICATION_CREDENTIALS", // service-account key file path
  "GCP_PROJECT", // real project id (never set by the emulator harness)
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
  //    (presence-based: these vars only exist in real, non-emulator contexts)
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

  // 3. The RESOLVED project id must be emulator-style (never the real id).
  //    GCLOUD_PROJECT is evaluated BY VALUE here: demo-saveme / demo-* / test-*
  //    / saveme-emulator are allowed; a real project id (e.g. saveme-f5af0) is
  //    refused. This is the branch Sentinel F-005-1 requires to be demonstrable
  //    in both directions.
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
