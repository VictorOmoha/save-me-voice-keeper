# SAVE-005 — Emulator Harness (Backend Lane) — Interface Contract

**Ticket:** SAVE-005 (M0 Foundation Sprint) · **Tracking:** GitHub issue #11
**Baseline:** `main @ 569225b68333d165a942dbd7f258cccc3413ca45`
**Author:** Atlas Backend (backend/emulator lane) · **Date:** 2026-08-07
**Scope boundary:** This document covers the **backend lane only** — the emulator
configuration, no-production guard, seed, and tenant-isolation tests under
`test/emulator/`. **Vector Platform owns the root `package.json` scripts and the
CI workflow invocation.** This file is the interface contract between the two
lanes.

> **M0 status.** This is test infrastructure only. No production behavior
> changes. The guard below is designed to make it impossible for the harness to
> touch production.

---

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
