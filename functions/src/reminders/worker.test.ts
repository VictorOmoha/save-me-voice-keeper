import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {runInNewContext} from 'node:vm';
import {beforeEach, describe, expect, it, vi} from 'vitest';

type WorkerEvent = {data?: {json: () => unknown}; waitUntil: (work: Promise<void>) => void; notification?: {close: () => void}};
const listeners: Record<string, (event: WorkerEvent) => void> = {};
const entries = new Map<string, Response>();
const show = vi.fn();
const openWindow = vi.fn();
const cache = {
  match: async (key: string | {url: string}) => entries.get(typeof key === 'string' ? key : new URL(key.url).pathname)?.clone(),
  put: async (key: string, value: Response) => {entries.set(key, value);},
  delete: async (key: string) => entries.delete(key),
  keys: async () => [...entries.keys()].map(key => ({url: `https://saveme.space${key}`})),
};
beforeEach(() => {
  entries.clear(); show.mockClear(); openWindow.mockClear();
  entries.set('/__push-owner', new Response('alice'));
  runInNewContext(readFileSync(resolve(__dirname, '../../../public/sw.js'), 'utf8'), {
    self: {addEventListener: (name: string, fn: typeof listeners[string]) => {listeners[name] = fn;},
      registration: {showNotification: show}, location: {origin: 'https://saveme.space'},
      clients: {matchAll: async () => [], openWindow}},
    caches: {open: async () => cache}, Response, URL, Date,
  });
});
async function push(payload: unknown) {
  let work: Promise<void> = Promise.resolve();
  listeners.push({data: {json: () => payload}, waitUntil: promise => {work = promise;}});
  await work;
}
describe('Background reminder notifications', () => {
  it('shows a push while no app windows are open and suppresses repeat delivery', async () => {
    const payload = {data: {user_id: 'alice', notification_id: 'r1', body: 'Call Mum'}};
    await push(payload); await push(payload);
    expect(show).toHaveBeenCalledOnce();
    expect(show).toHaveBeenCalledWith('SaveMe reminder', expect.objectContaining({body: 'Call Mum', tag: 'r1'}));
  });
  it('suppresses a previous account’s reminders after logout or account switch', async () => {
    await push({data: {user_id: 'bob', notification_id: 'r1'}});
    entries.delete('/__push-owner');
    await push({data: {user_id: 'alice', notification_id: 'r1'}});
    expect(show).not.toHaveBeenCalled();
  });
  it('ignores malformed payloads and opens only the fixed reminders destination', async () => {
    await push(null); await push({data: {body: 'incomplete'}});
    expect(show).not.toHaveBeenCalled();
    let work: Promise<void> = Promise.resolve();
    listeners.notificationclick({notification: {close: vi.fn()}, waitUntil: promise => {work = promise;}});
    await work;
    expect(openWindow).toHaveBeenCalledWith('https://saveme.space/dashboard?reminders=open');
  });
});
