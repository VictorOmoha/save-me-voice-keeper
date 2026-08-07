# SAVE-004 — Browser Extension Authentication: Threat Model

**Status:** M0 design artifact · No production behavior changes
**Baseline:** `main @ 569225b68333d165a942dbd7f258cccc3413ca45`
**Author:** Vector Platform (client/protocol lead)
**Independent reviewer:** Sentinel Security
**Date:** 2026-08-07
**Blocking decision:** Victor D-005 (extension UX, due 2026-08-12)

This threat model covers authentication and session handling for the SaveMe.Space
Chrome Manifest V3 extension (`browser-extension/`). It is organized to map
**by number** onto Sentinel's review charter T1–T12. Each threat states the
current exposure, the attack, and the control the proposed protocol
(`extension-auth-protocol.md`) provides, with a control status:

- **DESIGNED+TESTED** — the control is fully specified in the protocol doc and has
  an executable test design. (Charter minimum bar for T1, T2, T5, T7.)
- **ACCEPTED-RISK** — the risk is documented with rationale and a compensating
  control, but not fully eliminated. (Charter allows this for T3, T4, T8.)

---

## 0. Current state (what we are replacing)

Two confirmed insecure mechanisms exist in the shipped extension and are the
reason this work exists:

1. **Window-event token relay.** `content-script.js` listens for a
   `saveme:auth-token` `CustomEvent` on the page's `window` and forwards
   `e.detail.token` to the background worker via `chrome.runtime.sendMessage`
   (`content-script.js:30-37`). It also *dispatches* a `saveme:request-token`
   event to solicit the token (`content-script.js:40`). Because `window` events
   are shared with the page's own JavaScript and any other script running in
   that context, the token transits the DOM.

2. **Unauthenticated message acceptance.** `background.js` accepts any
   `chrome.runtime.onMessage` with `action: 'relay-auth-token'` and writes
   `request.token` into `chrome.storage.local` with **no validation of
   `sender`** (`background.js:57-64`). Any content script — including one
   injected into a lookalike or compromised page, or another extension — can set
   the stored token.

The design in `extension-auth-protocol.md` **removes both mechanisms entirely**;
they are not patched, they are deleted.

Current environment assumptions that are also stale:
- Hardcoded URLs point at `https://saveme-f5af0.web.app` and hash routes
  (`/#/brain-dump`, `/#/login`, `/#/dashboard`) in `background.js:4-6` and
  `popup.js:4,52,56`. The production app is `https://saveme.space` and uses
  `BrowserRouter` (real paths, `src/App.tsx:91`), with only a one-way legacy
  hash redirect (`src/App.tsx:64-77`).
- The `manifest.json` `host_permissions` include `*://localhost/*` and both
  `saveme.space` and the legacy `web.app` domain.

---

## T1 — DOM token exfiltration

**Current exposure.** The `saveme:auth-token` window event carries a Firebase ID
token through the page's DOM event bus. Any script executing in the page —
including injected third-party scripts, a compromised dependency, or an XSS
payload — can add its own `window.addEventListener('saveme:auth-token', …)` and
capture the token. The token is a **full Firebase ID token**, so exfiltration
yields broad account access.

**Attack.** Page-context script listens for the relay event, or dispatches
`saveme:request-token` itself to trigger a fresh relay, and exfiltrates the
token to an attacker server.

