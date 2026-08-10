# SAVE-004 — Browser Extension Authentication Protocol

**Status:** **RATIFIED by Victor under D-005 on 2026-08-10.** The one-time pairing flow, strict revoke-and-reconnect account model, 15-minute in-memory access tokens, rotating refresh credentials, and recovery behavior in §8 are approved. Sentinel passed the security design. Nothing here is wired into production; SAVE-107 and SAVE-108 own implementation.

**Baseline:** `main @ 569225b68333d165a942dbd7f258cccc3413ca45`
**Author:** Vector Platform (client/protocol lead)
**Reviewer:** Sentinel Security
**Date:** 2026-08-07
**Canonical domain:** `https://saveme.space` (only)

Companion documents:
- Threat model: `docs/hardening/extension-auth-threat-model.md` (T1–T12)
- Decision record: `docs/adr/0001-extension-authentication.md`

---

## 1. Goal

Give the SaveMe.Space MV3 extension a way to authenticate a user and act on
their behalf (quick save, category prediction, brain dump) **without ever
placing a credential in the page DOM**, without accepting credentials from
unvalidated message senders, and with a credential that is scoped, short-lived,
revocable, and bound to one extension instance.

## 2. Non-negotiable invariants

These hold regardless of which connect UX (§3) is chosen:

1. **No credential ever transits the DOM.** No `window` event, no DOM node, no
   `localStorage`/`sessionStorage` hand-off, no `postMessage` between page and
   content script carries a token. (T1)
2. **The background worker is the only writer of credential state.** No
   `chrome.runtime.onMessage` handler accepts a token from a sender. (T2)
3. **Canonical origin only:** `https://saveme.space`. No `localhost`, no
   `*.web.app`, no `*.firebaseapp.com` in the shipping manifest. (T7, T11)
4. **Least privilege:** the extension holds a scoped credential, never a full
   Firebase ID token. (T8)
5. **Revocable:** every extension credential is a server-side record the user or
   an admin can revoke, and web sign-out revokes it. (T5)

## 3. Options considered

### Option A — Extension-native OAuth (`chrome.identity.launchWebAuthFlow`)

The extension opens the SaveMe OAuth/authorization endpoint in a
`launchWebAuthFlow` window; the user signs in (or is already signed in);
SaveMe redirects to the extension's `chromiumapp.org` redirect URL with an
authorization code; the background worker exchanges the code (PKCE) for an
extension credential.

**Pros**
- No DOM involvement; the whole flow is in a browser-controlled auth window.
- Standard OAuth 2.0 + PKCE; well-understood; token exchange is server-to-server.
- User never copies anything; one click from the popup.

**Cons**
- Requires SaveMe to act as an OAuth authorization server (an authorize endpoint
  that mints codes for the extension client). Non-trivial server work.
- `launchWebAuthFlow` UX is a separate window; some users find it abrupt.
- Redirect URI is the per-extension `https://<id>.chromiumapp.org/` — must be
  registered and validated server-side.

### Option B — One-time pairing code, exchanged server-side for a revocable least-privilege credential

The signed-in web app (on `https://saveme.space`) displays a short, single-use,
time-boxed pairing code in Settings → "Connect browser extension." The user
types/pastes that code into the extension popup. The extension's background
worker presents the code directly (HTTPS) to a SaveMe endpoint, which validates
it and returns a revocable, least-privilege extension credential bound to the
user and to a newly-registered extension instance.

**Pros**
- No OAuth server needed; a single `exchangePairingCode` Cloud Function plus a
  credential store.
- The code is displayed on the canonical origin, so the user is looking at the
  real SaveMe when they approve the connection (phishing resistance, T7).
- Naturally produces a **scoped** credential rather than reusing the Firebase
  session (T8).
- Easy to render the connected account and a revoke list in Settings.
- Works identically for the first profile and for additional profiles.

**Cons**
- One manual step (copy/enter a code).
- Code entry UX must be careful (short, human-readable, single-use, short TTL)
  to avoid brute-force and phishing of the code itself.

### Recommendation

