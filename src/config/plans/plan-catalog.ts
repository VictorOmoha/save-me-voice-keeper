/**
 * SAVE-003 — Typed plan catalog (NON-OPERATIVE).
 *
 * This module is a design artifact for Milestone M0. It is the intended single
 * source of truth for plan identity, display copy, price, trial, entitlements,
 * quotas, and the Stripe price mapping per environment.
 *
 * ⚠️  M0 CONTRACT ARTIFACT — NOT YET WIRED INTO PRODUCTION. ⚠️
 *
 * - Victor approved D-004 on 2026-08-10; the plan, price, quota, trial, and
 *   entitlement values below are the ratified launch contract.
 * - Nothing in the live app imports this module yet. SAVE-105 owns server-side
 *   enforcement and shared client consumption.
 * - Stripe price IDs are never stored in client source. They are immutable,
 *   environment-specific server configuration. Unknown IDs fail closed.
 *
 * Location rationale: this lives under `src/config/plans/` because it is shared,
 * typed configuration consumed (eventually) by both the client (display) and —
 * as a copied/derived contract — the Functions billing code (server authority).
 * Keeping it out of `src/pages` and `src/components` signals that it is not a
 * rendering concern.
 */

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

/**
 * Stable plan IDs. These are the canonical, never-renamed identifiers stored on
 * `users/{uid}.subscriptionTier` and used as lookup keys everywhere. Display
 * names change; IDs do not.
 * D-004 ratifies exactly three launch IDs. Pro, Teams, and Enterprise are not
 * launch plans and must not appear in the canonical catalog.
 */
export type PlanId = "free" | "basic" | "premium";

/** Billing period for a payable plan. `none` = the free plan. */
export type BillingPeriod = "none" | "month" | "year";

// ---------------------------------------------------------------------------
// Entitlements and quotas
// ---------------------------------------------------------------------------

/**
 * The full set of capability flags and numeric quotas a plan can grant. Every
 * user-facing claim from the audit maps to exactly one field here, so that a
 * claim cannot drift from the value that backs it.
 *
 * `null` for a quota means "unlimited".
 */
export interface PlanEntitlements {
  // Capture / content
  maxEntries: number | null;
  maxStorageBytes: number | null;
  maxCategories: number | null;

  // Feature gates
  advancedSearch: boolean;
  voiceInput: boolean;
  dataExport: boolean;
  dataBackup: boolean;
  agentApiAccess: boolean;
  customIntegrations: boolean;
  enhancedPrivacyControls: boolean;

  // Platform reach (see audit C-16 / C-41: only web + extension exist today)
  platforms: ReadonlyArray<"web" | "browser-extension" | "mobile" | "desktop">;

  // Support tier (display + routing; no SLA is implied by the string)
  supportLevel: "standard" | "priority" | "dedicated";
}

// ---------------------------------------------------------------------------
// Trial
// ---------------------------------------------------------------------------

export interface TrialConfig {
  /** Length of the trial in days. `0` = no trial. */
  days: number;
  /** Whether a payment method is required to start the trial. */
  cardRequired: boolean;
}

// ---------------------------------------------------------------------------
// Stripe mapping (per environment)
// ---------------------------------------------------------------------------

export type StripeEnvironment = "test" | "live";

/**
 * Maps a plan + billing period to a Stripe price ID for one environment.
 * Values here are placeholders. The loader below resolves the *real* price ID
 * from environment variables so this file never carries a live ID.
 */
export interface StripePriceMapping {
  /** Environment variable containing the immutable Stripe price ID (server only). */
  envVar: string;
}

// ---------------------------------------------------------------------------
// Lifecycle state mapping
// ---------------------------------------------------------------------------

/**
 * Canonical lifecycle states (superset of Stripe's subscription.status).
 * See docs/hardening/plan-lifecycle.md §1.
 */
export type LifecycleState =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "free";

/**
 * Maps a raw Stripe subscription status to the catalog's lifecycle state.
 * Critically, a `past_due` subscription is NOT `free` — it retains its tier
 * during the grace window. This fixes the current webhook behavior that flips
 * any non-`active` status straight to `free`
 * (`functions/src/billing/functions.ts:233-234`).
 */
export const lifecycleFromStripeStatus = (
  stripeStatus: string
): LifecycleState => {
  switch (stripeStatus) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "canceled";
    default:
      return "free";
  }
};

// ---------------------------------------------------------------------------
// Plan definition
// ---------------------------------------------------------------------------

export interface PlanDefinition {
  id: PlanId;
  /** Display name shown in UI copy. */
  displayName: string;
  /**
   * Short marketing blurb. Copy is referenced by a key so that all surfaces
   * (landing, subscription, settings) render the same string from one place.
   */
  copyKey: string;

  price: {
    /** Whole-unit display amount, e.g. 9 for "$9". `0` for free. */
    amount: number;
    currency: "USD";
    period: BillingPeriod;
  };

  trial: TrialConfig;

  entitlements: PlanEntitlements;

  /** Whether this plan can be purchased through self-serve checkout. */
  sellable: boolean;

  /**
   * Stripe price IDs keyed by environment and billing period. Populated with
   * placeholders; real values resolve from env at the edge (server) only.
   */
  stripe: {
    [env in StripeEnvironment]?: Partial<
      Record<Exclude<BillingPeriod, "none">, StripePriceMapping>
    >;
  };
}

// ---------------------------------------------------------------------------
// The catalog
// ---------------------------------------------------------------------------

