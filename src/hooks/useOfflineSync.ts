
import { useEffect, useState, useCallback, useRef } from 'react';
import type { SavedEntry } from '@/types/dashboard';
import { useAuth } from '@/contexts/AuthContext';
import {
  cacheEntries,
  getCachedEntries,
  getOfflineQueue,
  removeFromOfflineQueue,
} from '@/utils/offlineStorage';
import { db } from '@/lib/firebase';
import { doc, setDoc, deleteDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { toast } from 'sonner';

export const useOfflineSync = () => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const syncingRef = useRef(false);

  // Sync pending offline changes to Firestore
  const syncPendingChanges = useCallback(async () => {
    if (!user || !navigator.onLine || syncingRef.current) return;

    syncingRef.current = true;
    setIsSyncing(true);

    try {
      const queue = await getOfflineQueue();
      if (queue.length === 0) {
        setIsSyncing(false);
        syncingRef.current = false;
        return;
      }

      let synced = 0;
      for (const item of queue) {
        try {
          if (item.action === 'create') {
            const entriesRef = collection(db, 'entries');
            await addDoc(entriesRef, {
              ...item.data,
              user_id: user.uid,
              created_at: serverTimestamp(),
              updated_at: serverTimestamp(),
              _syncedFromOffline: true,
            });
          } else if (item.action === 'update') {
            const entryId = item.data.id;
            if (typeof entryId !== 'string') {
              throw new Error('Offline queue item is missing an entry id');
            }
            const entryRef = doc(db, 'entries', entryId);
            await setDoc(entryRef, {
              ...item.data,
              updated_at: serverTimestamp(),
              _syncedFromOffline: true,
            }, { merge: true });
          } else if (item.action === 'delete') {
            const entryId = item.data.id;
            if (typeof entryId !== 'string') {
              throw new Error('Offline queue item is missing an entry id');
            }
            const entryRef = doc(db, 'entries', entryId);
            await deleteDoc(entryRef);
          }

          await removeFromOfflineQueue(item.id);
          synced++;
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
        }
      }

      if (synced > 0) {
        toast.success(`Synced ${synced} offline change${synced > 1 ? 's' : ''}`);
      }

      setPendingCount((await getOfflineQueue()).length);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
      syncingRef.current = false;
    }
  }, [user]);

  const checkPendingCount = useCallback(async () => {
    const queue = await getOfflineQueue();
    setPendingCount(queue.length);
  }, []);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingChanges();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPendingChanges]);

  // Listen for service worker sync messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_OFFLINE_ENTRIES') {
        syncPendingChanges();
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, [syncPendingChanges]);

  // Check pending count on mount
  useEffect(() => {
    checkPendingCount();
  }, [checkPendingCount]);

  // Cache entries locally when online
  const cacheEntriesLocally = useCallback(async (entries: SavedEntry[]) => {
    try {
      await cacheEntries(entries.map(entry => ({ ...entry })));
    } catch (error) {
      console.warn('Failed to cache entries locally:', error);
    }
  }, []);

  // Get entries from cache when offline
  const getCachedEntriesForUser = useCallback(async () => {
    if (!user) return [];
    try {
      return await getCachedEntries(user.uid);
    } catch (error) {
      console.warn('Failed to get cached entries:', error);
      return [];
    }
  }, [user]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    cacheEntriesLocally,
    getCachedEntriesForUser,
    syncPendingChanges,
  };
};
