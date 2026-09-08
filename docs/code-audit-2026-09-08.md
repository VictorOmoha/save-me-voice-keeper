# Code audit — September 8, 2026

The audit focused on account isolation, server authorization, billing, offline synchronization, and build reliability. The release integrates the audit with upstream `41c3281`, including its billing lifecycle, entitlements, extension authentication, and Storage rules. The checks below describe the integrated release before publication.

| Priority | Finding and impact | Fix |
|---|---|---|
| High | Clients could change their `users` document, including the Stripe customer ID trusted by billing. | Retained upstream field-level protection and server-owned entitlements. Also prohibit deleting a user document containing billing fields; nonbilling profile edits remain allowed. |
| High | Shared-memory API keys also authenticated to billing, voice execution, audio, and quick-save endpoints, bypassing their memory permission scope. | Account endpoints now accept Firebase sessions by default. Only shared-memory endpoints opt into agent keys. Explicit empty or malformed permission sets grant no access. |
| High | Agent callers could retrieve and update private memories by omitting a visibility filter or supplying a document ID. | Server-side read and update checks require `shared_with_agents` for API keys. Private and selected-agent records remain accessible to their owner. |
| High | A caller-supplied Nova session ID could overwrite another user's conversation, including when the caller supplied its own history. | Verify ownership before either voice execution path; return 404 for foreign/missing sessions and stop on lookup failure. |
| High | The API key revoke button attempted a direct Firestore deletion prohibited by security rules. | Added `sharedMemoryRevokeAgentKey`, requiring a Firebase session and checking ownership in a transaction. The settings UI calls this endpoint. |
| High | Offline synchronization replayed every account's queue under the currently signed-in user. | Scope queue reads and counts by user, stop writes after account changes, reuse document IDs on retries, and remove the duplicate global sync hook. |
| Medium | Offline update replay could recreate deleted documents, cache records lacked ownership metadata, and queue persistence failures were swallowed. | Use `updateDoc`, include cache ownership, and propagate queue write failures. Successful synchronization refreshes entry views. |
| Medium | CORS rejection still invoked application code; rejected handler promises were not handled by the wrapper. | Return 403 before execution, complete preflight explicitly, await handlers, and return generic 500 responses for unexpected failures. Added the project's actual development origin on port 8080. |
| Medium | Checkout and entitlement projection used inconsistent Stripe price mappings. | Retained upstream immutable price catalogs and idempotent subscription lifecycle handling. Verified existing live Basic ($9/month) and Premium ($19/month) prices and the existing webhook subscriptions, then configured their mappings. No Stripe products, subscriptions, or purchases were changed. |
| Medium | An unused Supabase client referenced missing packages/types; production minification spawned enough workers to exhaust memory. | Removed the unused client, added `npm run typecheck`, and limited Terser to one worker. |
| High/Critical advisories | npm reported 10 affected frontend dependency packages and 21 in Cloud Functions, including high/critical advisories. | Applied compatible lockfile updates and an explicit `qs` 6.x security override for Express. Final production-dependency scans report zero high/critical findings; remaining moderate advisories are detailed below. |

## Verification

- Frontend Vitest suite: **32 files, 119 tests passed**. Functions suite: **16 files, 95 tests passed**. Coverage includes key scope, revocation ownership, private memories, foreign conversation IDs, CORS failures, offline account changes, queue failures, billing lifecycle, entitlements, and extension authentication.
- Legacy category suite: **5 tests passed**. Corrected an assertion that expected a non-null category despite its test name and the implementation explicitly requiring null for tied scores. No legacy runtime behavior changed.
- TypeScript: frontend, Vite configuration, and Cloud Functions passed. Cloud Functions compiled successfully.
- ESLint: passed without errors or warnings.
- Firestore/Storage emulator suites: **171 tests passed**. The separate audit harness covers 14 additional checks for billing edits/deletion, ownership transfer, unauthorized entry deletion, and direct key mutation.
- Extension security checks: **4 passed**. Fixed file URL handling in the checks and packaging script for Windows paths containing spaces.
- Production build: passed with minification and recovered public Firebase configuration. The remaining build warning concerns the document-viewer chunk exceeding 500 kB.
- `git diff --check`: passed.

The test runner used one worker to fit this machine's memory constraints. The build ran with a 3 GB Node heap limit after limiting minifier concurrency. The system npm wrapper points to a missing CLI, so checks invoked the installed local CLI files through Node.

The new rules harness can be rerun with:

```sh
firebase emulators:exec --only firestore --project demo-saveme-audit "npm run test:rules"
```

It refuses remote hosts and non-demo project IDs.

## Rollout and limits

Deploy the updated Firestore/Storage rules and Cloud Functions, including `sharedMemoryRevokeAgentKey`, before publishing the updated frontend. The workflow now verifies the release and follows that order. Functions upload exclusions prevent local service-account credentials, dotenv files, logs, and test files from entering the source archive. Existing runtime settings are recovered without printing their values before applying the verified billing mappings; this prevents Firebase dotenv deployment from deleting existing provider keys.

GitHub's missing public Firebase build settings have been restored. Automatic deployment still requires `FIREBASE_SERVICE_ACCOUNT_SAVEME_F5AF0` with appropriate deployment permissions. Automatic approval review rejected adding persistent project-wide administrator roles to a new CI identity; the unused identity and pool were removed. This release uses the existing authenticated local Firebase CLI. No persistent IAM grants were added.

No live Firebase user data, Stripe subscription, or agent memory was changed during verification. Stripe reported no existing subscriptions requiring entitlement migration. Existing integrations using agent keys outside shared-memory endpoints will now need a Firebase user session. Selected-agent visibility grants are not implemented; API keys cannot access those records.

The public npm advisory scan completed after the user approved exporting dependency names and versions. After integrating upstream and applying compatible patches, the final `--omit=dev` scans report **4 moderate frontend findings and 8 moderate backend findings**, with no high/critical findings. Including development dependencies, root has 19 moderate findings and Functions has 10; neither has high/critical findings. The counts include transitive packages affected by the same advisory. Full production registry findings are saved in `docs/dependency-audit-2026-09-08.json`.

The remaining frontend findings involve React Router and Vitest, which is currently declared as a production dependency. Backend findings trace to older UUID dependencies in Firebase/Google Cloud libraries. npm proposes major upgrades, including Firebase Admin 14, which requires Node 22 and changes the namespace API used throughout this backend, according to the [official release notes](https://firebase.google.com/support/release-notes/admin/node). These migrations remain open; no forced upgrade or major transitive override was applied. This audit does not claim that all dependencies are vulnerability-free. Live authenticated voice, payment, and extension flows were not exercised against production services.

The implementation follows Firebase's documented [server/client rules boundary](https://firebase.google.com/docs/firestore/security/rules-fields) and the CORS middleware's documented [error callback and preflight behavior](https://expressjs.com/en/resources/middleware/cors/).
