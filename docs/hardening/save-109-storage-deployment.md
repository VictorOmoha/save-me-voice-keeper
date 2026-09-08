# SAVE-109 Storage Rules Deployment Preview, Authorization, and Rollback

## Scope

This runbook applies to deployment of `storage.rules` and the adjacent `firestore.rules` verification covered by SAVE-109. It does not authorize a production deployment by itself.

## Required authorization

Before production deployment, record all of the following in the change ticket:

- approver with Firebase production-change authority;
- exact Git commit SHA containing the reviewed rules;
- target Firebase project ID and Storage bucket;
- emulator test result and timestamp;
- deployment operator;
- approved maintenance window;
- rollback owner.

The operator must verify the active Firebase project with `firebase use` and must not proceed if it differs from the authorized project. Admin SDK/service-account credentials are required only for server provisioning of `demo-videos/**` or optional `admin-public/**`; client credentials never authorize writes to those prefixes.

## Pre-deployment preview

From a clean checkout of the approved commit:

1. Run `npm run test:emulator` with the repository's demo-only guard enabled.
2. Review `firebase deploy --only storage --project <AUTHORIZED_PROJECT> --dry-run` if the installed Firebase CLI supports dry-run for rules. If it does not, stop and use the Firebase Console Rules playground or a non-production Firebase project as the preview gate; do not treat a local parse alone as a production preview.
3. Confirm the diff includes only the intended rule/config/test/documentation changes.
4. Verify representative existing object names conform to these exact shapes:
   - `images/{uid}/{fileName}`
   - `documents/{uid}/{entryId}/{fileName}`
   - `users/{uid}/{fileName}`
   - `demo-videos/{fileName}`
   - optionally `admin-public/{fileName}`
5. Identify objects with extra nesting, backslashes, traversal-shaped segments, or disallowed MIME metadata. They will become unreadable/unwritable to clients after deployment and require an authorized migration or server-side handling.

## Deployment

Use an explicitly named project; never rely on an implicit default:

```sh
firebase deploy --only storage --project <AUTHORIZED_PROJECT>
```

If the adjacent Firestore changes are part of the approved release, deploy them separately so either ruleset can be rolled back independently:

```sh
firebase deploy --only firestore:rules --project <AUTHORIZED_PROJECT>
```

Capture CLI output and the deployed ruleset version in the change ticket.

## Post-deployment checks

Immediately verify:

- owner image upload/read/delete with an approved MIME;
- owner document upload/read/delete with an approved MIME;
- cross-user and unauthenticated denial;
- a public `demo-videos/{fileName}` read;
- client write denial for `demo-videos/**` and `admin-public/**`;
- denial for an unmatched prefix;
- application error telemetry for unexpected permission-denied spikes.

Do not use production user content as a destructive test fixture.

## Rollback

Rollback triggers include owner access regressions, unexpected MIME rejection, existing-path incompatibility, or any isolation failure.

1. Stop further deployments and client rollouts.
2. Restore the last approved `storage.rules` from its immutable Git commit or the Firebase Console ruleset history.
3. Re-run emulator tests against the rollback file.
4. Deploy only Storage rules to the explicit authorized project.
5. Repeat the post-deployment checks and record the restored ruleset version.
6. If Firestore rules were deployed and are implicated, restore and deploy their prior approved version separately.

Rules rollback does not rename, delete, or alter stored objects. Any object migration requires separate authorization, backup/verification, and a reversible migration plan.
