# SaveMe readiness review — 10 September 2026

## What changed

- A new account opens directly to a focused first-memory screen. The optional tour no longer blocks the dashboard. Brain Dump, Briefing, and Insights remain available under More tools; recent memories and collections appear after the first save.
- Insights show countable evidence and exact source excerpts. Suggested word groups are explicitly limited to word matches. The app no longer invents emotion scores, confidence percentages, or interpretations from keywords. Negation, quotations, partial-word matches, duplicate entries, and invalid dates are covered by tests.
- A brief WebRTC disconnection has an eight-second recovery window. A sustained failure releases the microphone while retaining conversation text. Nova remains shared across routes.
- Document retries reuse the successful upload. Downloads and previews have bounded error handling. The production bucket now permits authenticated browser downloads from the explicit application origins through its CORS configuration.
- Checkout specifies card payments explicitly. This fixes the live configuration error that prevented Stripe from opening a checkout session.
- Account export includes owned application records and original uploaded files in a compressed JSON archive. Credentials are scrubbed. Creation requires recent authentication; Storage downloads require the owner, expire after 15 minutes, and stop immediately after a deletion request. No public download token or service-account signing permission is used.
- Account deletion now records a receipt, blocks access, revokes connected credentials, closes voice calls, cancels billing through customer deletion, purges owned data/files, and deletes the login. A second sweep after ten minutes removes writes already in flight. The scheduled queue retries failures; minimal receipts expire after 30 days.

## Automated verification

| Check | Result |
| --- | --- |
| Frontend unit tests | 162 passed across 39 files |
| Functions unit tests | 124 passed |
| Firebase emulator tests | 172 passed |
| TypeScript | App, tooling, and functions checks passed |
| ESLint | Passed; modified export components also rechecked |
| Production build | Passed |

The emulator lifecycle test uses real emulated Auth, Firestore, and Storage. It checks archive byte integrity, ownership isolation, credential scrubbing, client access denial after deletion, a delayed write, the final sweep, repeat cleanup, and preservation of the other account. Private export reads and denied cross-account/anonymous reads use the same explicit bucket as the server.

## Browser and production verification

The browser exercised the real application with a disposable synthetic account, using production Firebase and OpenAI endpoints. No user memories were edited or deleted.

| Journey | Evidence |
| --- | --- |
| First memory | Saved “Spare keys,” searched for “blue drawer,” and opened the correct memory |
| Upload and preview | Uploaded a 64-byte text file, checked stored bytes against the original, and opened its actual text in the document editor |
| Insight evidence | Displayed negated and quoted project statements without converting them into emotional or semantic claims; source navigation opened the exact memory |
| Unified Nova | A typed request through the live realtime connection navigated from Voice capture to Dashboard; connection and transcript survived, and were retained when returning to Voice capture; session explicitly ended |
| Mobile layout | Reviewed first-use, navigation, insights, and privacy controls at a 390-pixel viewport |
| Checkout | Verified active live prices and owner/amount on an unpaid checkout; expired the session; no charge created |

## Release status and required Firebase configuration

Code is pushed through `271d38f`. Functions, Firestore rules, and Storage rules have deployed; the frontend production build is prepared, with hosting publication pending the configuration below.

**Production Storage access is currently blocked by a missing cross-service permission.** The deletion check uses `firestore.exists()` inside Storage rules. The Firebase CLI skips its IAM prerequisite check in noninteractive mode, so a successful rules deployment did not establish runtime access. Live authenticated document and archive downloads returned 403; the local emulator does not reproduce missing production IAM.

The required binding is `roles/firebaserules.firestoreServiceAgent` on project `saveme-f5af0`, for its Firebase Storage service agent (`service-PROJECT_NUMBER@gcp-sa-firebasestorage.iam.gserviceaccount.com`). The role contains only `datastore.entities.get`. Preserve all existing policy bindings and the policy etag. Approval was requested; no IAM change has been applied. Automatic approval review rejected both an earlier signing-role proposal and a temporary removal of the deletion check. The signing-role proposal was abandoned in favor of authenticated Storage downloads.

After the cross-service permission is approved and applied: verify an authenticated document download succeeds, download and inspect the complete account archive, test real account deletion with the disposable account, confirm the scheduled final sweep and Stripe customer deletion, then publish and hash-check the prepared frontend build. Do not call the production export/deletion journey complete before these checks pass.

## Checks still requiring external test conditions

- **Physical phones:** actual iPhone Safari and Android Chrome microphone permission, audible playback, interruptions, Bluetooth/headphones, background/resume, and Wi-Fi-to-cellular handoff. A narrow browser viewport and a typed realtime request do not establish these results.
- **Paid lifecycle:** a Stripe sandbox is needed to verify completed payment, webhook-driven entitlement changes, renewals, failed payment, cancellation, and portal behavior end to end without charging a real card. Unit coverage and an unpaid live checkout do not establish payment completion.
- **Save to device:** the in-app browser did not expose a completion event for the document Blob download. Server bytes and document preview were verified; an actual file appearing in a phone or desktop download folder remains a separate check.
- **Scale:** the archive uses streaming server construction, but a maximum-size account export and memory-constrained phone download have not been load-tested.

## Configuration references

Firebase documents [browser download CORS requirements](https://firebase.google.com/docs/storage/web/download-files) and [owner/time-based Storage rules](https://firebase.google.com/docs/reference/security/storage). Stripe documents [subscription cancellation when deleting a customer](https://docs.stripe.com/api/customers/delete). These support the implemented behavior; they are not substitutes for the verification above.
