import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('WebhookTesting source order', () => {
  it('declares loadLatestEntry before the effect that depends on it', () => {
    const source = readFileSync('src/components/settings/WebhookTesting.tsx', 'utf8');

    const callbackIndex = source.indexOf('const loadLatestEntry = useCallback');
    const effectIndex = source.indexOf('void loadLatestEntry();');

    expect(callbackIndex).toBeGreaterThan(-1);
    expect(effectIndex).toBeGreaterThan(-1);
    expect(callbackIndex).toBeLessThan(effectIndex);
  });
});
