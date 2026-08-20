# Deployment Preview — Rules & Config (SAVE-109)

**Ticket:** SAVE-109 (M1) · **Scope:** source/CI hardening only · **Baseline:** `main @ 761beabeca85e04c02a4feb618263082ba63a04e`

This note aligns `firebase.json` with the emulator harness and documents how
Storage/Firestore rules changes are previewed and (separately) authorized for
production. **SAVE-109 does not deploy rules to production.**

---

## 1. What `firebase.json` now declares

| Block | Change | Why |
|---|---|---|
| `firestore.rules` / `storage.rules` | unchanged paths (`firestore.rules`, `storage.rules`) | Single source of truth, shared by emulator and deploy. |
| `emulators` | **added** — auth 9099, firestore 8080, functions 5001, storage 9199, ui 4000, `singleProjectMode: true`, all on `127.0.0.1` | Mirrors `firebase.emulator.json` and the harness (`test/emulator/run.mjs` `PORTS`) so a bare `firebase emulators:start` resolves the same fixed ports the CI lane and `docs/hardening/emulator-harness.md` §3.1 contract on. |
| `functions` / `hosting` | unchanged | Out of SAVE-109 scope. |

The `emulators` block is emulator-only; `firebase deploy` ignores it. The CI
harness still launches via `firebase emulators:exec --config firebase.emulator.json`
(root copy), which is unchanged — the new block only helps local, non-harness
emulator use.

## 2. How rules are previewed (emulator-only)

Rules changes are validated exclusively against the emulator suite — never
against production:

```
npm run test:emulator      # local: guard + emulators:exec + seed + vitest
npm run test:emulator:ci   # CI: same, JUnit output to test-results/
```

The harness (`test/emulator/run.mjs`):

1. Refuses to run without `SAVE_ME_EMULATOR=1` and an emulator-style project id
   (`demo-*` / `test-*` / `saveme-emulator`), and aborts if production-shaped
   env (`GOOGLE_APPLICATION_CREDENTIALS`, `GCP_PROJECT`, `FIREBASE_CONFIG`) is set.
2. Starts auth, firestore, functions, storage on the fixed ports.
3. Seeds synthetic tenants, then runs `test/emulator/*.test.ts`
   (`tenant-isolation` for Firestore, `storage-isolation` for Storage).

There is **no** `firebase deploy --only firestore:rules` / `--only storage`
step anywhere in CI. The only deploy workflow (`.github/workflows/deploy.yml`)
ships **Hosting only**.

## 3. Production deployment authorization plan (separate, manual)

> This is a **plan**, not an executed action. SAVE-109 explicitly does not
> deploy. Rules reach production only through the gated process below.

**Preconditions**
- [ ] SAVE-109 PR merged to `main` after review (not merged by the agent).
- [ ] Full emulator matrix green on `main` (Firestore + Storage).
- [ ] `npm run build`, `npm run lint`, `npm test`, `npm audit --audit-level=high` green.

**Authorization**
- [ ] Victor explicitly approves the production rules deploy (outward action).
- [ ] Deploy is run by an authorized human with a service account holding
      `Firebase Rules Admin` on project `saveme-f5af0` (`.firebaserc`).

**Command (manual, from a clean `main`)**
```
firebase deploy --only firestore:rules,storage --project saveme-f5af0
```

**Verification after deploy**
- [ ] Confirm in the Firebase console that the rules version timestamp advanced.
- [ ] Re-run the emulator matrix against the deployed rules text (byte-compare
      `storage.rules` / `firestore.rules` to the deployed version).
- [ ] Smoke-check one owner upload and one cross-tenant denial on a staging
      bucket before declaring done.

**Rollback**
- Rules are versioned; rollback = redeploy the prior rules content from the
  previous `main` tag and re-verify. Keep the previous `storage.rules` /
  `firestore.rules` blob available until the new version is confirmed.

**Blast-radius note**
- The size ceilings and content-type allowlists are **enforcing** changes. Any
  existing client that uploads a type/shape outside the allowlist will begin to
  fail. Before authorization, confirm no production client depends on a now-
  rejected type or oversized object (the known clients — `ImageUpload.tsx`,
  `documentStorage.ts` — are within limits).

---

## 4. Known limitations

- `request.resource.contentType` is client-supplied metadata, not magic-byte
  verification. The allowlists are a contract/validation layer; malware/content
  scanning is a separate server-side concern.
- Admin/demo publication is **Admin-SDK-only** (server-side, bypasses rules).
  The custom-claim convention (`admin == true`) is documented and tested as
  carrying **no** Storage client-write privilege; there is intentionally no
  Storage rule that reads a client-readable Firestore role document.
