import {describe, expect, it} from 'vitest';
import {projectSubscription} from './subscriptionProjection';

describe('auth subscription projection', () => {
  it('consumes server-projected active semantics for trialing and past_due', () => {
    expect(projectSubscription({subscriptionTier: 'basic', subscriptionStatus: 'trialing', subscriptionActive: true}))
      .toEqual({tier: 'basic', active: true});
    expect(projectSubscription({subscriptionTier: 'premium', subscriptionStatus: 'past_due', subscriptionActive: true}))
      .toEqual({tier: 'premium', active: true});
  });

  it('does not infer entitlement from active status when server projection is absent or false', () => {
    expect(projectSubscription({subscriptionTier: 'basic', subscriptionStatus: 'active'}))
      .toEqual({tier: 'basic', active: false});
    expect(projectSubscription({subscriptionTier: 'free', subscriptionStatus: 'active', subscriptionActive: false}))
      .toEqual({tier: 'free', active: false});
  });
});
