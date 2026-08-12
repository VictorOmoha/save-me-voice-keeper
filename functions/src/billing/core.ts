export type PlanId = "free" | "basic" | "premium";
export type PaidPlanId = Exclude<PlanId, "free">;
export type BillingEnvironment = "test" | "live";
export type BillingStatus = "free" | "trialing" | "active" | "past_due" | "canceled";

type Env = Record<string, string | undefined>;

export interface PriceCatalog {
  environment: BillingEnvironment;
  byPlan: Readonly<Record<PaidPlanId, string>>;
  byPrice: Readonly<Record<string, PaidPlanId>>;
}

export class BillingConfigurationError extends Error {}

const priceVariable = (environment: BillingEnvironment, plan: PaidPlanId): string =>
  `STRIPE_${environment.toUpperCase()}_${plan.toUpperCase()}_MONTHLY_PRICE_ID`;

/** Build the immutable server-side price catalog. Missing values fail closed. */
export const loadPriceCatalog = (env: Env = process.env): PriceCatalog => {
  const environment = env.STRIPE_MODE;
  if (environment !== "test" && environment !== "live") {
    throw new BillingConfigurationError("STRIPE_MODE must be explicitly set to test or live");
  }

  const basic = env[priceVariable(environment, "basic")]?.trim();
  const premium = env[priceVariable(environment, "premium")]?.trim();
  if (!basic || !premium) {
    throw new BillingConfigurationError(
      `Both ${priceVariable(environment, "basic")} and ${priceVariable(environment, "premium")} are required`
    );
  }
  if (basic === premium) {
    throw new BillingConfigurationError("Basic and Premium must use distinct Stripe price IDs");
  }

  const byPlan = Object.freeze({basic, premium});
  return Object.freeze({
    environment,
    byPlan,
    byPrice: Object.freeze({[basic]: "basic", [premium]: "premium"}),
  });
};

export const checkoutPrice = (requestedPlan: unknown, catalog: PriceCatalog): {plan: PaidPlanId; priceId: string} | null => {
  if (requestedPlan !== "basic" && requestedPlan !== "premium") return null;
  return {plan: requestedPlan, priceId: catalog.byPlan[requestedPlan]};
};

export const planForPrice = (priceId: unknown, catalog: PriceCatalog): PaidPlanId | undefined =>
  typeof priceId === "string" ? catalog.byPrice[priceId] : undefined;

export const customerBelongsToUser = (
  customer: {deleted?: boolean | void; metadata?: Record<string, string>} | null | undefined,
  uid: string
): boolean => Boolean(customer && !customer.deleted && customer.metadata?.firebaseUserId === uid);

export const normalizeStripeStatus = (status: unknown): BillingStatus => {
  switch (status) {
  case "trialing": return "trialing";
  case "active": return "active";
  case "past_due":
  case "unpaid": return "past_due";
  case "canceled":
  case "incomplete_expired": return "canceled";
  default: return "free";
  }
};

export interface BillingEntitlement {
  schemaVersion: 1;
  uid: string;
  plan: PlanId;
  status: BillingStatus;
  entitled: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: number | null;
  lastStripeEventId: string;
  lastStripeEventCreated: number;
  mappingError: string | null;
}

export interface LifecycleEvent {
  id: string;
  created: number;
  type: string;
  status?: unknown;
  priceId?: unknown;
  customerId?: string | null;
  subscriptionId?: string | null;
  currentPeriodEnd?: number | null;
}

/**
 * Normalize a Stripe lifecycle event into the stable entitlement contract.
 * Older events are acknowledged/ledgered but cannot overwrite newer state.
 */
export const normalizeLifecycle = (
  uid: string,
  event: LifecycleEvent,
  catalog: PriceCatalog,
  previous?: BillingEntitlement
): BillingEntitlement => {
  if (previous && event.created < previous.lastStripeEventCreated) return previous;

  const paymentFailed = event.type === "invoice.payment_failed";
  const status = paymentFailed ? "past_due" : normalizeStripeStatus(event.status);
  const mappedPlan = planForPrice(event.priceId, catalog);
  const retainedPlan = status === "past_due" && previous?.plan && previous.plan !== "free" ? previous.plan : undefined;
  const plan: PlanId = status === "canceled" || status === "free"
    ? "free"
    : mappedPlan || retainedPlan || "free";
  const mappingError = status !== "canceled" && status !== "free" && !mappedPlan && !retainedPlan
    ? `Unknown or unconfigured Stripe price: ${String(event.priceId || "<missing>")}`
    : null;
  const entitled = (status === "trialing" || status === "active" || status === "past_due") && plan !== "free";

  return {
    schemaVersion: 1,
    uid,
    plan,
    status,
    entitled,
    stripeCustomerId: event.customerId ?? previous?.stripeCustomerId ?? null,
    stripeSubscriptionId: event.subscriptionId ?? previous?.stripeSubscriptionId ?? null,
    currentPeriodEnd: event.currentPeriodEnd ?? previous?.currentPeriodEnd ?? null,
    lastStripeEventId: event.id,
    lastStripeEventCreated: event.created,
    mappingError,
  };
};
