#!/usr/bin/env node
/**
 * SAVE-005 — One-command emulator harness runner.
 *
 * This is the entry point both lanes documented but neither owned: Atlas's
 * backend lane supplied the emulator config, no-production guard, seed, and
 * tenant-isolation tests; Vector's CI lane supplied the root scripts and GitHub
 * Actions workflow that invoke this file. Chief O wrote this runner to dock the
 * two lanes (cross-lane gap reconciliation per the M0 orchestration charter).
 *
 * What it does, in order:
 *   1. Enforces the no-production guard (refuses to run unless SAVE_ME_EMULATOR=1
 *      and the project is a demo-* / emulator-style id, and no production-shaped
 *      env vars are present).
 *   2. Starts the Firebase emulator suite via firebase-tools (Auth, Firestore,
 *      Functions, Storage) using test/emulator/firebase.emulator.json.
 *   3. Waits for emulator readiness on the fixed ports.
 *   4. Seeds the synthetic fixture (test/emulator/seed.ts) via `npx tsx`.
 *   5. Runs the rules tests (test/emulator/*.test.ts) against the emulator.
 *   6. Exits non-zero on any failure; always tears down emulators.
 *
 * Flags:
 *   --cleanup-only   tear down any stray emulator processes and exit 0.
 *   --ci             CI mode: keep output terse; tests run with the configured
 *                    reporter (see --reporter/--outputFile passthrough).
 *   --reporter=<r>   passed through to the test runner (e.g. junit).
 *   --outputFile=<p> passed through to the test runner (e.g. test-results/...).
 *
 * Env contract (see docs/hardening/emulator-harness.md):
 *   SAVE_ME_EMULATOR=1            required opt-in flag (defense in depth).
 *   GCLOUD_PROJECT=demo-saveme    emulator-style project id (required).
 *   FIREBASE_AUTH_EMULATOR_HOST / FIRESTORE_EMULATOR_HOST /
 *   FIREBASE_STORAGE_EMULATOR_HOST  set by this runner before tests execute.
 *   EMULATOR_PROJECT_ID           optional override (must stay emulator-style).
 *
 * This file never reads production credentials and never authenticates to a
 * real Firebase project. It contains no secrets.
 */

import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const EMULATOR_CONFIG = path.join(REPO_ROOT, "firebase.emulator.json");
const SEED_FILE = path.join(__dirname, "seed.ts");
const TEST_GLOB_DIR = __dirname;

// Fixed ports — must match firebase.emulator.json and
// docs/hardening/emulator-harness.md (both lanes' contract).
const PORTS = {
  auth: 9099,
  firestore: 8080,
  functions: 5001,
  storage: 9199,
  ui: 4000,
};

// Resolve every supported project source before the no-production check. An
// inherited GCLOUD_PROJECT must never be silently replaced: if it names a real
// project, assertNoProduction() rejects it before firebase-tools is spawned.
const PROJECT_ID =
  process.env.EMULATOR_PROJECT_ID ??
  process.env.GCLOUD_PROJECT ??
  "demo-saveme";
const IS_CI = process.env.CI === "true" || process.argv.includes("--ci");

function log(...args) {
  console.log("[emulator-run]", ...args);
}
function fail(msg) {
  console.error(`[emulator-run] ERROR: ${msg}`);
  process.exit(1);
}

// ─── No-production guard ─────────────────────────────────────────────────────
// Mirrors test/emulator/emulator-guard.ts but self-contained (this runner is a
// plain .mjs executed before any TS toolchain is guaranteed).
function assertNoProduction() {
  if (process.env.SAVE_ME_EMULATOR !== "1") {
    fail(
      "SAVE_ME_EMULATOR=1 is not set. This harness is emulator-only and refuses " +
        "to run without the explicit opt-in flag."
    );
  }
  const productionIndicators = [
    "GOOGLE_APPLICATION_CREDENTIALS",
    "GCP_PROJECT",
    "FIREBASE_CONFIG",
  ].filter((v) => process.env[v]);
  if (productionIndicators.length > 0) {
    fail(
      `production-shaped environment detected (${productionIndicators.join(
        ", "
      )}). Unset these before running the emulator harness.`
    );
  }
  const emulatorStyle =
    PROJECT_ID === "demo-saveme" ||
    PROJECT_ID === "saveme-emulator" ||
    PROJECT_ID.startsWith("demo-") ||
    PROJECT_ID.startsWith("test-");
  if (!emulatorStyle) {
    fail(
      `project id "${PROJECT_ID}" is not emulator-style (expected demo-*/test-*/saveme-emulator).`
    );
  }
  if (!fs.existsSync(EMULATOR_CONFIG)) {
    fail(`emulator config not found at ${EMULATOR_CONFIG}`);
  }
  if (!fs.existsSync(SEED_FILE)) {
    fail(`seed file not found at ${SEED_FILE} (Atlas's lane must provide it).`);
  }
}