**Option B — one-time pairing code exchanged server-side for a revocable
least-privilege extension credential.** It delivers the required security
properties with far less server surface than standing up an OAuth authorization
server, it keeps the user on the canonical origin for the trust decision, and it
produces a scoped credential by construction rather than by restraining a full
Firebase token. Option A remains a viable future upgrade if SaveMe later needs
general third-party OAuth; the credential format in §4.3 is compatible with
either issuance path. See ADR-0001 for the full decision record.

---

## 4. Protocol (recommended: Option B)

### 4.1 Actors and trust boundaries

- **Web app (saveme.space):** authenticated React app; the only place a pairing
  code is displayed. Trust boundary: the page DOM is *untrusted* for credential
  transport — the code is shown to the *human*, never to the page's JS on behalf
  of the extension.
- **Extension background worker (MV3 service worker):** the only extension
  component that talks to the API and the only writer of credential state.
- **Extension popup:** renders UI; asks the background worker to perform actions;
  never holds a token longer than it takes to pass a pairing *code* to the
  background worker (the code is not a credential).
- **SaveMe API (Cloud Functions behind `https://saveme.space/api/…`):** mints
  pairing codes, exchanges them, issues/renews/revokes extension credentials,
  enforces scope.

### 4.2 Pairing-code issuance (web → human)

1. User navigates to `https://saveme.space/settings#connect-extension` while
   signed in.
2. The web app calls `POST /api/extension/pairing-code` with the user's Firebase
   ID token (normal web-auth path, unchanged). The server:
   - generates a code: 8-character Crockford base32 (no ambiguous chars), shown
     as `XXXX-XXXX`;
   - stores a record `{ codeHash, userId, createdAt, expiresAt (10 min), usedAt: null }`;
   - returns the code to display.
3. The page renders the code, the connected account's email, and a clear
   statement: "Enter this code in the SaveMe extension. It expires in 10 minutes
   and can be used once."
4. The code is rendered to the user only. The page must not expose it to the
   extension automatically (that would re-create a DOM bridge).

### 4.3 Pairing-code exchange (extension → server)

1. User opens the extension popup, chooses **Connect**, enters the code.
2. The popup sends the code to the background worker (`chrome.runtime.sendMessage`
   `{action:'pair', code}`). The code is *not* a credential and this message is
   safe; see §5.
3. The background worker generates an `extensionInstanceId` (a random UUID,
   persisted locally) and calls, over HTTPS:
   `POST https://saveme.space/api/extension/pair`
   ```json
   { "code": "XXXX-XXXX", "extensionInstanceId": "uuid", "client": "chrome-mv3/<ext-version>" }
   ```
4. The server validates the code (exists, unexpired, unused, constant-time
   compare against `codeHash`), marks it `usedAt`, creates an extension
   credential record (§4.5), and returns:
   ```json
   {
     "credentialId": "extcred_…",
     "refreshToken": "sme_r_…",        
     "accessToken": "sme_a_…",         
     "accessTokenExpiresAt": 1735689600,
     "scope": ["entries:create", "category:predict"],
     "account": { "userId": "…", "email": "…" }
   }
   ```
5. The background worker stores `refreshToken`, `credentialId`,
   `extensionInstanceId`, and the `account` label in `chrome.storage.local`, and
   holds the `accessToken` **in memory only** (never persisted). The popup is
   told only "connected as <email>" — never the tokens.

### 4.4 Renewal and single-flight (T9)

- Access tokens are short-lived (e.g., 15 minutes). When a save needs a token,
  the background worker returns the in-memory access token if fresh; otherwise
  it renews once:
  `POST /api/extension/refresh` `{ "credentialId", "refreshToken", "extensionInstanceId" }`
  → new short-lived access token (and a rotated refresh token).
- **Single-flight:** the service worker keeps a module-level `renewalPromise`.
  Concurrent save requests during an expired window share the same renewal;
  they do not stampede. On `401`/`403` from refresh, the worker clears state and
  reports signed-out (T5), it does not retry.
- Because MV3 service workers suspend, the access token is treated as
  potentially-stale on every wake; refresh-token renewal is the normal path.

### 4.5 Credential format, scope, and lifecycle (T8)

