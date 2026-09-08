# D-003 — Data-rights contract

**Status:** Approved by Victor Omoha on 2026-08-10.

## Cancellation and deletion

Subscription cancellation stops renewal but preserves the account and its data under the normal plan lifecycle. Account deletion is a separate workflow requiring recent authentication.

A valid deletion request must:

1. Revoke agent keys and scheduled access immediately.
2. Run an asynchronous, manifest-driven purge of user-owned application data, derived records, mirrors, Storage objects, and applicable device-side data.
3. Remain idempotent and retryable until it reaches an approved terminal state.
4. Delete the Firebase Auth identity last.

Cancellation must never silently trigger account deletion.

## Export and backup terminology

The supported export target is a server-generated portable archive containing:

- Versioned JSON for exportable manifest resources.
- Original uploaded files.
- Checksums.
- Generated timestamp and schema version.
- A human-readable index.

This is an export, not a backup. Existing “backup” language must be removed or renamed until SaveMe implements and tests a restore workflow.

## Timing and retention exceptions

Application-data deletion must complete as soon as practical and no later than 30 days after a valid request. Generated export archives expire after 7 days.

Only minimal records needed for legal, billing, fraud, security, or deletion-receipt purposes may be retained. Each exception requires a documented purpose, minimized field set, access boundary, and retention schedule. Retained exceptions do not justify keeping user content or agent-readable memory.

## Implementation consequences

- Agent-key revocation is deletion step one.
- Derived intelligence, mirrored shared memories, scheduled effects, local/offline stores, and Storage objects remain in purge scope.
- No synchronous all-or-nothing deletion promise.
- No immediate-deletion claim; the public maximum is 30 days.
- Policy and product copy must distinguish cancellation, deletion, export, and backup.

Impacted tickets: SAVE-001, SAVE-002, SAVE-101, SAVE-102, SAVE-103, and SAVE-209.
