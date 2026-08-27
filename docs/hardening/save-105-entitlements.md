# SAVE-105 — Server-authoritative entitlements

**Baseline:** `761beab`  
**Catalog authority:** ratified D-004 (`decisions/d-004-commercial-contract.md`)

## Implemented contract

`functions/src/entitlements/entitlements.ts` is the centralized server catalog and policy boundary. It reads the server-owned `billing_entitlements/{uid}` contract through `readUserEntitlements` and recognizes only `free`, `basic`, and `premium`. After SAVE-106 projection, paid capabilities require both a recognized paid `plan` and `entitled: true`; terminal lifecycle states therefore fail closed to Free. Client-writable `users/{uid}` profile fields are not plan authority.

- Missing user document or missing/null/blank plan defaults to Free for migration.
- An explicit unknown plan fails closed with HTTP 403 and `ENTITLEMENT_UNKNOWN_PLAN`.
- Errors use `{ "error": { "code": "...", "message": "...", "details": {...} } }`.
- Free: 50 entries, 500 MiB.
- Basic: unlimited entries, 5 GiB, browser extension, advanced search.
- Premium: unlimited entries, 50 GiB, browser extension, advanced search, agent API.
- Voice/AI and portable export are universal named contracts.

## Representative enforcement

- `quickSave`: authenticates, reads `billing_entitlements/{uid}`, requires browser-extension access (Basic+), and creates through an atomic Free entry reservation helper. Unknown plans and over-quota requests fail before the write.
- Shared-memory API: user-minted and explicitly owner-bound legacy agent-key requests are checked against the owning user's Premium plan on every representative endpoint, not only at key creation. The historical unbound fallback remains compatible outside production; production fails closed unless `ALLOW_LEGACY_AGENT_FALLBACK=true` is deliberately set during migration.
- `sharedMemorySearch`: server-owned advanced-search path requires Basic+ (and Premium when reached via agent key).
- `storageUploadAdmission`: authenticated admission contract reads server-owned `storage_usage/{uid}` and checks the catalog byte ceiling.
- Export: `assertPortableExportAccess` is the universal capability contract; existing export service behavior remains ungated on every plan.
- Voice/AI: catalog contract is explicitly universal; existing authenticated voice paths remain available to all plans.

## Residual rule/client migration (intentional; do not fake numeric security)

Current browser clients still write directly to Firestore `entries` and Firebase Storage. Firestore/Storage rules cannot safely count arbitrary owned entries or sum object bytes, and `users/{uid}` is currently client-writable. Therefore this ticket does **not** pretend those direct paths are quota-secure.

Required migration:

1. Move all entry creates (including voice `saveEntry` and web UI creation) to a callable/HTTP server creator backed by `createEntryWithAdmission`; then deny direct `entries` creates in Firestore rules. Entry deletes must decrement/reconcile `entitlement_usage/{uid}` server-side.
2. Populate `billing_entitlements/{uid}.plan` from trusted billing/admin automation before rollout. Firestore rules deny client writes; client-writable `users/{uid}.subscriptionTier` is intentionally ignored.
3. Move uploads to a reservation/finalization service. Deny direct Storage creates/updates after clients migrate. Storage rules should retain owner/type/per-object-size checks but must not be presented as aggregate-plan enforcement.
4. Update clients to consume stable entitlement errors and remove duplicated plan capability/quota copies (for example `useStorageStats` fallbacks and UI gates).

## SAVE-106 upload contract

`storageUploadAdmission` accepts authenticated POST `{requestedBytes}` and returns `{ok, admitted, plan, requestedBytes, usedBytes, limitBytes}` or the stable error envelope. SAVE-106 must extend this into a race-safe lifecycle:

1. Atomically reserve `requestedBytes` in a server-owned usage ledger and return a short-lived, single-object upload authorization/reservation ID.
2. Bind reservation to uid, canonical object path, exact/max bytes, content type, and expiry.
3. Finalize from trusted Storage events using actual object size; convert reserved to committed bytes idempotently.
4. Release expired/failed reservations and decrement on verified delete/replacement.
5. Reconcile ledger totals from bucket inventory and alert on drift.
6. Only after client migration, deny direct unreserved Storage writes.

The admission endpoint in SAVE-105 is deliberately a contract/check, not an upload authorization; callers must not treat `admitted: true` as a race-safe reservation.

## Deployment configuration

- Create server-owned `billing_entitlements/{uid}` documents with `plan: "free" | "basic" | "premium"` for paid accounts. Missing documents resolve to Free.
- Bind the legacy global credential with `AGENT_USER_ID=<firebase uid>` so normal Premium enforcement applies.
- If the legacy integration cannot be owner-bound before deployment, `ALLOW_LEGACY_AGENT_FALLBACK=true` is an explicit temporary production migration escape hatch. Without it, an unbound legacy key fails closed in production. Remove the flag after binding/migration.
- Configure Firestore TTL on `service_abuse_counters.expires_at`.
