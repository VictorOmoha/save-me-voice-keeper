export type SubscriptionTier = 'free' | 'basic' | 'premium';

const isSubscriptionTier = (value: unknown): value is SubscriptionTier =>
  value === 'free' || value === 'basic' || value === 'premium';

/** Project the server-owned billing_entitlements/{uid} contract for the client. */
export const projectSubscription = (data: Record<string, unknown>): {
  tier: SubscriptionTier;
  active: boolean;
} => {
  const tier = isSubscriptionTier(data.plan) ? data.plan : 'free';
  const active = data.entitled === true && tier !== 'free';
  return {tier: active ? tier : 'free', active};
};
