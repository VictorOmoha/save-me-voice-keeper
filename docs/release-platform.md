# SAVE-111 Protected Release Gate

This branch defines the source-only release gate for SaveMe.Space. It does not deploy or change repository settings by itself.

## Required pull-request checks

Configure main branch protection to require:

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
4. Firebase Auth/Firestore/Functions/Storage emulator tests on Java 21.
5. Production web and Functions builds.
6. Root and Functions production dependency audits with high/critical blocking.
7. Secret scanning.
8. Deterministic extension packaging and checksum validation.
9. Immutable release candidate artifact with SHA-256.
10. Firebase deployment preview on pull requests.
11. Staging deployment and smoke validation.
12. Production environment approval and promotion of the exact staging artifact.

## Human configuration

Create staging and production GitHub environments. Production must require Victor approval. Store Firebase credentials and project IDs in environment-scoped secrets/variables. Fork pull requests must receive no deployment credentials.

## Rollback

Record the previous immutable release SHA and Firebase release IDs before promotion. Rollback promotes the prior verified artifact; it does not rebuild source. Rules and Functions are restored from the previous approved commit and verified through the same staging smoke checks.

## Current blockers

- SAVE-103 through SAVE-110 must merge and the gate must be rebased.
- The existing Functions dependency graph still has high/critical audit findings on the current baseline.
- Root typecheck still references incomplete legacy Supabase generated types.
- Staging needs a stable readiness endpoint and non-secret smoke fixtures.
- GitHub branch protection and environment approval require an owner action in repository settings.

No production deployment is authorized by this document.