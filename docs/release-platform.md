# SAVE-111 protected release gate

This branch defines the source-controlled release gate. It does not deploy automatically and contains no production credentials.

## Fail-closed prerequisite

Do not enable this gate until the repository's current push-to-main or push-to-master Firebase live deployment is disabled, deleted, or replaced. Running the legacy `channelId: live` workflow alongside this gate bypasses production approval and immutable artifact promotion.

Audit and disable every alternate production path, including Firebase GitHub integrations, App Hosting integrations, external CI, deploy hooks, and bots. Remove `master` from every deployment trigger and deployment allowlist. The repository standard is `main`; if `master` must remain deployable, stop rollout until it has controls identical to `main`.

Remove the legacy repository-level Firebase service-account secret after disabling the old workflow, and rotate the underlying key if it was usable outside a protected environment. Production credentials must exist only in the protected `production` environment; staging and preview use separate projects and identities.

Confirm through Actions history, Firebase release history, and a test merge that the old live workflow no longer fires. A normal merge must create CI artifacts only, never a live release.

## Required pipeline

1. Clean root and Functions installs on Node 20.
2. Formatting, lint, and TypeScript checks.
3. Root and Functions unit tests.
4. Firebase Auth, Firestore, Functions, and Storage emulator tests on Java 21.
5. Production web and Functions builds.
6. Root and Functions production dependency audits with high and critical findings blocking.
7. Secret scanning.
8. Deterministic extension package and checksum validation.
9. Immutable release candidate artifact with SHA-256.
10. Credential-isolated pull-request preview.
11. Staging deployment and smoke tests using the downloaded candidate, not a rebuild.
12. Protected production-environment approval and promotion of the exact staging artifact.

The production workflow must be manual-only, serialized with cancellation disabled, and accept only a successful push-triggered CI run on `main` whose full SHA matches the requested candidate. It must verify ancestry and checksum before staging or production.

## GitHub settings humans must apply

Protect `main` with required pull requests, at least one approval, stale-approval dismissal, conversation resolution, up-to-date required checks, no force pushes or deletion, and no administrator bypass. Require `CI / Required gate`; require preview only once preview credentials are configured.

Create isolated `firebase-preview`, `staging`, and `production` environments. Production requires Victor or another designated release owner, prevents self-review, is restricted to `main`, and contains the only production Firebase credential. Prefer OIDC/workload identity federation; JSON credentials are bootstrap-only and must be least privilege.

## Release invariant

Every production Firebase deploy, including Hosting-only releases, hotfixes, and rollbacks, must wait on protected production approval and consume the checksum-verified artifact produced by the successful matching `main` CI run. No checkout-and-rebuild workflow, `channelId: live`, alternate branch, Firebase integration, repository-level production secret, or routine Console action may bypass this path.

## Release and rollback

Record the successful `main` CI run ID, full SHA, artifact digest, approver, and timestamp. Promotion verifies that identity, deploys the candidate to staging, runs smoke tests, then waits for production approval before promoting the same bytes.

Rollback selects the last known-good archived CI run and promotes that immutable artifact through staging and production approval again; it never rebuilds old source locally. Firebase Console release rollback is audited break-glass activity only and must be reconciled immediately in source and followed by the normal immutable workflow.

## Current blockers

- The connected GitHub App cannot write `.github/workflows/**`; an owner-authorized workflow credential must publish the validated workflow files.
- The existing Functions dependency graph has high and critical production audit findings.
- Root typecheck still references incomplete legacy Supabase generated types.
- Staging needs a stable readiness endpoint and non-secret smoke fixtures.
- SAVE-103 through SAVE-110 must land, then this gate must be rebased and rerun.

No production deployment is authorized by this document.