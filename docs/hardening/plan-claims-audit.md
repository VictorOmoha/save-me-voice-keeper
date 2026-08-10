# SAVE-003 — Plan Claims Audit

**Status:** M0 audit artifact · No production behavior changes
**Baseline:** `main @ 569225b68333d165a942dbd7f258cccc3413ca45`
**Author:** Vector Platform (client/platform)
**Date:** 2026-08-07
**Blocking decision:** Victor D-004 (final commercial model, due 2026-08-11)

This document inventories **every user-facing claim** about plans, prices, limits,
trials, payment methods, refunds, downgrades, platforms, data export, and agent/API
access found in the repository, and maps each claim to a disposition:

- **KEEP** — claim is accurate, load-bearing, and should survive D-004 unchanged.
- **CHANGE** — claim is wrong, stale, internally inconsistent, or depends on a
  decision Victor has not made yet. The proposed replacement text or behavior is
  noted, but nothing ships until D-004 lands.
- **REMOVE** — claim is false, misleading, refers to a dead surface, or creates
  legal/support exposure with no corresponding capability. Remove regardless of
  D-004 outcome (unless explicitly noted).

Disposition legend is followed by the full claims table, then a
conflict-matrix summary, then source-file references.

---

## 1. Conflicting plan tables (verified)

Covenant's report of **three conflicting pricing tables** is confirmed, and a
**fourth** surface (Stripe/server mapping) disagrees with all three. The trial
contradiction is also confirmed.

| Surface | File | Tiers named | Prices | Free-tier limits | Trial claim |
|---|---|---|---|---|---|
| Landing page | `src/pages/Index.tsx` | Free, Basic, Premium | $0 / $9 / $19 per mo | 50 entries, web only | "No card needed" |
| Subscription page | `src/pages/Subscription.tsx` | Free, Basic, Premium | $0 / $9 / $19 per mo | 50 entries | "14-day free trial included" |
| Settings → Subscription | `src/components/settings/SubscriptionSettings.tsx` | Free, Basic, Premium, Enterprise | $0 / $9 / $19 / Contact | 500 MB storage (no entry count) | "14-day free trial" |
| Terms of Service §6.1 | `TERMS_OF_SERVICE.md` + `src/pages/TermsOfService.tsx` | Free, Pro, Teams, Enterprise | $0 / $12·$120 / $29·$290 / custom | 100 entries, 50 MB, 3 categories, PDF export only | "Credit card required for trial activation" |

The **server-side** truth (`functions/src/billing/safety.ts`,
`functions/src/billing/functions.ts`) recognizes only `basic` and `premium` as
checkout plans, defaults an unrecognized Stripe price to `basic`, and has **no
trial configuration at all** (`stripe.checkout.sessions.create` is called
without `subscription_data.trial_period_days`). The type system
(`src/types/auth.ts`, `src/hooks/useAuthState.ts`) admits a fourth tier,
`enterprise`, which the webhook can write but checkout can never sell.

### Trial contradiction (verified)

- **"No card needed"** — landing hero (`Index.tsx:248`), pricing subhead
  (`Index.tsx:360`), final CTA (`Index.tsx:435`).
- **"14-day free trial"** — `Subscription.tsx:313` (per-plan) and
  `Subscription.tsx:334-336` (billing info), `SubscriptionSettings.tsx:132`
  and `:189`.
- **"Credit card required for trial activation"** — ToS §6.6
  (`TERMS_OF_SERVICE.md:171`, `src/pages/TermsOfService.tsx`).

These three statements cannot all be true. Server code implements **none** of
them (no trial period, no card-on-file requirement, no trial-end webhook
handling). This is a consumer-protection exposure, not just copy drift.

---

## 2. Claims inventory

Claims are grouped by subject. Each row gives the exact claim, its source, the
current evidence for/against it, and the disposition.

### 2.1 Plan names, prices, billing period

