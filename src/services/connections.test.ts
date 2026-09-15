import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
const fixture = vi.hoisted(() => ({user: null as {uid: string; getIdToken: () => Promise<string>} | null}));
vi.mock('@/lib/firebase', () => ({auth: {get currentUser() {return fixture.user;}}}));
vi.mock('@/utils/cloudFunctions', () => ({getCloudFunctionUrl: () => 'https://example.test/novaConnections'}));
import {connectionRequest, validateGoogleReturn} from './connections';
const request = vi.fn();
beforeEach(() => {fixture.user = {uid: 'alice', getIdToken: async () => 'token'}; request.mockReset().mockResolvedValue({ok: true, json: async () => ({connections: []})}); vi.stubGlobal('fetch', request);});
afterEach(() => vi.unstubAllGlobals());
describe('connection client authorization', () => {
  it('uses the Firebase session and rejects stale users', async () => {
    await expect(connectionRequest('alice', {operation: 'list'})).resolves.toEqual({connections: []});
    await expect(connectionRequest('bob', {operation: 'list'})).rejects.toThrow('Sign in');
    expect(request).toHaveBeenCalledTimes(1);
  });
  it('rejects results after an account change', async () => {
    request.mockImplementation(async () => {fixture.user = null; return {ok: true, json: async () => ({connections: []})};});
    await expect(connectionRequest('alice', {operation: 'list'})).rejects.toThrow('account changed');
  });
  it('binds Google authorization to the initiating browser, account, state, and expiry', () => {
    const pending = {uid: 'alice', state: 'nonce', provider: 'google_drive', expires: Date.now() + 10000};
    expect(validateGoogleReturn(JSON.stringify(pending), 'alice', 'nonce').provider).toBe('google_drive');
    for (const [raw, uid, state] of [[null, 'alice', 'nonce'], [JSON.stringify(pending), 'bob', 'nonce'], [JSON.stringify(pending), 'alice', 'different'], [JSON.stringify({...pending, expires: 0}), 'alice', 'nonce']]) expect(() => validateGoogleReturn(raw, uid!, state!)).toThrow('session');
  });
});