export const PLAN_CATALOG: Readonly<Record<PlanId, PlanDefinition>> = {
  free: {
    id: "free",
    displayName: "Free",
    copyKey: "plans.free",
    price: { amount: 0, currency: "USD", period: "none" },
    trial: { days: 0, cardRequired: false },
    entitlements: {
      maxEntries: 50,
      maxStorageBytes: 500 * 1024 * 1024, // 500 MB — matches storageUtils.getStorageLimit('free')
      maxCategories: null,
      advancedSearch: false,
      voiceInput: true,
      dataExport: true,
      dataBackup: false,
      agentApiAccess: false,
      customIntegrations: false,
      enhancedPrivacyControls: false,
      platforms: ["web"],
      supportLevel: "standard",
    },
    sellable: false,
    stripe: {},
  },

  basic: {
    id: "basic",
    displayName: "Basic",
    copyKey: "plans.basic",
    price: { amount: 9, currency: "USD", period: "month" },
    trial: { days: 0, cardRequired: false }, // no trial until D-004 decides (audit C-28..C-32)
    entitlements: {
      maxEntries: null,
      maxStorageBytes: 5 * 1024 * 1024 * 1024, // 5 GB
      maxCategories: null,
      advancedSearch: true,
      voiceInput: true,
      dataExport: true,
      dataBackup: false,
      agentApiAccess: false,
      customIntegrations: false,
      enhancedPrivacyControls: false,
      platforms: ["web", "browser-extension"],
      supportLevel: "standard",
    },
    sellable: true,
    stripe: {
      test: { month: { envVar: "STRIPE_TEST_BASIC_MONTHLY_PRICE_ID" } },
      live: { month: { envVar: "STRIPE_LIVE_BASIC_MONTHLY_PRICE_ID" } },
    },
  },

  premium: {
    id: "premium",
    displayName: "Premium",
    copyKey: "plans.premium",
    price: { amount: 19, currency: "USD", period: "month" },
    trial: { days: 0, cardRequired: false },
    entitlements: {
      maxEntries: null,
      maxStorageBytes: 50 * 1024 * 1024 * 1024, // 50 GB
      maxCategories: null,
      advancedSearch: true,
      voiceInput: true,
      dataExport: true,
      dataBackup: false,
      agentApiAccess: true,
      customIntegrations: false,
      enhancedPrivacyControls: false,
      platforms: ["web", "browser-extension"],
      supportLevel: "standard",
    },
    sellable: true,
    stripe: {
      test: { month: { envVar: "STRIPE_TEST_PREMIUM_MONTHLY_PRICE_ID" } },
      live: { month: { envVar: "STRIPE_LIVE_PREMIUM_MONTHLY_PRICE_ID" } },
    },
  },

} as const;

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

/** All plans in display order. */
export const PLANS_IN_ORDER: ReadonlyArray<PlanDefinition> = [
  PLAN_CATALOG.free,
  PLAN_CATALOG.basic,
  PLAN_CATALOG.premium,
];

/** Look up a plan by ID. Returns `undefined` for unknown IDs — callers must handle it. */
export const getPlan = (id: string): PlanDefinition | undefined =>
  (PLAN_CATALOG as Record<string, PlanDefinition>)[id];

/** True if the given string is a known plan ID. */
export const isPlanId = (id: string): id is PlanId => id in PLAN_CATALOG;

/**
 * Resolve the Stripe price ID for a plan in a given environment.
 *
 * Resolution order (server only): real env var → placeholder. This function is
 * the ONLY place a price ID should be looked up once the catalog is wired in.
 * It is the type-safe replacement for the inline maps in
 * `functions/src/billing/safety.ts` and `functions/src/billing/functions.ts`.
 *
 * @returns the price ID, or `null` if the plan has no price for that period.
 */
export const resolveStripePriceId = (
  planId: PlanId,
  period: Exclude<BillingPeriod, "none">,
  env: StripeEnvironment,
  envVars: Record<string, string | undefined> = {}
): string | null => {
  const plan = PLAN_CATALOG[planId];
  const mapping = plan.stripe[env]?.[period];
  if (!mapping) return null;

  const fromEnv = envVars[mapping.envVar]?.trim();
  return fromEnv || null;
};

/**
 * Map a Stripe price ID back to a plan. Returns `undefined` for unknown IDs.
 *
 * This is the safe replacement for `getPlanFromPriceId`, which currently
 * defaults an unknown price to `"basic"` — a bug that grants a paid tier for an
 * unrecognized price. Unknown price IDs must map to nothing (and alert), never
 * to a paid plan.
 */
export const planFromStripePriceId = (
  priceId: string,
  envVars: Record<string, string | undefined> = {}
): PlanId | undefined => {
  for (const plan of PLANS_IN_ORDER) {
    for (const env of ["test", "live"] as const) {
      const byPeriod = plan.stripe[env];
      if (!byPeriod) continue;
      for (const period of Object.keys(byPeriod) as Array<"month" | "year">) {
        const variable = byPeriod[period]?.envVar;
        if (variable && envVars[variable]?.trim() === priceId) return plan.id;
      }
    }
  }
  return undefined;
};

/**
 * Whether a lifecycle state entitles the user to the plan's paid features.
 * `past_due` keeps the tier during grace; `canceled`/`free` do not.
 */
export const stateEntitlesToPlan = (state: LifecycleState): boolean =>
  state === "trialing" || state === "active" || state === "past_due";
