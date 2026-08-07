# M0 — Hardening Foundations

This directory holds the Milestone M0 artifacts for the SaveMe.Space engineering
hardening program. M0 produces **decisions, contracts, and executable test
infrastructure** — not production behavior changes.

Sprint plan, assignments, and the binary exit checklist live in the project
documents *SaveMe.Space — M0 Foundation Sprint Plan* and *SaveMe.Space —
Engineering Hardening Backlog*. Day-to-day decisions and blockers are tracked in
*SaveMe.Space — M0 Decision & Dependency Log*. Repository-level tracking: the
pinned **M0 Sprint Tracker** issue.

## Baseline

- Repository: `VictorOmoha/save-me-voice-keeper`
- Baseline commit: `569225b68333d165a942dbd7f258cccc3413ca45` (`main` at sprint start)

## Guardrails (in force for every M0 change)

1. Documentation, fixtures, test harnesses, and non-production configuration only.
2. No production deploys, no live Stripe mutation, no destructive Firebase operations.
3. Synthetic fixtures only — never production user content in source, tests, or logs.
4. No committed secrets: no API keys, service-account JSON, tokens, webhook secrets,
   or raw environment exports. Use canary/fake values.
5. No restoration of the extension window-event token relay.
6. No weakening of Firestore rules to make tests pass.
7. Branches + pull requests only; the product owner reviews and merges.
8. The author of an artifact cannot be its independent reviewer.

## Planned artifacts

| Path | Ticket | Contents |
|---|---|---|
| `docs/hardening/user-data-inventory.md` | SAVE-001 | Human-readable inventory of every user-linked data class: location, CRUD paths, owner key, cascading records, export/delete behavior, retention, processor exposure, verification status |
| `docs/hardening/user-data-manifest.json` | SAVE-001 | Versioned machine-readable manifest (`schemaVersion`, `resourceType`, `location`, `ownerSelector`, `exportPolicy`, `deletePolicy`, `deleteOrder`, `retentionPolicy`, `dependencies`, `sensitivity`, `verificationStatus`) |
| `scripts/validate-user-data-manifest.mjs` | SAVE-001 | Validator failing when source references a user-owned collection/path missing from the manifest |
| `test/fixtures/full-user-fixture.ts` | SAVE-001 | Synthetic full-user fixture covering all known resource types |
| `docs/hardening/data-flow-inventory.md` | SAVE-002 | Every flow sending account data, content, audio, transcripts, derived context, billing data, telemetry, or agent memory to a service — purpose, payload categories, processor, transient vs. stored, retention, user control, disclosure point, policy mismatches |
| `docs/hardening/plan-claims-audit.md` | SAVE-003 | Every user-facing plan claim mapped to keep / change / remove |
| `docs/hardening/plan-lifecycle.md` | SAVE-003 | Canonical lifecycle: upgrade, downgrade, failed payment, grace, cancellation, refund, over-limit |
| plan catalog + tests | SAVE-003 | Non-operative typed catalog (stable IDs, prices, trials, entitlements, Stripe mapping by environment). Must not alter live billing |
| `docs/adr/0001-extension-authentication.md` | SAVE-004 | ADR: context, rejected insecure pattern, options, decision, rationale |
| `docs/hardening/extension-auth-threat-model.md` | SAVE-004 | Token leakage, replay, storage compromise, phishing origins, expiry, revocation, sign-out, account switch, multiple profiles |
| `docs/hardening/extension-auth-protocol.md` | SAVE-004 | Sequence, endpoints, credential format/scope/lifecycle, origin restrictions, logging, recovery, UX |
| `test/emulator/seed.ts` | SAVE-005 | Deterministic seed: two users, one admin, read-only agent key, read/write agent key |
| `test/emulator/tenant-isolation.test.ts` | SAVE-005 | Same-user allow / cross-user deny against actual rules |
| `test/emulator/storage-rules.test.ts` | SAVE-005 | Storage allow/deny matrix, or documented red tests owned by SAVE-109 |
| `test/emulator/run.mjs` | SAVE-005 | One-command emulator start + test run with explicit no-production guard |
| `docs/hardening/emulator-harness.md` | SAVE-005 | Harness setup, environment variables, guards, CI invocation, artifact output |

## Status

See the **M0 Sprint Tracker** issue for ticket state, owners, blockers, and
review outcomes. Acceptance is binary against the sprint exit checklist and
requires product-owner sign-off; security-review items additionally require the
named independent reviewer.
