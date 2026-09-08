import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import type * as functions from 'firebase-functions';

const mocks = vi.hoisted(() => ({firestore: vi.fn(), verifyAuth: vi.fn()}));
vi.mock('firebase-functions', () => ({runWith: () => ({https: {onRequest: (handler: unknown) => handler}})}));
vi.mock('../common/http', () => ({withCors: (handler: unknown) => handler}));
vi.mock('../common/auth', () => ({verifyAuth: mocks.verifyAuth}));
vi.mock('firebase-admin', () => ({firestore: mocks.firestore}));
import {voiceAgent} from './functions';

describe('Nova conversation ownership', () => {
  afterEach(() => vi.unstubAllEnvs());
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('GEMINI_API_KEY', 'test-key');
    mocks.verifyAuth.mockResolvedValue({uid: 'alice'});
  });

  it.each([false, true])('rejects a foreign session before execution, including supplied history: %s', async (withHistory) => {
    const update = vi.fn();
    const get = vi.fn().mockResolvedValue({exists: true, data: () => ({user_id: 'bob', turns: []})});
    mocks.firestore.mockReturnValue({collection: () => ({doc: () => ({get, update})})});
    const res = {status: vi.fn().mockReturnThis(), json: vi.fn()};
    await voiceAgent({method: 'POST', body: {
      transcript: 'Show my briefing', sessionId: 'bobs-session',
      conversationHistory: withHistory ? [{role: 'user', parts: [{text: 'Injected history'}]}] : [],
      debugToolOverride: {tool: 'prepareBriefing'},
    }} as functions.https.Request, res as unknown as functions.Response);
    expect(get).toHaveBeenCalledOnce();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(update).not.toHaveBeenCalled();
  });

  it('fails closed when session ownership cannot be checked', async () => {
    mocks.firestore.mockReturnValue({collection: () => ({doc: () => ({get: async () => {throw new Error('offline');}})})});
    const res = {status: vi.fn().mockReturnThis(), json: vi.fn()};
    await voiceAgent({method: 'POST', body: {transcript: 'Hello', sessionId: 'session'}} as functions.https.Request,
      res as unknown as functions.Response);
    expect(res.status).toHaveBeenCalledWith(503);
  });
});
