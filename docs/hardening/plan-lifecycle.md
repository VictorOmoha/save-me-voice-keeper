# SAVE-003 — Plan Lifecycle (PROPOSALS)

**Status:** ⚠️ **PROPOSAL DOCUMENT — NOT RATIFIED.** Every behavior described here is
a proposal awaiting Victor's decision **D-004** (final commercial model, due
2026-08-11). Nothing in this document is implemented, and nothing here should be
treated as the current behavior of the system.

**Baseline:** `main @ 569225b68333d165a942dbd7f258cccc3413ca45`
**Author:** Vector Platform (client/platform)
**Date:** 2026-08-07

---

## 0. How to read this document

Each lifecycle area has three parts:

1. **Current reality** — what the code actually does today, with file references.
2. **Proposal** — the behavior Vector Platform recommends, stated precisely enough
   to implement and test.
3. **Open question for D-004** — the specific commercial call Victor must make.

Where a proposal depends on the typed plan catalog, it references the catalog's
stable plan IDs (`free`, `basic`, `premium`, `enterprise`) rather than display
names or prices.

The guiding principle throughout: **the server (Stripe + webhook + Firestore) is
the authority on entitlement; the client catalog is a display and gating
convenience, never the source of truth.**

---

## 1. Canonical lifecycle state machine (proposal)

All paid subscriptions should be modeled as a single state machine stored on the
user document (`users/{uid}`), written **only** by the Stripe webhook handler and
Cloud Functions, never by the client.

Proposed states (superset of Stripe's `subscription.status`):

```
trialing → active → past_due → (grace) → canceled → free
                ↘ paused (optional, future)
```

- `subscriptionTier` — the catalog plan ID (`free|basic|premium|enterprise`).
- `subscriptionStatus` — the lifecycle state above.
- `subscriptionPeriodEnd` — timestamp; the boundary for grace and cancellation.
- `subscriptionCancelAtPeriodEnd` — boolean, mirrors Stripe.

Today only `subscriptionStatus` (raw Stripe string) and `subscriptionTier` are
written (`functions/src/billing/functions.ts:209-236`). The proposal adds
`periodEnd` and `cancelAtPeriodEnd` so the client can render "active until
<date>" without guessing.

---

## 2. Upgrade (free → paid, or lower → higher paid)

**Current reality.** `createCheckout` builds a Stripe Checkout session in
`subscription` mode with a single monthly price (`safety.ts:37-50`,
`functions.ts:73-89`). On `checkout.session.completed` the webhook sets
`subscriptionStatus: "active"` but does **not** set the tier; the tier is only
set later by `customer.subscription.updated`. There is a window where the user
has paid but still shows `free`.

**Proposal.**
- Upgrade takes effect **immediately** on `checkout.session.completed`. The
  webhook should read the price from the completed session's line items (via
  the subscription), map it through the catalog's Stripe mapping, and write
  `subscriptionTier` in the same write as `subscriptionStatus`. No two-step.
- Proration: use Stripe's default (`create_prorations`) for plan-to-plan
  upgrades so the user is charged the prorated difference immediately.
- Client: after checkout success, land on `/dashboard?session_id=…` (already
  the `success_url`), then rely on the Firestore snapshot listener
  (`useAuthState`) to pick up the new tier — no client-side "upgrade confirmed"
  state machine.

**Open question for D-004:** is there more than one paid tier to upgrade
*between* (Basic ↔ Premium), or is the lineup a single paid tier? The answer
decides whether "upgrade" also means "change plan mid-cycle."

---

## 3. Downgrade (higher → lower paid, or paid → free)