// ─── Cleanup mode ────────────────────────────────────────────────────────────
function cleanupOnly() {
  log("cleanup-only: terminating any stray emulator processes on fixed ports.");
  // Best-effort: kill processes listening on the emulator ports (POSIX).
  for (const port of Object.values(PORTS)) {
    try {
      spawnSync("sh", ["-c", `command -v fuser >/dev/null && fuser -k ${port}/tcp || true`], {
        stdio: "ignore",
      });
    } catch {
      /* ignore */
    }
  }
  process.exit(0);
}

// ─── Port readiness ──────────────────────────────────────────────────────────
function waitForPort(port, host = "127.0.0.1", timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const sock = new net.Socket();
      sock
        .once("connect", () => {
          sock.destroy();
          resolve(true);
        })
        .once("error", () => {
          sock.destroy();
          if (Date.now() > deadline) reject(new Error(`port ${port} not ready`));
          else setTimeout(attempt, 500);
        })
        .connect(port, host);
    };
    attempt();
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  if (process.argv.includes("--cleanup-only")) cleanupOnly();
  assertNoProduction();

  log(`starting emulator suite (project=${PROJECT_ID}, ci=${IS_CI})`);

  // Start emulators. Use firebase-tools' emulators:exec to own the lifecycle so
  // teardown is guaranteed even on test failure.
  const env = {
    ...process.env,
    GCLOUD_PROJECT: PROJECT_ID,
    FIREBASE_AUTH_EMULATOR_HOST: `127.0.0.1:${PORTS.auth}`,
    FIRESTORE_EMULATOR_HOST: `127.0.0.1:${PORTS.firestore}`,
    FIREBASE_STORAGE_EMULATOR_HOST: `127.0.0.1:${PORTS.storage}`,
    FUNCTIONS_EMULATOR: "true",
  };

  // Command executed inside the emulator context: seed, then run tests.
  // The seed and tests are TypeScript; run them through the repo's TS runner.
  // SAVE-005 remediation (Sentinel F-005-3): switched the seed off the absent
  // `ts-node` loader (`node --loader ts-node/esm`) onto `tsx`, which is declared
  // in the root devDependencies. `tsx` is a self-contained ESM TS runner (no
  // separate loader flag, no ts-node dependency) and executes seed.ts directly.
  // Vector's scripts may pass --reporter/--outputFile; forward them to vitest.
  const passthrough = process.argv
    .slice(2)
    .filter((a) => a.startsWith("--reporter") || a.startsWith("--outputFile"))
    .join(" ");

  // SAVE-005 remediation: run vitest with the dedicated emulator config so the
  // rules tests use the Node environment (not the default jsdom + DOM setup
  // that the React unit suite needs). See vitest.emulator.config.ts.
  const seedCmd = `npx tsx "${SEED_FILE}"`;
  const testCmd = `npx vitest run --config "${path.join(
    REPO_ROOT,
    "vitest.emulator.config.ts"
  )}" ${passthrough}`.trim();
  const inner = `${seedCmd} && ${testCmd}`;

  const args = [
    "emulators:exec",
    "--only",
    "auth,firestore,functions,storage",
    "--project",
    PROJECT_ID,
    "--config",
    EMULATOR_CONFIG,
    inner,
  ];

  log("exec:", "npx firebase", args.join(" "));
  const child = spawn("npx", ["firebase", ...args], {
    cwd: REPO_ROOT,
    env,
    stdio: "inherit",
    shell: false,
  });

  child.on("error", (err) => fail(`failed to launch firebase-tools: ${err.message}`));
  child.on("exit", (code) => {
    if (code === 0) {
      log("emulator harness completed successfully.");
    } else {
      console.error(`[emulator-run] harness failed with exit code ${code}.`);
    }
    process.exit(code ?? 1);
  });
}

main().catch((err) => fail(err?.message ?? String(err)));