| # | Claim | Source (file:line) | Evidence | Disposition |
|---|---|---|---|---|
| C-01 | Free plan exists, $0 | Index.tsx:154; Subscription.tsx:27; SubscriptionSettings.tsx:21; ToS §6.1 | `useAuthState` defaults tier to `free`; no payment path for free. | **KEEP** |
| C-02 | Basic plan, $9/month | Index.tsx:163-165; Subscription.tsx:40-42 | Server accepts `basic`; `STRIPE_BASIC_PRICE_ID` env var with placeholder fallback `price_basic_monthly`. | **CHANGE** — price is a D-004 decision; keep the tier, hold the dollar figure until D-004. |
| C-03 | Premium plan, $19/month | Index.tsx:172-174; Subscription.tsx:54-56 | Server accepts `premium`; `STRIPE_PREMIUM_PRICE_ID` env var with placeholder fallback. | **CHANGE** — same as C-02. |
| C-04 | "Pro Tier — $12/month or $120/year" | ToS §6.1 (TERMS_OF_SERVICE.md:121; TermsOfService.tsx) | **No code path sells or recognizes a `pro` tier.** Webhook `getPlanFromPriceId` has no `pro` mapping. | **REMOVE** from ToS (or re-map to the surviving tier at D-004). Legally live text describing a non-existent plan. |
| C-05 | "Teams Tier — $29/month/user or $290/year/user" | ToS §6.1 (TERMS_OF_SERVICE.md:129) | **No `teams` tier anywhere in code, types, or webhook mapping.** No team-collaboration feature exists. | **REMOVE** — false claim of a product surface that does not exist. |
| C-06 | "Enterprise — Custom Pricing" | ToS §6.1 (TERMS_OF_SERVICE.md:137); SubscriptionSettings.tsx:48-55 | Type system and webhook admit `enterprise`, but checkout never sells it; SubscriptionSettings shows "Contact us" toast only. | **CHANGE** — decide at D-004 whether Enterprise is real. If kept, align ToS + Settings copy and define what "custom" includes; if dropped, remove from `src/types/auth.ts`, webhook map, and Settings card. |
| C-07 | Annual billing exists ($120/$290 per year) | ToS §6.1, §6.2 | Server checkout hardcodes monthly price IDs only; no annual price ID env var, no annual UI. | **REMOVE** until D-004 adds annual SKUs. Currently describes a billing cadence the backend cannot create. |
| C-08 | "Monthly (cancel anytime)" billing cycle | Subscription.tsx:331; SubscriptionSettings.tsx:132 | True for the only cadence the server creates. | **KEEP** (reword only if D-004 adds annual). |

### 2.2 Free-tier limits (entries, storage, categories, export)

| # | Claim | Source | Evidence | Disposition |
|---|---|---|---|---|
| C-09 | Free = "Up to 50 entries" | Index.tsx:160; Subscription.tsx:32 | **No enforcement found.** No quota check in `createCheckout`, no Firestore rule on entry count, no client gate on save. | **CHANGE** — either enforce the limit or stop claiming it. D-004 decision. |
| C-10 | Free = "100 entries maximum" | ToS §6.1 | Conflicts with C-09 (50 vs 100) and is equally unenforced. | **REMOVE** — cannot keep two different free entry caps; pick one at D-004. |
| C-11 | Free = "50 MB storage" | ToS §6.1 | Conflicts with `storageUtils.getStorageLimit('free')` = **500 MB**, and with Settings Subscription card "500 MB". | **REMOVE** — three different free storage numbers (50 MB / 500 MB / 10 MB). |
| C-12 | Free = "500 MB" storage | SubscriptionSettings.tsx:24; `storageUtils.ts` `getStorageLimit('free')` | Client hook uses this for the usage bar. | **CHANGE** — keep number only if D-004 confirms; route through the typed catalog instead of a hardcoded map. |
| C-13 | Free = "3 categories" | ToS §6.1 | No category limit in code; `StatsCards.tsx` hardcodes "5" categories for everyone. | **REMOVE** — unenforced and contradicted. |
| C-14 | Free = "PDF export only" | ToS §6.1 | Export modal (`ExportModal.tsx`) offers CSV/print to all tiers; no tier gate on format. | **REMOVE** — unenforced; also contradicted by SubscriptionSettings Free = "CSV export". |
| C-15 | Settings storage display shows "/10MB" limit | `EnhancedDataManagementSettings.tsx:252` | Hardcoded `/10MB` — matches **no** tier in any table (50 MB / 500 MB / 5 GB / 50 GB / 500 GB). | **REMOVE** — replace with catalog-driven limit; current value is pure invention. |
| C-16 | Free = "Web access only" | Subscription.tsx:34 | No platform gate exists; the extension is a web-property companion, and there is no mobile/desktop build to gate. | **CHANGE** — reword or drop; "web access only" implies other platforms exist for paid tiers, which they do not. |
| C-17 | Free = "Basic search" / "Basic data entry" / "Limited templates" | Index.tsx:160; Subscription.tsx:33; SubscriptionSettings.tsx:25 | No search-tier gating found; "templates" limit unenforced. | **CHANGE** — keep only if D-004 defines a real gated capability. |

