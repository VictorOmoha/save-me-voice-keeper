import {describe, expect, it} from 'vitest';
import {projectSubscription} from './subscriptionProjection';

describe('auth subscription projection', () => {
  it('consumes server-owned entitled semantics for trialing and past_due', () => {
    expect(projectSubscription({plan: 'basic', status: 'trialing', entitled: true}))
      .toEqual({tier: 'basic', active: true});
    expect(projectSubscription({plan: 'premium', status: 'past_due', entitled: true}))
      .toEqual({tier: 'premium', active: true});
  });

  it('fails closed when entitlement is absent, false, or has an unknown plan', () => {
    expect(projectSubscription({plan: 'basic', status: 'active'}))
      .toEqual({tier: 'free', active: false});
    expect(projectSubscription({plan: 'premium', status: 'active', entitled: false}))
      .toEqual({tier: 'free', active: false});
    expect(projectSubscription({plan: 'enterprise', status: 'active', entitled: true}))
      .toEqual({tier: 'free', active: false});
  });

  it('does not restore authority from the client-writable users projection', () => {
    expect(projectSubscription({subscriptionTier: 'premium', subscriptionActive: true}))
      .toEqual({tier: 'free', active: false});
  });
});
