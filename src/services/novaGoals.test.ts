import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
const fixture = vi.hoisted(() => ({user: null as {uid: string; getIdToken: () => Promise<string>} | null}));
vi.mock('@/lib/firebase', () => ({auth: {get currentUser() {return fixture.user;}}}));
vi.mock('@/utils/cloudFunctions', () => ({getCloudFunctionUrl: () => 'https://example.test/novaAgent'}));
import {goalRequest} from './novaGoals';
const fetchMock = vi.fn();
beforeEach(() => {
  fixture.user = {uid: 'alice', getIdToken: vi.fn().mockResolvedValue('session-token')};
  fetchMock.mockReset().mockResolvedValue({ok: true, json: async () => ({available: true})});
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());
describe('Nova goal session boundary', () => {
  it('authenticates a plain profile using the actual Firebase session', async () => {
    await expect(goalRequest({uid: 'alice'}, {operation: 'status'})).resolves.toEqual({available: true});
    expect(fetchMock).toHaveBeenCalledWith('https://example.test/novaAgent', expect.objectContaining({headers: {'Content-Type': 'application/json', Authorization: 'Bearer session-token'}}));
  });
  it('rejects a stale profile before sending a request', async () => {
    await expect(goalRequest({uid: 'bob'}, {operation: 'create'})).rejects.toThrow('Sign in');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('rechecks account identity after asynchronous token retrieval', async () => {
    fixture.user!.getIdToken = async () => {fixture.user = null; return 'old-token';};
    await expect(goalRequest({uid: 'alice'}, {operation: 'create'})).rejects.toThrow('account changed');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
