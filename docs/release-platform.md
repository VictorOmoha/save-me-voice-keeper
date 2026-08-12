# SAVE-111 Protected Release Gate

This branch defines the source-only release gate for SaveMe.Space. It does not deploy or change repository settings by itself.

## Fail-closed prerequisite

Before enabling this gate, disable, delete, or replace the existing automatic Firebase workflow that deploys the live channel on pushes to `main` or `master`. Running that legacy workflow alongside this gate bypasses production approval and immutable artifact promotion.

Audit and disable every alternate production path, including Firebase GitHub integrations, external CI, hooks, and bots. Remove `master` from every deployment trigger and allowlist. If `master` must remain deployable, protect it identically to `main`; otherwise the rollout must stop.

Production credentials must exist only in the protected GitHub `production` environment. Remove the legacy repository-level Firebase service-account secret and rotate its key when appropriate. Confirm through Actions history, Firebase release history, and a test merge that the old live deployment no longer fires.

## Required pull-request checks

Configure `main` branch protection to require:

- CI / Required gate
- Firestore/Storage rules (emulator)
- extension package validation once SAVE-107/108 merges
- at least one approving review
- dismissal of stale approvals
- resolution of all review conversations
- branches up to date before merge
- no direct pushes or force pushes

## Pipeline stages

1. Clean root and Functions installs on Node 20.
2. Formatting, lint, and TypeScript checks.
3. Root and Functions unit tests.
4. Firebase Auth/Firestore/Functions/Storage