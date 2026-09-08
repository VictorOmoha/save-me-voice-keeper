# ADR 0001 — Browser Extension Authentication

- **Status:** Accepted (Sentinel PASS; Victor approved D-005 on 2026-08-10)
- **Date:** 2026-08-07
- **Deciders:** Vector Platform (client/protocol lead), Sentinel Security (reviewer), Victor (product owner, D-005)
- **Ticket:** SAVE-004
- **Baseline:** `main @ 569225b68333d165a942dbd7f258cccc3413ca45`

---

## Context

The SaveMe.Space Chrome MV3 extension must authenticate a user and act on their
behalf (quick save, category prediction, brain dump). The shipped implementation
has two confirmed insecure mechanisms, verified in source:

1. `browser-extension/content-script.js` relays a Firebase ID token through the
   page's `window` event bus (`saveme:auth-token` / `saveme:request-token`).
   Any script running in the page can capture it.
2. `browser-extension/background.js` accepts a `relay-auth-token` message from
   **any** sender with no sender validation and writes it to
   `chrome.storage.local`.

Compounding this, the stored credential is a **full-scope Firebase ID token**,
there is **no revocation or sign-out propagation**, and the manifest grants
`localhost` and legacy `*.web.app` host permissions while pointing at stale
hash-route URLs on the wrong domain. The threat model
(`docs/hardening/extension-auth-threat-model.md`, T1–T12) enumerates the
exposure. We need an authentication design that is secure by construction and
shippable as an MV3 extension.

## Decision

Adopt a **one-time pairing code exchanged server-side for a revocable,
least-privilege extension credential** (Option B in
`docs/hardening/extension-auth-protocol.md`), over extension-native OAuth.

The credential:
- is **scoped** to `{entries:create, category:predict}` — never a full Firebase
  ID token;
- is **bound** to a server-registered `extensionInstanceId`;
- uses a **short-lived access token held in memory** plus a **rotating refresh
  artifact** at rest;
- is **revocable** by the user, an admin, anomaly detection, and web sign-out;
- is issued only after the user approves the connection on the canonical origin
  `https://saveme.space`.

## Rejected pattern (recorded so it is never restored)

**DOM/window-event token relay.** Passing the Firebase ID token from the web app
to the extension via `window` `CustomEvent`s, and accepting it in the background
worker from any message sender, is rejected because it:
- exposes a full-scope bearer token to any script in the page (T1);
- allows any sender to plant a credential (T2);
- provides no revocation or sign-out propagation (T5);
- invites phishing via the broad `localhost`/`web.app` host permissions (T7).

This pattern is explicitly excluded by M0 guardrail #5 and by the protocol's
non-goals (protocol §9). The implementation is deleted, not patched.

## Options considered

### Option A — Extension-native OAuth (`chrome.identity.launchWebAuthFlow` + PKCE)
Secure and standard, but requires SaveMe to operate an OAuth authorization
server (an authorize endpoint that mints codes for the extension client). More
server surface and more moving parts than the extension's two-call need
justifies today.

### Option B — One-time pairing code → revocable scoped credential (chosen)
A short, single-use, time-boxed code shown to the signed-in user on
`saveme.space`, entered once in the extension, and exchanged directly over HTTPS
for a scoped credential. Produces a least-privilege credential by construction,
keeps the trust decision on the canonical origin, and needs only one issuance
endpoint plus a credential store.

## Rationale

- **Security by construction:** Option B never lets a full Firebase token near
  the extension; the credential it issues is scoped from birth. Option A would
  require restraining a powerful token after issuance.
- **Phishing resistance:** the pairing code is displayed on the real
  `saveme.space`, so the user's trust decision happens on the canonical origin
  (T7).
- **Smallest server change:** one `exchangePairingCode` endpoint plus a
  credential store, versus standing up an OAuth AS.
- **Revocation built in:** a server-side credential record makes sign-out
  propagation, manual revoke, and anomaly revocation straightforward (T5).

## Consequences

**Positive**
- Eliminates T1 (no DOM channel) and T2 (no token-relay message to forge).
- Reduces blast radius of a compromised extension to creating entries in the
  owner's own vault (T8).
- Enables real sign-out and revocation (T5) and clean account switching (T6).

**Negative / accepted**
- One manual step for the user (enter a code). Accepted; the D-005 session will
  weigh this against the OAuth window UX.
- The extension still holds a bearer credential at rest (T3) and a stolen access
  token is replayable for its TTL (T4); both are mitigated and documented as
  accepted risks in the threat model.

**Follow-ups**
- Server work: pairing-code issuance, exchange, refresh, revoke endpoints and the
  `extensionCredentials` collection (post-M0).
- Packaging gate: CI `extension-package` job (SAVE-005 workflow) enforces
  canonical origins and the absence of the relay.
- ADR revisited if SaveMe later needs general third-party OAuth (Option A
  becomes attractive again).

---

*References: `docs/hardening/extension-auth-threat-model.md`,
`docs/hardening/extension-auth-protocol.md`.*
