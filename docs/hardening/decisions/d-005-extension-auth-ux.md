# D-005 — Extension authentication UX contract

**Status:** Approved by Victor Omoha on 2026-08-10.

## Connection

Use the reviewed one-time pairing-code protocol on `https://saveme.space`.

- The signed-in web app generates an 8-character Crockford code displayed as `XXXX-XXXX`.
- The code is single-use and expires after 10 minutes.
- The user enters the code in the extension popup.
- The extension background worker exchanges it directly over HTTPS for a scoped, revocable extension credential.
- The extension never receives or stores a Firebase ID token.
- The DOM/window-event token relay remains prohibited and must be deleted, not repaired.

## Sign-out, revocation, and account switching

One SaveMe account is supported per browser profile.

- Extension sign-out revokes that profile's credential and clears local credential state.
- Web sign-out revokes every extension credential for the account.
- Switching accounts explicitly revokes the current credential before starting a new pairing flow.
- A browser profile cannot retain multiple active SaveMe account credentials.

## Expiry and recovery

- Access tokens are held in memory and expire after 15 minutes.
- The background worker silently renews through a rotating refresh credential.
- A refresh `401` or `403`, remote revocation, or invalid credential clears local auth state and presents a clear reconnect flow.
- Network failures are distinct from authentication failures. Saves enter a local retry queue with backoff rather than forcing reconnection.

## Shipping boundary

- Canonical production origin: `https://saveme.space` only.
- No production `localhost`, `web.app`, or `firebaseapp.com` host permissions.
- The background worker is the only credential-state writer.
- The credential is least-privilege and independently revocable.

Impacted tickets: SAVE-004, SAVE-107, SAVE-108, and SAVE-209.