### 2.3 Paid-tier limits (storage, entries, categories)

| # | Claim | Source | Evidence | Disposition |
|---|---|---|---|---|
| C-18 | Basic = 5 GB | SubscriptionSettings.tsx:33; `storageUtils.getStorageLimit('basic')` | Consistent between Settings card and hook. | **KEEP** (subject to D-004), route via catalog. |
| C-19 | Basic = "Unlimited entries" | Index.tsx:169; Subscription.tsx:45 | No entry cap on paid tiers in code. | **KEEP** — true by absence of enforcement. |
| C-20 | Premium = 50 GB | SubscriptionSettings.tsx:42; `storageUtils.getStorageLimit('premium')` | Consistent. | **KEEP** (subject to D-004). |
| C-21 | Premium = "Data export & backup" | Index.tsx:178; Subscription.tsx:60 | Export is available to **all** tiers (ExportModal has no tier gate); backup button (`EnhancedDataManagementSettings`) is not tier-gated either. | **CHANGE** — either gate export/backup behind Premium, or stop listing it as a Premium differentiator. |
| C-22 | Premium = "API access" / "API access for agents" | Index.tsx:178; Subscription.tsx:61 | `ApiKeysSettings.tsx` lets **any** signed-in user create agent API keys; shared-memory Functions exist for all tiers. | **CHANGE** — either gate agent keys behind Premium, or drop the claim. Today the differentiator is false. |
| C-23 | Premium = "Enhanced privacy controls" | Index.tsx:178; Subscription.tsx:61 | No privacy-control surface differs by tier. | **REMOVE** — vague, unimplemented, and a privacy over-claim (forbidden by the launch-campaign rules). |
| C-24 | Premium = "Custom integrations" | Index.tsx:178; Subscription.tsx:62 | No custom-integration feature found. | **REMOVE** |
| C-25 | Enterprise = "SSO, Admin controls, Custom integrations, Dedicated support" | SubscriptionSettings.tsx:52; ToS §6.1 | None of these exist. | **REMOVE** until an Enterprise SKU is actually designed. |
| C-26 | ToS §5.2 "Storage limits apply based on your subscription tier" | TERMS_OF_SERVICE.md:91 | Server never enforces storage per tier; only the client usage bar reads a limit. | **CHANGE** — true in principle, but the tiers it references are the wrong ones. Rewrite against the catalog after D-004. |

### 2.4 Trial claims

| # | Claim | Source | Evidence | Disposition |
|---|---|---|---|---|
| C-27 | "Start free — no card needed" | Index.tsx:248, :360, :435; launch-campaign week-4 copy | True for the Free tier today. | **KEEP** — but scope it: "no card needed **for the Free plan**." Do not let it read as "no card needed for trial," which contradicts ToS §6.6. |
| C-28 | "14-day free trial included" (per paid plan) | Subscription.tsx:313 | Server creates checkout **without** `trial_period_days`; no trial end handling in webhook. | **CHANGE** — do not advertise a trial the backend does not create. Either implement the trial (D-004) or remove the copy. |
| C-29 | "14 days on paid plans" (billing info) | Subscription.tsx:334-336 | Same as C-28. | **CHANGE** — same. |
| C-30 | "14-day free trial on paid plans" | SubscriptionSettings.tsx:132, :189 | Same as C-28. | **CHANGE** — same. |
| C-31 | "Credit card required for trial activation" | ToS §6.6 | Contradicts C-27 and is unimplemented. | **REMOVE** — pick one trial model at D-004; the current text is a legal liability. |
| C-32 | "You will be charged automatically when trial ends unless cancelled" | ToS §6.6 | No trial, so no auto-charge; but the sentence is dormant, not false, if a trial is added. | **CHANGE** — hold pending D-004. |

### 2.5 Payment methods, refunds, cancellation, downgrade

