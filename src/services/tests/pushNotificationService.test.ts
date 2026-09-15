import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {disablePushDevice} from '../pushNotificationService';

const mocks = vi.hoisted(() => ({deleteDoc: vi.fn(), uid: 'alice'}));
vi.mock('@/lib/firebase', () => ({auth: {currentUser: {uid: mocks.uid}}, db: {}}));
vi.mock('firebase/firestore', () => ({deleteDoc: mocks.deleteDoc, doc: (_db: unknown, collection: string, id: string) => `${collection}/${id}`, getDoc: vi.fn(), serverTimestamp: vi.fn(), setDoc: vi.fn()}));
const clearOwner = vi.fn();
const unsubscribe = vi.fn();
const close = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  clearOwner.mockResolvedValue(true);
  unsubscribe.mockResolvedValue(true);
  mocks.deleteDoc.mockResolvedValue(undefined);
  vi.stubGlobal('caches', {open: async () => ({delete: clearOwner})});
  vi.stubGlobal('navigator', {serviceWorker: {getRegistration: async () => ({pushManager: {getSubscription: async () => ({unsubscribe})}, getNotifications: async () => [{close}]})}});
});
afterEach(() => {vi.unstubAllGlobals(); vi.useRealTimers(); localStorage.clear();});

describe('Push device sign-out', () => {
  it('blocks local display before unsubscribing and removes the account device', async () => {
    localStorage.setItem('saveme:push-device', JSON.stringify({uid: 'alice', id: 'device'}));
    await disablePushDevice();
    expect(clearOwner).toHaveBeenCalledWith('/__push-owner');
    expect(clearOwner.mock.invocationCallOrder[0]).toBeLessThan(unsubscribe.mock.invocationCallOrder[0]);
    expect(mocks.deleteDoc).toHaveBeenCalledWith('push_devices/device');
    expect(close).toHaveBeenCalled();
    expect(localStorage.getItem('saveme:push-device')).toBeNull();
  });
  it('clears display permission even when local device metadata was lost', async () => {
    await disablePushDevice();
    expect(clearOwner).toHaveBeenCalled();
    expect(unsubscribe).toHaveBeenCalled();
    expect(mocks.deleteDoc).not.toHaveBeenCalled();
  });
  it('does not block sign-out on an offline Firestore delete', async () => {
    localStorage.setItem('saveme:push-device', JSON.stringify({uid: 'alice', id: 'device'}));
    mocks.deleteDoc.mockReturnValue(new Promise(() => {}));
    await expect(disablePushDevice()).resolves.toBeUndefined();
    expect(localStorage.getItem('saveme:push-device')).toBeNull();
  });
  it('does not remember enrollment if provider cleanup rejects', async () => {
    localStorage.setItem('saveme:push-device', JSON.stringify({uid: 'alice', id: 'device'}));
    unsubscribe.mockRejectedValue(new Error('offline'));
    await expect(disablePushDevice()).rejects.toThrow('offline');
    expect(clearOwner).toHaveBeenCalled();
    expect(localStorage.getItem('saveme:push-device')).toBeNull();
  });
  it('bounds waiting for the push provider while the local guard is already cleared', async () => {
    vi.useFakeTimers();
    unsubscribe.mockReturnValue(new Promise(() => {}));
    const operation = disablePushDevice();
    await vi.advanceTimersByTimeAsync(4001);
    await expect(operation).resolves.toBeUndefined();
    expect(clearOwner).toHaveBeenCalled();
  });
});
