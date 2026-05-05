export type BillingPlan = "basic" | "premium";

type Env = Record<string, string | undefined>;

type CheckoutPlanConfig = {
  plan: BillingPlan;
  priceId: string;
};

const DEFAULT_ORIGIN = "https://saveme.space";

const ALLOWED_ORIGINS = new Set([
  DEFAULT_ORIGIN,
  "https://www.saveme.space",
  "https://saveme-f5af0.web.app",
  "https://saveme-f5af0.firebaseapp.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

export const getAllowedOrigin = (origin?: string | null): string | null => {
  if (!origin) return null;

  try {
    const parsed = new URL(origin);
    const normalized = parsed.origin;
    return ALLOWED_ORIGINS.has(normalized) ? normalized : null;
  } catch {
    return null;
  }
};

export const getSafeOrigin = (origin?: string | null): string => {
  return getAllowedOrigin(origin) || DEFAULT_ORIGIN;
};

export const getCheckoutPlanConfig = (
  requestedPlan: unknown,
  env: Env = process.env
): CheckoutPlanConfig | null => {
  if (requestedPlan !== "basic" && requestedPlan !== "premium") {
    return null;
  }

  const priceId = requestedPlan === "basic" ?
    env.STRIPE_BASIC_PRICE_ID || "price_basic_monthly" :
    env.STRIPE_PREMIUM_PRICE_ID || "price_premium_monthly";

  return {plan: requestedPlan, priceId};
};

export const sanitizeReturnUrl = (
  requestedUrl: unknown,
  requestOrigin: string | undefined,
  fallbackPath: string
): string => {
  const fallbackOrigin = getSafeOrigin(requestOrigin);
  const normalizedFallbackPath = fallbackPath.startsWith("/") ? fallbackPath : `/${fallbackPath}`;
  const fallbackUrl = `${fallbackOrigin}${normalizedFallbackPath}`;

  if (typeof requestedUrl !== "string" || !requestedUrl) {
    return fallbackUrl;
  }

  try {
    const parsed = new URL(requestedUrl, fallbackOrigin);
    const allowedOrigin = getAllowedOrigin(parsed.origin);
    if (!allowedOrigin) return fallbackUrl;
    return parsed.toString();
  } catch {
    return fallbackUrl;
  }
};