Server-side record (`extensionCredentials/{credentialId}`):
```json
{
  "userId": "…",
  "extensionInstanceId": "uuid",
  "scope": ["entries:create", "category:predict"],
  "refreshTokenHash": "…",
  "createdAt": "…", "lastUsedAt": "…",
  "revokedAt": null,
  "client": "chrome-mv3/2.0.0"
}
```
- **Scope** is an explicit allowlist enforced server-side on every call,
  independent of the Firebase session. The extension credential can create
  entries and request a category prediction — nothing else. It cannot read
  entries, list data, manage billing, or act on settings.
- **Instance binding:** the server rejects a `refresh`/`use` whose
  `extensionInstanceId` does not match the record, and flags concurrent use from
  two instances (replay signal → auto-revoke + notify).
- **Lifecycle:** created at pair → active → (refreshed many times) → revoked
  (user sign-out, manual revoke, admin, anomaly) or expired. A revoked or
  unknown credential yields `401` and a client-side signed-out transition.

## 5. Extension message surface (T2, T10)

### 5.1 Allowed runtime messages

After the redesign, the complete set of `chrome.runtime.onMessage` actions is:

| Action | Sender constraint | Carries credential? |
|---|---|---|
| `pair` | popup only (`sender.id === chrome.runtime.id`, no `sender.tab`) | No (a one-time code) |
| `sign-out` | popup only | No |
| `quick-save` | popup / context menu path | No (background attaches the token) |
| `start-brain-dump` | internal | No |

Rules enforced in the background worker:
- Reject any message whose `sender.id !== chrome.runtime.id`.
- For tab-originated messages, require `sender.tab?.url` to match the canonical
  origin allowlist.
- **No message action writes credential state.** Pairing writes happen only in
  the background worker after a successful server exchange.
- The legacy `relay-auth-token` action is deleted, not deprecated.

### 5.2 Content script (T10)

The only remaining content-script feature is the brain-dump trigger, which
carries no credential. Recommendation: **remove the content script entirely** and
implement brain-dump via `chrome.tabs.create/update` to
`https://saveme.space/brain-dump?autostart=true` (BrowserRouter real path), so
the extension injects no JavaScript into any page. If the in-page trigger is
kept for UX reasons, it must remain credential-free and origin-locked to
`https://saveme.space`.

## 6. Origin restrictions (T7, T11)

### 6.1 Manifest

Shipping `manifest.json`:
- `host_permissions`: `["*://saveme.space/*"]` — the single canonical origin.
- `content_scripts.matches`: `["*://saveme.space/*"]` (or removed entirely per §5.2).
- No `localhost`, no `*.web.app`, no `*.firebaseapp.com`.

API calls from the background worker go to `https://saveme.space/api/…`, which
Firebase Hosting rewrites to Cloud Functions. This keeps the only required host
permission to the canonical origin and removes the separate
`*.cloudfunctions.net` permission. A **dev-only** `manifest.dev.json` overlay
(re-added `localhost`) exists for local development and is never packaged (T12).

### 6.2 Server-side

- The pairing and refresh endpoints require the web caller's Firebase ID token
  for *code issuance* (web path) and validate origin against the existing
  `ALLOWED_ORIGINS` in `functions/src/billing/safety.ts` (already
  `saveme.space`-canonical).
- Pairing *exchange* and *refresh* are unauthenticated-with-secret (the code /
  refresh token are the secret) and are rate-limited and single-use / rotated.

## 7. Revocation and sign-out (T5)

- **User revoke:** Settings → "Connected browsers" lists each credential
  (client, last used, instance) with a **Revoke** button →
  `POST /api/extension/revoke { credentialId }` (web auth) sets `revokedAt`.
- **Web sign-out:** signs out the Firebase session *and* revokes all extension
  credentials for that user.
- **Extension sign-out:** popup **Sign out** →
  `POST /api/extension/revoke { credentialId }` (with the refresh token as the
  secret) → clear `chrome.storage.local` credential keys and the in-memory
  access token → render the signed-out state.
- **Server-initiated:** anomaly detection (T4) or admin action sets `revokedAt`;
  the extension learns on its next call (401) and transitions to signed-out.

## 8. Approved UX flows (D-005)

