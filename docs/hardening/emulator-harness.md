# SAVE-005 — Emulator Harness

**Status:** M0 infrastructure artifact
**Baseline:** `main @ 569225b68333d165a942dbd7f258cccc3413ca45`
**Lanes:** Atlas Backend — emulator **config + seed** (`firebase.json` `emulators`
block, `test/emulator/seed.ts`, the rules tests). Vector Platform — **root
scripts + CI invocation** (`package.json` scripts, the GitHub Actions workflow).
**Date:** 2026-08-07

This document is the docking contract between the two lanes. Atlas documents his
config/seed interface in his own section; **the section below is Vector
Platform's (V3) interface assumptions**, written so the two halves connect
without either lane editing the other's files.

---

## Vector Platform (V3) — interface assumptions

My deliverables are:
- root `package.json` scripts: `test:emulator`, `test:emulator:ci`, and
  `test:emulator:cleanup`;
- `.github/workflows/emulator-tests.yml`: a CI job that runs the one-command
  emulator path and uploads content-safe artifacts.

These are written against the following assumptions about what Atlas provides.
If Atlas's actual interface differs, the scripts fail loudly (they check for the
seed file and the ports) rather than silently mis-running.

### A1. Emulator suite entry point

Atlas owns the `firebase.json` `emulators` block and the seed. I assume a
one-command runner exists at:

- **`test/emulator/run.mjs`** — starts the emulator suite, waits for readiness,
  seeds, runs the rules tests, and exits non-zero on failure with an explicit
  **no-production guard** (refuses to run unless the project is a `demo-*`
  project and the emulator env vars are set).

My root scripts call this entry point and nothing else. I do not start
emulators directly; the runner owns that.

### A2. Emulator ports (fixed, conventional)

I assume the conventional firebase-tools ports so CI can wait on them and so
artifacts are reproducible:

| Emulator | Port | Env var the runner sets |
|---|---|---|
| Auth | 9099 | `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099` |
| Firestore | 8080 | `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080` |
| Storage | 9199 | `FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199` |
| Functions | 5001 | `FUNCTIONS_EMULATOR=true` |
| Emulator UI | 4000 | (informational) |

If Atlas binds different ports, he must keep the **env var names** stable — the
scripts and CI consume the env vars, not the literals.

### A3. Environment variable contract

The runner and CI share these variables:

- `GCLOUD_PROJECT` — set to a **`demo-saveme`** project (the `demo-` prefix is
  what makes firebase-tools run fully locally with no production credentials).
  This is the no-production guard's primary signal.
- `FIREBASE_AUTH_EMULATOR_HOST`, `FIRESTORE_EMULATOR_HOST`,
  `FIREBASE_STORAGE_EMULATOR_HOST` — set by the runner before tests execute.
- `SAVE_ME_EMULATOR=1` — an explicit opt-in flag my scripts set; the runner
  must refuse to run without it (defense in depth alongside the `demo-` check).

### A4. Seed entry point

Atlas owns `test/emulator/seed.ts`. I assume it:
- is idempotent and deterministic;
- creates the agreed fixture set: **two users, one admin, one read-only agent
  key, one read/write agent key** (per the scaffold README artifact map);
- is invoked by `run.mjs`, not by my scripts directly.

My scripts depend only on `run.mjs` exiting `0` on success.

### A5. What my scripts deliberately do NOT do

