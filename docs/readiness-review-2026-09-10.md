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
| Restored file access | Applied the approved read-only Firebase service-agent permission; authenticated download returned 200; a second upload through the real app saved successfully |
| Account export | Production archive downloaded and decompressed; six owned resources and the original file were verified byte-for-byte; the browser export subsequently reached the archive-ready state |
| Account deletion | The real app recorded the request, signed out, and displayed a receipt. A previously issued token immediately received 403 for both Firestore and Storage. The initial sweep removed all owned records/files and the unpaid Stripe customer. The scheduled final sweep completed at 13:36:11 UTC; the login no longer existed and owned record/file counts were both zero. |
| Production release | Hosting deployment completed; live HTML and all 76 JavaScript/CSS assets matched the tested build |

## Release status and required Firebase configuration

Application code is pushed through `271d38f`; documentation through `f983019` was present at deployment. Functions, Firestore rules, Storage rules, and the frontend are deployed. The live HTML and 76 JavaScript/CSS assets were hash-checked against the prepared build.

**The production Storage permission gap is resolved.** The deletion check uses `firestore.exists()` inside Storage rules. The Firebase CLI skips its IAM prerequisite check in noninteractive mode, so a successful rules deployment did not establish runtime access. Live checks caught the missing permission; the local emulator does not reproduce missing production IAM.

With the user's explicit approval, `roles/firebaserules.firestoreServiceAgent` was granted on project `saveme-f5af0` to its Firebase Storage service agent (`service-PROJECT_NUMBER@gcp-sa-firebasestorage.iam.gserviceaccount.com`). The role contains only `datastore.entities.get`. Existing policy bindings and the policy etag were preserved. Authenticated file access passed after propagation. No signing role was added, and the deletion-access guard remains enabled.

For future deployments, verify this service-agent prerequisite before publishing cross-service Storage rules, then check an authenticated upload/download against production. A successful CLI deploy and emulator pass alone do not establish production IAM access.

Production verification finished at 13:36 UTC (09:36 Eastern). The synthetic deletion completed in approximately 13 minutes, using the normal scheduler without changing the cleanup deadline. The minimal deletion receipt remains under the documented 30-day retention policy. Disposable browser sign-in tokens were removed from local test artifacts, and the local development server was stopped.

## Checks still requiring external test conditions

- **Physical phones:** actual iPhone Safari and Android Chrome microphone permission, audible playback, interruptions, Bluetooth/headphones, background/resume, and Wi-Fi-to-cellular handoff. A narrow browser viewport and a typed realtime request do not establish these results.
- **Paid lifecycle:** a Stripe sandbox is needed to verify completed payment, webhook-driven entitlement changes, renewals, failed payment, cancellation, and portal behavior end to end without charging a real card. Unit coverage and an unpaid live checkout do not establish payment completion.
- **Save to device:** the in-app browser did not expose a completion event for the document Blob download. Server bytes and document preview were verified; an actual file appearing in a phone or desktop download folder remains a separate check.
- **Scale:** the archive uses streaming server construction, but a maximum-size account export and memory-constrained phone download have not been load-tested.

### Completing the device and payment checks

These are acceptance steps to run, not claims of completed testing. Record the device/browser version, result, and any failed step.

| Device journey | Expected result |
| --- | --- |
| On iPhone Safari and Android Chrome, allow the microphone and ask Nova to remember a synthetic note | Audible reply, correct transcript, one confirmed saved memory |
| Ask Nova to open Dashboard, then return to Voice capture | One ongoing connection and the same conversation history; no duplicate capture session |
| Deny microphone permission, then enable it and retry | A useful error and successful recovery without a page reset |
| Switch Wi-Fi/cellular, background/resume the app, and interrupt it with a phone call | Clear connection state; brief disruption can recover, sustained disruption releases the microphone and preserves text |
| Use End session with speaker and Bluetooth/headphones | Audio stops and the browser/OS microphone indicator clears |
| Download a document and account archive | Files appear in the device's download location and open correctly |

Run completed-payment checks on a separate preview backend with Stripe sandbox keys, sandbox price IDs, and the matching webhook secret. Keep the production billing environment unchanged. Stripe's [testing guide](https://docs.stripe.com/testing) provides successful, declined, and authentication-required payment scenarios; its [webhook guide](https://docs.stripe.com/webhooks) describes local event delivery and verification.

| Sandbox journey | Expected result |
| --- | --- |
| Complete Basic and Premium checkout | Correct owner and amount; entitlements update from a verified webhook |
| Decline or cancel checkout | No paid entitlement is granted; retry is understandable |
| Complete an authentication-required payment | The return flow and entitlements agree with Stripe's final result |
| Open the portal, change/cancel a plan, and simulate renewal/failure | UI and server access follow the resulting subscription state |
| Redeliver an already processed event | No duplicate entitlement or billing side effect |

## Configuration references

Firebase documents [browser download CORS requirements](https://firebase.google.com/docs/storage/web/download-files) and [owner/time-based Storage rules](https://firebase.google.com/docs/reference/security/storage). Stripe documents [subscription cancellation when deleting a customer](https://docs.stripe.com/api/customers/delete). These support the implemented behavior; they are not substitutes for the verification above.
