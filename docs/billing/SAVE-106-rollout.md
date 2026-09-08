# SAVE-106 billing rollout and rollback

## Contract

Stripe is an input, not the entitlement authority. `billing_entitlements/{uid}` is the server-owned, versioned contract (`schemaVersion: 1`) containing plan, normalized status, entitlement decision, customer/subscription IDs, period end, last applied event, and mapping error. SAVE-105 server admission and the client auth projection both consume this contract; a paid `plan` grants server capabilities only when `entitled` is true. Existing `users/{uid}.subscription*` fields remain a non-authoritative compatibility projection written in the same transaction.

`stripe_event_ledger/{eventId}` provides transactional idempotency. An event older than `lastStripeEventCreated` is ledgered but does not mutate entitlement state. Unknown prices fail closed and produce `mappingError`; they never grant Basic or Premium. `past_due` retains the prior paid plan during grace; canceled/deleted subscriptions downgrade to Free.

## Test-mode configuration still required

No Stripe API was accessed for this change. Before test rollout, an operator must create/verify Stripe **test-mode** recurring monthly Prices matching D-004 ($9 Basic, $19 Premium), then configure Functions secrets/environment:

- `STRIPE_MODE=test`
- `STRIPE_SECRET_KEY=<test sk_...>`
- `STRIPE_WEBHOOK_SECRET=<test endpoint whsec_...>`
- `STRIPE_TEST_BASIC_MONTHLY_PRICE_ID=<immutable test price_...>`
- `STRIPE_TEST_PREMIUM_MONTHLY_PRICE_ID=<immutable test price_...>`
- Portal configuration in Stripe test mode, including allowed plan changes/cancellation behavior
- Webhook endpoint subscriptions for `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, and `invoice.payment_failed`

Do not configure live IDs in test mode. Live rollout separately requires `STRIPE_MODE=live`, the live secret/webhook secret, and both `STRIPE_LIVE_*_MONTHLY_PRICE_ID` values. There are intentionally no placeholder fallbacks.

## Rollout

1. Back up/export existing user subscription fields and audit duplicate `stripeCustomerId` values; resolve every duplicate before rollout.
2. Configure test mode above and deploy Functions to a non-production Firebase project.
3. Run checkout for Basic and Premium, portal access, payment failure, plan change, cancellation, webhook replay, and delayed-event replay using Stripe test tooling.
4. Confirm one ledger row per event and a correct `billing_entitlements/{uid}` document; confirm the compatibility user projection matches.
5. Alert on `mappingError`, ownership mismatch, non-unique customer lookup, configuration errors, and webhook 5xx responses.
6. Backfill/reconcile existing subscriptions through a reviewed server-side process before consumers switch to `billing_entitlements`.
7. Deploy production Functions only after live immutable IDs and webhook endpoint are configured. Keep reads on the compatibility projection until reconciliation is complete, then migrate consumers to `billing_entitlements`.

## Rollback

1. Stop checkout/portal traffic or roll the Functions deployment back to the prior artifact. Do not delete the event ledger or entitlement collection.
2. Keep the webhook endpoint available if possible; otherwise record the outage window and replay Stripe events after restoration.
3. Restore client deployment independently if the consolidated client causes navigation issues.
4. If entitlement projection is wrong, restore `users/{uid}.subscription*` from the pre-rollout export, fix mapping/configuration, then replay events chronologically into a staging project before production reconciliation.
5. Never roll back by reintroducing placeholder prices or defaulting an unknown price to a paid plan.