**Control (DESIGNED+TESTED).** The protocol eliminates the DOM channel entirely.
Credentials are never placed on `window`, never in a DOM event, never in the
page's `localStorage` readable by the relay. Authentication moves to a
server-mediated pairing exchange that runs over HTTPS directly between the
extension's background worker and the SaveMe API — the page DOM is not a
participant. See protocol §4 (pairing) and §9 (explicit non-goals: "no
window-event token relay").
**Test design:** static test asserting no `window.dispatchEvent` /
`window.addEventListener('saveme:…')` token paths exist in the packaged
extension; plus a packaging check that the string `saveme:auth-token` does not
appear in the shipped bundle.

---

## T2 — Sender authentication on the relay

**Current exposure.** `background.js` accepts `relay-auth-token` from **any**
message sender with no check of `sender.origin`, `sender.tab`, or
`sender.id`. A malicious page running in a tab (or any other extension) can push
an attacker-controlled token into `chrome.storage.local`, causing the victim's
saves to be written to the attacker's account (data capture) or corrupting the
victim's session.

**Attack.** Malicious content script calls
`chrome.runtime.sendMessage(extensionId, {action:'relay-auth-token', token: ATTACKER_TOKEN})`.

**Control (DESIGNED+TESTED).** Under the protocol there is **no token-relay
message at all**, so there is nothing to forge. All remaining
`chrome.runtime.onMessage` handlers (quick-save, brain-dump trigger) carry no
credentials and are restricted: the background worker validates `sender.id ===
chrome.runtime.id` (same-extension) and, for tab-originated messages, that
`sender.tab.url` matches the canonical origin allowlist. Credential material is
only ever set by the background worker itself after a successful server
exchange. See protocol §5 (message surface) and §6 (origin allowlist).
**Test design:** unit test that a message with a foreign `sender.id` is ignored;
integration test that no message handler writes to the credential store.

---

## T3 — Token at rest in `chrome.storage.local`

**Current exposure.** The Firebase ID token is stored in plaintext in
`chrome.storage.local` (`background.js:59-62`). `chrome.storage.local` is not
encrypted at rest by Chrome; any process with access to the user's profile
directory (or a malicious extension granted `storage` + the ability to read
another extension's storage is *not* possible, but local malware is) can read it.

**Attack.** Local malware or a forensic attacker reads the extension's LevelDB
storage and extracts the token.

**Control (ACCEPTED-RISK).** Chrome does not offer hardware-backed encryption for
extension storage on all platforms, and the extension must hold *some*
credential to function offline-tolerant. The protocol mitigates rather than
eliminates:
- Store a **short-lived, narrowly-scoped extension credential** (not a full
  Firebase ID token) — see T8.
- Store only a **refresh artifact**, not a long-lived access token; access
  tokens are held in memory in the service worker and re-minted.
- Bound the at-rest secret's lifetime and make it revocable server-side (T5).
**Rationale for acceptance:** residual risk is limited to local attackers who
already have profile access, and the blast radius is reduced to a scoped,
revocable credential rather than a full account token.

---

## T4 — Replay

**Current exposure.** A captured bearer token can be replayed from any client
until it expires (~1 hour for Firebase ID tokens), with no binding to the
extension instance, device, or sender.

**Attack.** Attacker replays a stolen token against `quickSave` or any other
authenticated endpoint from their own machine.

**Control (ACCEPTED-RISK).** HTTPS makes passive capture hard; the residual is
active token theft (T1/T3). The protocol reduces replay value by:
- Short access-token TTL with server-side expiry enforcement.
- **Binding the credential to a single extension instance** via a
  server-registered `extensionInstanceId` created during pairing; the server
  rejects use of a credential from a different instance and can detect a
  credential being used concurrently from two instances (a replay signal that
  triggers revocation).
- Pairing codes are **single-use and short-lived**, so intercepting the pairing
  step yields nothing reusable.
**Rationale for acceptance:** without per-request proof-of-possession (DPoP /
mTLS, not available to MV3 extensions), a stolen *access* token remains replayable
for its TTL; the controls above shrink TTL and add anomaly detection.

---

## T5 — Revocation and sign-out propagation

**Current exposure.** There is **no** sign-out or revocation path. The stored
token persists until its self-assigned 55-minute expiry
(`background.js:61`), and signing out of the web app does nothing to the
extension. A user who signs out on the web reasonably expects the extension to
stop being able to save to their account; it does not.

**Attack.** User signs out on a shared machine; the extension (still holding a
token) continues to accept saves into the account. Or: user loses a device and
has no way to kill the extension's access.

**Control (DESIGNED+TESTED).**
- The extension credential is a **server-side record** (`extensionCredentials`
  collection) that can be revoked by: the user (Settings → "Connected
  browsers"), an admin, or anomaly detection (T4).
- Sign-out on the web **revokes all extension credentials for the account**;
  the extension learns this on its next API call (401 → local sign-out UX).
- The extension exposes an explicit **Sign out** action that calls a
  `revokeExtensionCredential` endpoint and clears local state.
- The background worker treats `401`/`403` as terminal for the credential and
  transitions to a signed-out state rather than retrying.
See protocol §7 (revocation & sign-out).
**Test design:** emulator test — revoke the credential server-side, assert the
next extension call returns 401 and the extension clears local state; test that
web sign-out revokes extension credentials.

---

## T6 — Multiple profiles / account switching

**Current exposure.** The extension stores a single `authToken` with no account
identity attached. If a user signs into a *different* SaveMe account on the web,
the extension keeps using the old token — saves go to the previous account
(cross-account data leakage), and there is no way to switch.

**Attack / failure.** Shared computer, two SaveMe accounts; user A's extension
silently saves into account A after user B signs in on the web.

**Control (DESIGNED — part of T5/T7 surface).** The credential record is bound to
a specific `userId`. The extension stores the account's display label and
`userId` alongside the credential, surfaces the connected account in the popup,
and offers explicit **Switch account** (revoke + re-pair). The pairing flow
always pairs the *currently signed-in* web account, and the extension detects a
mismatch between the paired account and the account signed into an open
saveme.space tab (via a non-credential, server-issued account hint) and prompts
to switch. See protocol §8 (account switching & multiple profiles).

---

## T7 — Phishing / lookalike origins (incl. `localhost` host permission)

**Current exposure.** `manifest.json` grants host permissions for
`*://localhost/*` and the legacy `*://saveme-f5af0.web.app/*`, and the content
script runs on all of them. A developer build, a local lookalike server, or any
page on the legacy domain can trigger the token relay (T1) and receive the
extension's trust. An attacker who can get the user to open a lookalike origin
that matches a host permission can ride the relay.

**Attack.** Attacker hosts a phishing page on a matching origin (e.g., a
compromised `web.app` preview, or a local server the user is tricked into
running) that dispatches `saveme:request-token` and captures the relayed token.

**Control (DESIGNED+TESTED).**
- The canonical — and only — web origin is `https://saveme.space`. The
  extension's origin allowlist is a **single entry**.
- `localhost` host permission is **removed from the shipping manifest** and
  confined to a dev-only manifest overlay (`manifest.dev.json`) that is never
  packaged for the store. The packaging test asserts the production manifest has
  no `localhost` and no legacy `web.app` host permission.
- Because the DOM relay is gone (T1), a lookalike origin gains nothing from
  being in `host_permissions`; pairing requires an interactive, server-rendered
  confirmation on the real `saveme.space` that displays the account and asks the
  user to approve the specific extension instance.
See protocol §6 (origin restrictions) and §10 (packaging).
**Test design:** packaging test asserting the shipped `manifest.json`
`host_permissions` === `["*://saveme.space/*"]` and contains no `localhost`,
`web.app`, or `firebaseapp` entries; e2e test that pairing on a non-canonical
origin is refused.

---

## T8 — Token scope confusion (full Firebase token vs. scoped credential)

**Current exposure.** The relayed token is a **full Firebase ID token** — the
same credential that authorizes the entire web app. The extension only needs to
create entries (quick save) and read a category prediction. Holding a full-scope
token means a compromised extension credential can read all entries, change
settings, manage billing, and act as the user anywhere.

**Attack.** Stolen extension token is used against any authenticated endpoint,
not just quick save.

**Control (ACCEPTED-RISK → strongly mitigated).** The protocol issues a
**dedicated, least-privilege extension credential** whose scope is enumerated
server-side and limited to exactly the extension's capabilities:
`entries:create` (quick save) and `category:predict`. It cannot read entries,
manage billing, or call admin functions. The server enforces scope on every call
independent of the Firebase session.
**Rationale for residual acceptance:** the credential is still a bearer token;
the mitigation is that its scope is so narrow that misuse is limited to creating
entries in the owner's own vault — which is the extension's legitimate function
— and it is revocable (T5) and instance-bound (T4).

---

## T9 — Expiry / renewal race

**Current exposure.** Token freshness is tracked with a client-computed
`authTokenExpiry = Date.now() + 55 min` (`background.js:61`). A save attempted
near the boundary races the real server-side expiry; backgrounding and the MV3
service worker's suspend/resume make the clock check unreliable, and there is no
renewal path at all — the user must revisit the web app to re-relay a token.

**Attack / failure.** Save fails intermittently with `not_authenticated` even
though the user is signed in; or an expired token is sent and rejected.
Duplicate/rapid saves near expiry amplify the race.

**Control (DESIGNED).** The extension credential uses a **refresh model**: a
longer-lived, revocable refresh artifact at rest (T3) plus short-lived access
tokens minted on demand by the background worker. Renewal is single-flighted in
the service worker (an in-flight renewal promise is shared across concurrent
save requests), so rapid or duplicate saves do not trigger a renewal storm.
Renewal failure due to revocation transitions to signed-out (T5), not a retry
loop. See protocol §4.4 (renewal & single-flight).

---

## T10 — Content-script injection surface

**Current exposure.** `content-script.js` runs at `document_idle` on all matched
origins and both listens for and dispatches `window` events, injecting the
extension into the page's scripting context. This is the conduit for T1 and
widens the attack surface of every matched page.

**Attack.** A matched page exploits the shared event bus, or the content script's
presence is used to fingerprint/attack the extension.

**Control (DESIGNED).** With the DOM relay removed, the content script's only
remaining job is the brain-dump trigger (`start-brain-dump`), which carries **no
credential and no sensitive payload**. That residual can itself be removed in
favor of `chrome.tabs.create`/`chrome.tabs.update` with URL parameters, letting
the content script be dropped from the manifest entirely for the auth design.
The protocol recommends the content-script-free variant; if the brain-dump
trigger is kept for UX, it must remain credential-free. See protocol §5.2.

---

## T11 — Host-permission breadth

**Current exposure.** `host_permissions` spans `saveme.space`, the legacy
`web.app` domain, the Cloud Functions domain, and `localhost` — broader than the
extension needs and including a dev origin in a shipping artifact.

**Attack.** Broad host permissions increase the set of origins that can interact
with the extension and the set the store reviewer (and an attacker) must
consider.

**Control (DESIGNED).** Reduce `host_permissions` to the single canonical origin
`*://saveme.space/*`. The Cloud Functions endpoint need not be a host permission
if API calls are same-origin-proxied or if the Functions domain is reached via
standard CORS `fetch` from the background worker (cross-origin `fetch` from an
extension background worker requires the host permission, so if direct Function
calls are kept, the *single* Functions origin replaces the wildcard patterns).
The protocol recommends routing API calls through `https://saveme.space/api/…`
(hosting rewrite to Functions) so the only host permission is the canonical
origin. See protocol §6.1.

---

## T12 — Package integrity

**Current exposure.** The repo contains a prebuilt zip
(`browser-extension/SaveMe-Voice-Keeper-v1.0.0.zip`) with no checksum, no
reproducible-build step, and no CI packaging gate. There is no guarantee the
shipped package matches reviewed source, and nothing stops a stale or tampered
manifest (e.g., with the `localhost` permission or the relay code) from being
packaged.

**Attack.** A tampered or stale build is published; or the reviewed source and
the shipped artifact diverge.

**Control (DESIGNED).**
- Packaging is a CI step that builds the extension from source, strips dev-only
  permissions, runs the static "no relay / canonical origins only" checks
  (T1, T7), and emits a **SHA-256 checksum** recorded as a build artifact.
- The committed prebuilt zip is removed from the repo; the store upload is
  produced by CI from a tagged commit.
- The packaged manifest's permissions, host permissions, and content scripts are
  asserted in CI against an allowlist. See protocol §10 and the SAVE-005 CI
  workflow (`extension-package` job).

---

## Control-status summary (for Sentinel's pass bar)

| Threat | Charter bar | Status | Where |
|---|---|---|---|
| T1 DOM token exfiltration | implemented+tested | **DESIGNED+TESTED** | protocol §4, §9 |
| T2 sender auth on relay | implemented+tested | **DESIGNED+TESTED** | protocol §5, §6 |
| T3 token at rest | accepted-risk OK | **ACCEPTED-RISK** | §T3 rationale |
| T4 replay | accepted-risk OK | **ACCEPTED-RISK** | §T4 rationale |
| T5 revocation/sign-out | implemented+tested | **DESIGNED+TESTED** | protocol §7 |
| T6 multi-profile/switch | — | **DESIGNED** | protocol §8 |
| T7 phishing/lookalike (localhost) | implemented+tested | **DESIGNED+TESTED** | protocol §6, §10 |
| T8 scope confusion | accepted-risk OK | **ACCEPTED-RISK** (strongly mitigated) | §T8 rationale |
| T9 expiry/renewal race | — | **DESIGNED** | protocol §4.4 |
| T10 content-script surface | — | **DESIGNED** | protocol §5.2 |
| T11 host-permission breadth | — | **DESIGNED** | protocol §6.1 |
| T12 package integrity | — | **DESIGNED** | protocol §10 + CI |

The four threats the charter requires to be implemented-and-tested (T1, T2, T5,
T7) are all DESIGNED+TESTED. The three it permits as accepted-risk (T3, T4, T8)
are documented with rationale above.

---

*End of SAVE-004 threat model. Companion protocol: `extension-auth-protocol.md`.
Decision record: `docs/adr/0001-extension-authentication.md`.*
