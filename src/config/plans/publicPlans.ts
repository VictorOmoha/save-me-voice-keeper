import {PLAN_CATALOG, PLANS_IN_ORDER, type PlanDefinition, type PlanId} from "./plan-catalog";

const formatPrice = (plan: PlanDefinition): string =>
  plan.price.amount === 0 ? "$0" : `$${plan.price.amount}`;

const formatPeriod = (plan: PlanDefinition): string => {
  if (plan.price.period === "none") return "forever";
  return plan.price.period === "month" ? "/mo" : `/${plan.price.period}`;
};

const featureLines = (plan: PlanDefinition): string[] => {
  const entries = plan.entitlements.maxEntries === null
    ? "Unlimited entries"
    : `Up to ${plan.entitlements.maxEntries} entries`;
  const storageBytes = plan.entitlements.maxStorageBytes ?? 0;
  const storage = storageBytes >= 1024 * 1024 * 1024
    ? `${storageBytes / (1024 * 1024 * 1024)} GB storage`
    : `${Math.round(storageBytes / (1024 * 1024))} MB storage`;
  const platforms = plan.entitlements.platforms.includes("browser-extension")
    ? "Web + browser extension"
    : "Web access";

  const lines = [entries, storage, platforms, "Voice capture", "Portable data export"];
  if (plan.entitlements.advancedSearch) lines.push("Advanced search");
  if (plan.entitlements.agentApiAccess) lines.push("Agent API access");
  lines.push("Standard support");
  return lines;
};

export const PUBLIC_PLAN_BLURBS: Record<PlanId, string> = {
  free: "Perfect for getting started.",
  basic: "For personal power users.",
  premium: "For advanced personal workflows.",
};

export const PUBLIC_PLAN_CTAS: Record<PlanId, string> = {
  free: "Start free",
  basic: "Get Basic",
  premium: "Get Premium",
};

export interface PublicPlanCard {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  blurb: string;
  cta: string;
  popular: boolean;
  sellable: boolean;
  features: string[];
}

export const publicPlanCards = (): PublicPlanCard[] =>
  PLANS_IN_ORDER.map((plan) => ({
    id: plan.id,
    name: plan.displayName,
    price: formatPrice(plan),
    period: formatPeriod(plan),
    blurb: PUBLIC_PLAN_BLURBS[plan.id],
    cta: PUBLIC_PLAN_CTAS[plan.id],
    popular: plan.id === "basic",
    sellable: plan.sellable,
    features: featureLines(plan),
  }));

export const sellablePlanIds = (): PlanId[] =>
  PLANS_IN_ORDER.filter((plan) => plan.sellable).map((plan) => plan.id);

export const isSellablePlanId = (value: string): value is "basic" | "premium" =>
  value === "basic" || value === "premium";

export const launchCatalogSummary = () => ({
  ids: Object.keys(PLAN_CATALOG).sort(),
  sellable: sellablePlanIds(),
  trialDays: PLANS_IN_ORDER.map((plan) => plan.trial.days),
  supportLevels: PLANS_IN_ORDER.map((plan) => plan.entitlements.supportLevel),
});
