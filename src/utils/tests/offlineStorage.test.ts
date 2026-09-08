import {afterEach, describe, expect, it, vi} from 'vitest';
import {addToOfflineQueue, getOfflineQueue, removeFromOfflineQueue} from '../offlineStorage';

afterEach(() => vi.unstubAllGlobals());

describe('offline queue storage', () => {
  it('returns only the requested account, in chronological order', async () => {
    const items = [
      {id: 'late', userId: 'alice', timestamp: 30},
      {id: 'other', userId: 'bob', timestamp: 10},
      {id: 'early', userId: 'alice', timestamp: 20},
    ];
    const read = {result: items, onsuccess: null as (() => void) | null};
    const db = {
      close: vi.fn(),
      transaction: () => ({objectStore: () => ({getAll: () => {
        queueMicrotask(() => read.onsuccess?.());
        return read;
      }})}),
    };
    const open = {result: db, onsuccess: null as (() => void) | null};
    vi.stubGlobal('indexedDB', {open: () => {
      queueMicrotask(() => open.onsuccess?.());
      return open;
    }});
    expect((await getOfflineQueue('alice')).map(item => item.id)).toEqual(['early', 'late']);
  });

  it('reports queue persistence failures to callers', async () => {
    vi.stubGlobal('indexedDB', {open: () => {throw new Error('Storage unavailable');}});
    await expect(addToOfflineQueue({action: 'create', userId: 'alice', data: {title: 'Unsaved'}})).rejects.toThrow('Storage unavailable');
    await expect(removeFromOfflineQueue('entry')).rejects.toThrow('Storage unavailable');
  });
});