| # | Claim | Source | Evidence | Disposition |
|---|---|---|---|---|
| C-33 | "Payment Methods: Credit/Debit Cards, PayPal" | Subscription.tsx:338-339 | Server checkout sets `payment_method_types: ["card"]` only. **PayPal is not enabled.** | **REMOVE** PayPal until enabled; false payment-method claim is a Stripe/compliance issue. |
| C-34 | "Refund Policy: Pro-rated refunds available" | Subscription.tsx:342-343 | Contradicts ToS §6.4 ("No refunds for partial months", annual prorated only within 30 days). No refund code path exists. | **CHANGE** — align to ToS after D-004; do not promise "pro-rated refunds available" unconditionally. |
| C-35 | ToS §6.4 refund matrix (monthly none / annual 30-day prorated / trial none) | TERMS_OF_SERVICE.md:157-161 | Internally consistent but references an annual plan that does not exist (C-07). | **CHANGE** — keep the structure, re-map to real SKUs at D-004. |
| C-36 | ToS §6.5 "you retain access until end of paid period" then "reverts to Free tier (data may be deleted if over limits)" | TERMS_OF_SERVICE.md:163-167 | Webhook `customer.subscription.deleted` sets tier `free` immediately on deletion; there is no end-of-period grace logic and no over-limit deletion job. | **CHANGE** — the behavior is undefined in code; lifecycle proposals in `plan-lifecycle.md` cover this. Do not promise deletion that isn't built. |
| C-37 | ToS §6.7 downgrade policy (effective next cycle, delete data or keep tier, no refund) | TERMS_OF_SERVICE.md:175-179 | No downgrade flow exists; the only path is Stripe portal, whose behavior is not customized. | **CHANGE** — proposals only; see plan-lifecycle.md. |
| C-38 | ToS §3.3 "Upon termination, you have 30 days to export your data" | TERMS_OF_SERVICE.md:51; echoed in Privacy Policy line 262 | No automated 30-day deletion window is implemented; this is a policy statement without a mechanism. | **KEEP** as policy intent, but flag for D-004: either build the window or soften the promise. |

### 2.6 Support, platforms, agent access

| # | Claim | Source | Evidence | Disposition |
|---|---|---|---|---|
| C-39 | Free = "Standard support", Basic = "Priority support", Premium = "24/7 support" | Index.tsx:160/169/178; Subscription.tsx:35/49/64 | There is no support ticketing system, no SLA, no staffing model behind "24/7." Support email is `info@saveme.space` / `support@omohasolutions.com`. | **REMOVE** "24/7" and "Priority" as tiered claims until a support model exists (D-004). Over-claiming support is a classic refund-trigger. |
| C-40 | Support contact = `support@lovable.dev` | `EnhancedHelpSupportSettings.tsx:99` | Lovable is the scaffolding tool, not SaveMe. | **REMOVE** — wrong domain; route to `info@saveme.space`. |
| C-41 | "All platforms (Web, Mobile, Desktop)" for Basic | Subscription.tsx:47; Index.tsx:169 "All platforms" | No mobile or desktop build exists; the browser extension is not a "platform" in this sense. | **REMOVE** or reword to "Web + browser extension." |
| C-42 | "API access for agents" listed as Premium differentiator | Index.tsx:178 | Agent API keys are available to all tiers via Settings → API Keys (`ApiKeysSettings.tsx`). | **CHANGE** — see C-22. Either gate by tier or drop from Premium list. |
| C-43 | "Per-agent API keys with read/write scopes you control" | Index.tsx:316 | True — `ApiKeysSettings` supports read/write scopes. | **KEEP** |
| C-44 | "Works with Claude, Cursor, Codex, OpenClaw, and Hermes" | Index.tsx:263, :317 | Adapters exist in repo (`hermes-adapter/`, `openclaw-adapter/`). Claude/Cursor/Codex are claims about third-party clients, not something we ship. | **KEEP** with care — this is a compatibility claim; fine as long as we only claim "works with," not endorsement. |
| C-45 | Footer "Encrypted in transit · We never sell your data" | Index.tsx:482 | Consistent with Privacy Policy ("We do NOT sell your personal data"). "Encrypted in transit" is true (HTTPS, HSTS in firebase.json). | **KEEP** |
| C-46 | ToS §2 "Multi-Format Document Support: PDF, DOCX, Excel" | TERMS_OF_SERVICE.md:27 | Export supports CSV/print; import supports PDF/DOCX via mammoth/pdfjs. "Excel" handling is not evidenced. | **CHANGE** — soften to the formats actually supported. |

### 2.7 Stripe / server-side plan mapping

