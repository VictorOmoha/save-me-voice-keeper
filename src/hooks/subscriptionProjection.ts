export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'enterprise';

export const projectSubscription = (data: Record<string, unknown>): {
  tier: SubscriptionTier;
  active: boolean;
} => ({
  tier: typeof data.subscriptionTier === 'string'
    ? data.subscriptionTier as SubscriptionTier
    : 'free',
  active: data.subscriptionActive === true,
});