- They never set a real (non-`demo-`) project.
- They never read production credentials; the emulator needs none.
- They never weaken `firestore.rules` to make a test pass (M0 guardrail #6).
- They upload only **content-safe** artifacts (see CI § below) — emulator logs
  and JUnit XML, never seeded data dumps or anything resembling user content.

---

## Root `package.json` scripts (deliverable)

Added to the existing `scripts` block (existing scripts untouched):

```json
"test:emulator": "SAVE_ME_EMULATOR=1 GCLOUD_PROJECT=demo-saveme node test/emulator/run.mjs",
"test:emulator:ci": "SAVE_ME_EMULATOR=1 GCLOUD_PROJECT=demo-saveme CI=true node test/emulator/run.mjs --ci --reporter=junit --outputFile=test-results/emulator-junit.xml",
"test:emulator:cleanup": "node test/emulator/run.mjs --cleanup-only"
```

Notes for Atlas:
- `test:emulator` is the local one-command path.
- `test:emulator:ci` asks the runner for a JUnit report at
  `test-results/emulator-junit.xml`; if the runner does not support
  `--reporter=junit`, it should still exit non-zero on failure so CI gates
  correctly (the artifact upload is `if: always()` and tolerant of a missing
  file).
- `test:emulator:cleanup` is a convenience for tearing down any stray emulator
  processes; if the runner has no cleanup mode it may be a no-op that exits 0.

---

## CI invocation (deliverable)

The workflow `.github/workflows/emulator-tests.yml`:
- runs on `push` to `main`/`master`, on `pull_request`, and on
  `workflow_dispatch`;
- sets up Node 22 and Java 21 (the Firestore emulator is a Java jar);
- installs root deps (`npm ci`) and Functions deps (`npm --prefix functions ci`);
- installs `firebase-tools` and runs `npm run test:emulator:ci`;
- exports emulator **logs** and the **JUnit XML** as artifacts via
  `actions/upload-artifact@v4` with `if: always()` — content-safe by contract
  (§A5);
- contains **no secrets** and never authenticates to a real Firebase project.

The full workflow file is a separate deliverable (`.github/workflows/emulator-tests.yml`).

---

*Atlas: confirm A1–A4 or correct them in your section above this one. The
scripts and workflow treat `test/emulator/run.mjs`, the port env vars, and the
`demo-saveme` project as the contract.*

---

## Atlas Backend — emulator config + seed (backend lane)

## 1. Files delivered by this lane

| Path | Purpose |
|---|---|
| `test/emulator/firebase.emulator.json` | Emulator-suite config (Auth, Firestore, Functions, Storage) with fixed local ports. |
| `test/emulator/emulator-guard.ts` | `assertEmulatorOnly()` — fail-fast no-production guard. |
| `test/emulator/seed.ts` | `seedEmulator()` — seeds two users, one admin, one read-only agent key, one read/write agent key. |
| `test/emulator/tenant-isolation.test.ts` | Same-user allow / cross-user deny tests against the actual `firestore.rules`. |

---

## 2. No-production guard (hard requirement)

`assertEmulatorOnly()` (in `test/emulator/emulator-guard.ts`) **must** run before
any seed or test touches the emulators. It throws (fail fast) if any of the
following hold:

1. **Emulators not running** — any of `FIRESTORE_EMULATOR_HOST`,
   `FIREBASE_AUTH_EMULATOR_HOST`, `FIREBASE_STORAGE_EMULATOR_HOST` is unset.
2. **Production-shaped environment present** — any of
   `GOOGLE_APPLICATION_CREDENTIALS`, `GCLOUD_PROJECT`, `GCP_PROJECT`,
   `FIREBASE_CONFIG` is set to a non-empty value.
3. **Non-emulator project id** — the resolved project id is not `demo-saveme`,
   `saveme-emulator`, or does not start with `demo-` / `test-`.

Rationale: the Firebase client SDKs and Admin SDK route to emulators purely via
these env vars; the guard makes a misconfigured run abort instead of silently
hitting live infrastructure.

---

## 3. Interface assumptions Vector must satisfy (CI lane)

These are the exact contracts Vector's root scripts and CI workflow must honor.

### 3.1 Emulator ports (fixed)

| Emulator | Host | Port | Env var the SDK reads |
|---|---|---|---|
| Auth | `127.0.0.1` | `9099` | `FIREBASE_AUTH_EMULATOR_HOST` |
| Firestore | `127.0.0.1` | `8080` | `FIRESTORE_EMULATOR_HOST` |
| Functions | `127.0.0.1` | `5001` | `FUNCTIONS_EMULATOR_HOST` |
| Storage | `127.0.0.1` | `9199` | `FIREBASE_STORAGE_EMULATOR_HOST` |
| Emulator UI | `127.0.0.1` | `4000` | — |

`firebase.emulator.json` already pins these. `singleProjectMode: true` is set so
all emulators share one project id.

### 3.2 Environment variable names (consumed by the harness)

| Variable | Required | Default | Meaning |
|---|---|---|---|
| `FIRESTORE_EMULATOR_HOST` | yes | — | set by `firebase emulators:exec` / `emulators:start` |
| `FIREBASE_AUTH_EMULATOR_HOST` | yes | — | set by the emulator suite |
| `FIREBASE_STORAGE_EMULATOR_HOST` | yes | — | set by the emulator suite |
| `FUNCTIONS_EMULATOR_HOST` | no | — | set by the emulator suite when Functions runs |
| `EMULATOR_PROJECT_ID` | no | `demo-saveme` | override for the emulator project id |
| `FIRESTORE_EMULATOR_PORT` | no | `8080` | read by the tenant-isolation test |

### 3.3 Seed entry point

- **Programmatic:** `import { seedEmulator } from "./test/emulator/seed";` → `await seedEmulator()`.
- **CLI:** `node test/emulator/seed.ts` (via `ts-node`/`tsx` loader, or compiled).

Stable synthetic IDs the tests and CI can rely on:

| Constant | Value | Role |
|---|---|---|
| `TENANT_A_UID` | `emu-tenant-a-00000000000000000001` | regular user A |
| `TENANT_B_UID` | `emu-tenant-b-00000000000000000002` | regular user B |
| `ADMIN_UID` | `emu-admin-000000000000000000000003` | admin user |
| `AGENT_KEY_RO_HASH` | canary sha256 | tenant A read-only key |
| `AGENT_KEY_RW_HASH` | canary sha256 | tenant A read/write key |

### 3.4 Dev dependencies the harness needs (Vector to add to root `package.json`)

- `firebase-tools` (already present at baseline: `^15.14.0`)
- `@firebase/rules-unit-testing` (required by `tenant-isolation.test.ts`)
- `firebase-admin` (already in `functions/package.json`; needed at root for seed)
- A TS runner for the seed/test files: `tsx` or `ts-node` (or compile first)

### 3.5 Suggested invocation shape (Vector implements)

```
firebase emulators:exec --only auth,firestore,functions,storage \
  --project demo-saveme \
  --config test/emulator/firebase.emulator.json \
  "node test/emulator/seed.ts && vitest run test/emulator"
```

(Exact wiring is Vector's; the above is the contract-shaped suggestion.)

---

## 4. Known gaps surfaced by this lane (for Sentinel / SAVE-109)

- **No `storage.rules` exists at baseline.** `firebase.emulator.json` references
  `storage.rules`; until that file is authored (SAVE-109), Storage rule tests
  land as **documented red tests**. The Storage emulator will start without
  rules but enforces nothing meaningful — flagged, not silently passed.
- **`api_keys` revocation is denied by rules.** The tenant-isolation suite
  asserts `deleteDoc` on `api_keys` **fails** even for the owner, documenting the
  broken revocation path from SAVE-001 rather than weakening the rule.

---

## 5. Read-access notes

- Could not verify the CI runner image / Node version Vector will use — assumed
  Node 20 (matches `functions/package.json` `engines.node`).
- Could not verify whether `@firebase/rules-unit-testing` version pinning
  conflicts with the root `firebase@^12.8.0` — Vector to resolve at install time.