| # | Claim | Source | Evidence | Disposition |
|---|---|---|---|---|
| C-47 | Server recognizes `basic` and `premium` checkout plans only | `functions/src/billing/safety.ts:41` | Correct and should be the seed for the typed catalog. | **KEEP** |
| C-48 | Webhook maps `price_basic_monthly/yearly`, `price_premium_monthly/yearly`, `price_enterprise_monthly/yearly` | `functions/src/billing/functions.ts:253-261` | Placeholder price IDs; no env vars for yearly or enterprise exist; `getPlanFromPriceId` defaults unknown → `basic`, which is dangerous. | **CHANGE** — never default an unknown price to a paid tier. Map unknown → `free` + alert. The catalog design (SAVE-003 artifact) makes this mapping explicit per environment. |
| C-49 | `subscriptionTier` type admits `enterprise` | `src/types/auth.ts:8,14` | Consistent with webhook but not with checkout. | **CHANGE** — reconcile at D-004. |
| C-50 | `.env.example` notes price IDs must match Stripe config | `.env.example:23` | Good practice. | **KEEP** |

---

## 3. Conflict matrix (the short version for D-004)

1. **Free entry cap:** 50 (landing + subscription) vs 100 (ToS). → pick one.
2. **Free storage:** 50 MB (ToS) vs 500 MB (Settings + code) vs 10 MB (Settings data-management display). → pick one, drive from catalog.
3. **Paid tier names:** Basic/Premium (code + landing) vs Pro/Teams (ToS). → code is source of truth; ToS must be rewritten.
4. **Prices:** $9/$19 (landing + subscription + settings) vs $12/$29 (ToS). → Victor decides at D-004.
5. **Trial:** "no card needed" (landing) vs "14-day free trial" (subscription + settings) vs "card required for trial" (ToS). Server implements **none**. → D-004 must pick exactly one model; the other two surfaces get rewritten.
6. **Annual billing:** ToS describes it; code cannot sell it. → either build annual SKUs or strike the copy.
7. **PayPal:** subscription page claims it; Stripe checkout does not enable it. → remove or enable.
8. **Refunds:** "pro-rated refunds available" (subscription) vs "no refunds for partial months" (ToS). → align to ToS after D-004.
9. **Premium differentiators that are actually free for everyone:** data export, backups, agent API keys. → gate them or stop advertising them as Premium.
10. **"24/7 support", "Priority support", "Dedicated support", "Enhanced privacy controls", "Custom integrations", "All platforms (Mobile/Desktop)", "Teams collaboration", "SSO/Admin controls":** none exist. → remove until built.

---

## 4. Source files touched by this audit

- `src/pages/Index.tsx` (landing pricing table, trial/no-card copy, agent claims)
- `src/pages/Subscription.tsx` (subscription pricing table, trial copy, billing info, payment methods, refunds)
- `src/components/settings/SubscriptionSettings.tsx` (4-tier table, storage numbers, trial copy)
- `src/components/settings/EnhancedDataManagementSettings.tsx` (hardcoded `/10MB` storage limit)
- `src/components/settings/EnhancedHelpSupportSettings.tsx` (wrong support domain)
- `src/components/StatsCards.tsx` + `src/hooks/useStorageStats.ts` + `src/utils/storageUtils.ts` (storage limits 500 MB / 5 GB / 50 GB / 500 GB)
- `src/components/export/ExportModal.tsx` (export not tier-gated)
- `src/components/settings/ApiKeysSettings.tsx` (agent keys not tier-gated)
- `TERMS_OF_SERVICE.md` + `src/pages/TermsOfService.tsx` (Pro/Teams/Enterprise tables, trial-card, refunds, downgrades, annual billing, support)
- `PRIVACY_POLICY.md` (30-day export-after-cancellation echo)
- `functions/src/billing/safety.ts` (checkout plan config, allowed origins)
- `functions/src/billing/functions.ts` (price-ID → tier map, webhook behavior, no trial)
- `src/types/auth.ts`, `src/hooks/useAuthState.ts` (tier type incl. `enterprise`)
- `browser-extension/STORE_LISTING.md` (no pricing claims; privacy links use stale `#/` hash routes)
- `marketing/saveme-copy-bank.md`, `marketing/saveme-launch-campaign.md` ("Start free", "No card needed" — consistent with landing; no conflicting prices)

---

## 5. What this audit does NOT do

- It does **not** change any copy, price, or behavior. Every CHANGE/REMOVE above
  is a recommendation awaiting Victor's D-004 decision.
- It does **not** pick the final plan lineup. The typed catalog
  (`src/config/plans/`) is designed to express whatever D-004 decides without
  another code-wide sweep.
- It does **not** touch Stripe, Firestore rules, or the extension relay.

---

*End of SAVE-003 claims audit.*