**Current reality.** No downgrade flow exists in the app. The Stripe customer
portal (`customerPortal`) is the only surface, and its behavior is Stripe's
default. ToS §6.7 describes a downgrade policy ("effective next billing cycle,
delete data or keep tier, no refund") that is not implemented anywhere.

**Proposal.**
- Downgrade is scheduled, not immediate: set `cancelAtPeriodEnd` semantics at
  the *plan* level via the portal or a `scheduleDowngrade` function. The user
  keeps the higher tier until `subscriptionPeriodEnd`, then drops.
- At the moment of downgrade, run an **over-limit check** (see §7). If the user
  is over the lower tier's quota, they keep read access to everything but lose
  write access to the over-limit resource until they are back under quota.
- No refunds for downgrades (aligns with ToS §6.7 intent).

**Open question for D-004:** does "downgrade to free" go through the same
scheduled path, or is it a cancellation (§5)? Recommend: cancellation *is*
downgrade-to-free at period end; one code path.

---

## 4. Failed payment and grace

**Current reality.** The webhook handles `customer.subscription.updated` /
`.deleted` and writes the raw Stripe status. There is no `past_due` handling, no
grace window, and no client banner. If Stripe marks a subscription `past_due`,
the tier is only reset to `free` when the subscription is fully `deleted` —
but the code maps any non-`active` status to `free` on the *updated* event
(`functions.ts:233-234`), which means a single failed charge flips the user to
`free` immediately even while Stripe is still retrying.

**Proposal.**
- Treat `past_due` as a first-class state, **not** as `free`. The webhook must
  map Stripe statuses explicitly: `active|trialing → tier stays`,
  `past_due → tier stays + grace starts`, `canceled|unpaid → free`.
- Grace window: **7 days** of full access after entering `past_due` (D-004 can
  tune). During grace, the client shows a persistent, non-blocking banner with a
  "Update payment method" action that opens the Stripe portal.
- On `invoice.payment_failed`, send a transactional email (out of scope for
  M0; noted as a dependency).
- If the subscription is still unpaid at the end of grace, Stripe's own
  dunning cancels it and the webhook moves the user to `free`.

**Open question for D-004:** grace length (7 vs 14 days) and whether over-limit
enforcement applies during grace.

---

## 5. Cancellation

**Current reality.** Cancellation happens only via the Stripe portal. The
webhook's `customer.subscription.deleted` sets tier `free` immediately, with no
end-of-period grace. ToS §6.5 promises "access until the end of the paid
period," which the code does not deliver.

**Proposal.**
- Cancellation = `cancelAtPeriodEnd: true`, set via the portal. The user keeps
  their tier until `subscriptionPeriodEnd`.
- The client reads `cancelAtPeriodEnd` + `periodEnd` and renders "Your plan
  ends on <date> — you keep <tier> until then."
- At `periodEnd`, Stripe fires `customer.subscription.deleted`; the webhook
  moves the user to `free` and runs the over-limit transition (§7).
- ToS §6.5's "30 days to export your data" (also §3.3) is a **data-retention**
  promise, separate from access. Proposal: after downgrade to free, data is
  retained (read-only if over quota) for 30 days before any cleanup job runs.
  Flag: no such cleanup job exists today — building it is post-M0 work.

**Open question for D-004:** confirm the 30-day retention promise is real and
funded, or soften the ToS copy.

---

## 6. Refunds

**Current reality.** No refund code path. Subscription page claims "Pro-rated
refunds available" (`Subscription.tsx:342-343`); ToS §6.4 says monthly = no
refunds, annual = prorated within 30 days. These contradict.

**Proposal.**
- Adopt ToS §6.4's structure, mapped to real SKUs: monthly subscriptions are
  not refunded for partial months; if D-004 adds annual SKUs, annual plans get
  a prorated refund only within the first 30 days.
- Refunds are a **manual support operation** via the Stripe dashboard, not an
  in-app self-serve flow, until volume justifies automation.
- Remove "Pro-rated refunds available" from the subscription page; replace with
  a link to the refund section of the ToS.

**Open question for D-004:** the public refund sentence (one line) and whether
annual SKUs exist at all.

---

## 7. Over-limit behavior (quota enforcement)

**Current reality.** Quotas exist only as client-side display numbers
(`storageUtils.getStorageLimit`, `useStorageStats`). Nothing blocks a write for
being over quota. `StatsCards` shows a toast at ≥90% usage. The
`EnhancedDataManagementSettings` panel shows a hardcoded `/10MB` limit that
matches no tier.

**Proposal.**
- Quotas (entries, storage bytes, agent keys) are defined in the typed catalog
  per plan, and enforced **server-side** — Firestore rules or a Cloud Function
  guard, never the client. The client usage bar is a mirror, not a gate.
- Over-limit policy on **downgrade/cancellation**: soft-lock. Existing content
  stays readable and exportable; new writes to the over-limit resource are
  rejected with a clear error until usage drops below the new quota. No silent
  deletion.
- Over-limit policy at **quota ceiling during normal use**: hard stop on the
  specific resource (e.g., cannot save entry #51 on a 50-entry plan), with an
  upgrade prompt. This is the only place a paywall should interrupt capture.
- The `/10MB` display bug is fixed by sourcing the limit from the catalog.

**Open question for D-004:** the actual quota numbers per tier (the audit found
three conflicting free-tier storage figures) and whether entry-count caps exist
at all in the final model.

---

## 8. Trial (only if D-004 keeps a trial)

**Current reality.** Three contradictory public statements (no card / 14-day
trial / card required) and **no** trial implementation in Stripe checkout.

**Proposal (conditional on D-004 choosing a trial).**
- If a trial exists, implement it in Stripe: `subscription_data.trial_period_days`
  on the checkout session, and handle `customer.subscription.trial_will_end` in
  the webhook to send a reminder.
- One public sentence, everywhere: either "Free plan, no card required" **or**
  "14-day trial, card required, cancel before day 14 to avoid charges." Never
  both.
- The `trialing` state is a first-class lifecycle state (§1) and entitles the
  user to the full paid tier.

**Open question for D-004:** trial yes/no; if yes, card-required yes/no.

---

## 9. Summary of decisions needed from D-004

1. Final tier lineup and names (code says Free/Basic/Premium; ToS says
   Free/Pro/Teams/Enterprise).
2. Price per tier, and whether annual SKUs exist.
3. Trial: none vs. no-card vs. card-required.
4. Free-tier quotas: entry count, storage bytes, category count (or none).
5. Whether export, backups, and agent API keys are Premium-gated or universal.
6. Grace-period length for failed payments.
7. Refund one-liner for the subscription page.
8. Whether the 30-day post-cancellation retention promise is backed by a real
   (to-be-built) cleanup job.

---

*End of SAVE-003 lifecycle proposals. Awaiting D-004.*
