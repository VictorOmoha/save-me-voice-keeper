import {act, renderHook, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: {currentUser: {uid: 'alice'} as {uid: string} | null},
  getOfflineQueue: vi.fn(), removeFromOfflineQueue: vi.fn(), cacheEntries: vi.fn(),
  setDoc: vi.fn(), updateDoc: vi.fn(), deleteDoc: vi.fn(),
}));
vi.mock('@/contexts/AuthContext', () => ({useAuth: () => ({user: mocks.auth.currentUser})}));
vi.mock('@/lib/firebase', () => ({auth: mocks.auth, db: {}}));
vi.mock('@/utils/offlineStorage', () => ({
  getOfflineQueue: mocks.getOfflineQueue, removeFromOfflineQueue: mocks.removeFromOfflineQueue,
  cacheEntries: mocks.cacheEntries, getCachedEntries: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, collection: string, id: string) => `${collection}/${id}`,
  setDoc: mocks.setDoc, updateDoc: mocks.updateDoc, deleteDoc: mocks.deleteDoc,
  serverTimestamp: () => 'now',
}));
import {useOfflineSync} from './useOfflineSync';

const queued = (id: string, userId = 'alice') => ({id, userId, action: 'create', timestamp: 1, data: {title: id}});

describe('offline sync account isolation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.auth.currentUser = {uid: 'alice'};
    Object.defineProperty(navigator, 'onLine', {configurable: true, value: true});
    mocks.getOfflineQueue.mockResolvedValue([]);
    mocks.setDoc.mockResolvedValue(undefined);
    mocks.removeFromOfflineQueue.mockResolvedValue(undefined);
  });

  it('only syncs the current account and keeps a stable document ID on retry', async () => {
    mocks.getOfflineQueue.mockResolvedValue([queued('a'), queued('b', 'bob')]);
    mocks.removeFromOfflineQueue.mockRejectedValue(new Error('disk unavailable'));
    const {result} = renderHook(() => useOfflineSync());
    await act(async () => {await result.current.syncPendingChanges();});
    await act(async () => {await result.current.syncPendingChanges();});
    expect(mocks.getOfflineQueue).toHaveBeenCalledWith('alice');
    expect(mocks.setDoc).toHaveBeenCalledTimes(2);
    for (const [ref, data] of mocks.setDoc.mock.calls) {
      expect(ref).toBe('entries/offline_a');
      expect(data.user_id).toBe('alice');
    }
    expect(mocks.removeFromOfflineQueue).not.toHaveBeenCalledWith('b');
  });

  it('stops before the next write when the account changes during sync', async () => {
    mocks.getOfflineQueue.mockResolvedValue([queued('a'), queued('b')]);
    mocks.setDoc.mockImplementation(async () => {mocks.auth.currentUser = {uid: 'bob'};});
    const {result} = renderHook(() => useOfflineSync());
    await act(async () => {await result.current.syncPendingChanges();});
    expect(mocks.setDoc).toHaveBeenCalledTimes(1);
    expect(mocks.removeFromOfflineQueue).toHaveBeenCalledWith('a');
    expect(mocks.removeFromOfflineQueue).not.toHaveBeenCalledWith('b');
  });

  it('clears the previous account pending count on logout', async () => {
    mocks.getOfflineQueue.mockResolvedValue([queued('a')]);
    const {result, rerender} = renderHook(() => useOfflineSync());
    await waitFor(() => expect(result.current.pendingCount).toBe(1));
    mocks.auth.currentUser = null;
    rerender();
    await waitFor(() => expect(result.current.pendingCount).toBe(0));
    await act(async () => {await result.current.syncPendingChanges();});
    expect(mocks.setDoc).not.toHaveBeenCalled();
  });

  it('keeps failed updates queued instead of recreating a deleted entry', async () => {
    mocks.getOfflineQueue.mockResolvedValue([{...queued('edit'), action: 'update', data: {id: 'deleted-entry'}}]);
    mocks.updateDoc.mockRejectedValue(new Error('not-found'));
    const {result} = renderHook(() => useOfflineSync());
    await act(async () => {await result.current.syncPendingChanges();});
    expect(mocks.updateDoc).toHaveBeenCalledWith('entries/deleted-entry', expect.objectContaining({user_id: 'alice'}));
    expect(mocks.setDoc).not.toHaveBeenCalled();
    expect(mocks.removeFromOfflineQueue).not.toHaveBeenCalled();
  });
});