> Victor approved the pairing, strict revoke-and-reconnect, 15-minute silent-renewal, and recovery flows below on 2026-08-10.

### 8.1 Connect (first run)
Popup shows "Connect to SaveMe" → opens
`https://saveme.space/settings#connect-extension` in a tab → user copies the
pairing code → pastes into popup → popup shows "Connected as <email>".
*(Alternative for D-005: extension-native OAuth window per Option A — same
credential result.)*

### 8.2 Connected / steady state
Popup shows the connected account email, a save form, and a menu with
**Switch account** and **Sign out**. The category prediction runs against the
scoped credential.

### 8.3 Expiry / renewal
Silent. The user never sees token renewal; a failed renewal surfaces as the
signed-out state, not an error loop.

### 8.4 Sign-out
**Sign out** in the popup revokes the credential and returns the popup to the
"Connect" state with a confirmation toast.

### 8.5 Account switch
**Switch account** revokes the current credential and restarts the connect
flow. If the extension detects the open saveme.space tab is signed into a
*different* account than the paired one (via a non-credential account hint
fetched from the API), it shows "This browser is signed in as <other email> —
switch?" before any save.

### 8.6 Multiple profiles
One credential per browser profile is the supported model (Chrome profiles each
have their own extension storage). Pairing is per-profile. A profile is always
bound to exactly one SaveMe account at a time.

### 8.7 Failure and recovery
- **Invalid/expired code:** inline error, "Code expired or incorrect — generate
  a new one on saveme.space." No lockout on the client; server rate-limits.
- **Network failure on save:** queue locally (existing offline behavior) and
  retry with backoff; do not surface as an auth error.
- **Revoked elsewhere:** next save returns 401 → popup shows "You were signed
  out — reconnect" with a one-click path back to §8.1.

## 9. Explicit non-goals (hard exclusions)

- **No window-event token relay.** The `saveme:auth-token` / `saveme:request-token`
  events and the `relay-auth-token` message are removed, not restored. (M0
  guardrail #5; T1.)
- **No full Firebase ID token in the extension.** (T8.)
- **No credential in `localStorage` / DOM / URL.** Pairing codes are shown to
  humans, never handed to page JS for the extension.
- **No `localhost` or legacy-domain host permissions in the shipping package.**

## 10. Packaging and integrity (T12)

- CI builds the extension from source, strips dev permissions, runs static
  checks (no `saveme:auth-token`, canonical origins only, no `localhost`), and
  emits a SHA-256 checksum artifact. See the SAVE-005 CI workflow's
  `extension-package` job.
- The committed prebuilt zip (`browser-extension/SaveMe-Voice-Keeper-v1.0.0.zip`)
  is removed; store uploads come from CI on tagged commits.

## 11. Logging and observability

- Server logs pairing, exchange, refresh, revoke, and anomaly events with
  `credentialId`, `userId`, `extensionInstanceId`, and outcome — **never** the
  tokens or codes themselves.
- Client logs connection-state transitions (connected / signed-out /
  reconnect-needed) without credential material.

---

## 12. Open security questions for Sentinel

1. **Pairing-code entropy vs. usability.** Is 8-char Crockford base32 (~40 bits)
  with a 10-minute TTL, single-use, and per-IP+per-user rate limiting sufficient,
  or do you want 12 chars? (Trade-off against D-005 UX.)
2. **Instance-binding signal strength.** Is `extensionInstanceId` match +
  concurrent-use detection an adequate replay signal (T4), or should we add a
  per-request nonce/counter stored server-side?
3. **Scope granularity.** Is `{entries:create, category:predict}` the right
  least-privilege set, or should category prediction be folded into the save
  call so the extension holds a single `entries:create` scope (T8)?
4. **At-rest protection.** Given MV3 constraints, is "scoped + revocable +
  refresh-only at rest" an acceptable T3 posture, or do you require OS keychain
  integration (which Chrome does not expose uniformly to extensions)?
5. **Revocation propagation latency.** Is next-call 401 detection acceptable for
  sign-out propagation (T5), or is a push/invalidation channel required?

---

*End of SAVE-004 protocol. Decision record: `docs/adr/0001-extension-authentication.md`.*
