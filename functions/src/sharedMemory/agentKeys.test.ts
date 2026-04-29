import { describe, expect, it } from 'vitest';
import { generateAgentApiKey, hashAgentApiKey, normalizeAgentPermissions } from './agentKeys';

describe('agent API key helpers', () => {
  it('generates secure SaveMe agent keys with enough entropy-friendly length', () => {
    const key = generateAgentApiKey();

    expect(key).toMatch(/^sm_[A-Za-z0-9_-]{43}$/);
    expect(key).not.toContain('+');
    expect(key).not.toContain('/');
    expect(key).not.toContain('=');
  });

  it('generates different keys on repeated calls', () => {
    const keys = new Set(Array.from({ length: 20 }, () => generateAgentApiKey()));

    expect(keys.size).toBe(20);
  });

  it('hashes keys with sha256 for storage only', () => {
    expect(hashAgentApiKey('sm_test_key')).toMatch(/^[a-f0-9]{64}$/);
    expect(hashAgentApiKey('sm_test_key')).toBe(hashAgentApiKey('sm_test_key'));
  });

  it('normalizes permissions to read/write and defaults to read/write', () => {
    expect(normalizeAgentPermissions(['read', 'admin', 'write'])).toEqual(['read', 'write']);
    expect(normalizeAgentPermissions(['admin'])).toEqual(['read', 'write']);
    expect(normalizeAgentPermissions(undefined)).toEqual(['read', 'write']);
  });
});
