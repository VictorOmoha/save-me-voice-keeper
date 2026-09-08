
import { useEffect, useState, useCallback, useRef } from 'react';
import type { SavedEntry } from '@/types/dashboard';
import { useAuth } from '@/contexts/AuthContext';
import {
  cacheEntries,
  getCachedEntries,
  getOfflineQueue,
  removeFromOfflineQueue,
} from '@/utils/offlineStorage';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

export const useOfflineSync = () => {
  const { user } = useAuth();
  const userId = user?.uid;
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const syncingRef = useRef(false);

  // Sync pending offline changes to Firestore
  const syncPendingChanges = useCallback(async () => {
    if (!userId || auth.currentUser?.uid !== userId || !navigator.onLine || syncingRef.current) return;

    syncingRef.current = true;
    setIsSyncing(true);

    try {
      const queue = await getOfflineQueue(userId);
      if (queue.length === 0) {
        setIsSyncing(false);
        syncingRef.current = false;
        return;
      }

      let synced = 0;
      for (const item of queue) {
        if (auth.currentUser?.uid !== userId || !navigator.onLine) break;
        if (item.userId !== userId) continue;
        try {
          if (item.action === 'create') {
            // A retry after a failed queue removal must reuse the same document.
            const entryRef = doc(db, 'entries', `offline_${item.id}`);
            await setDoc(entryRef, {
              ...item.data,
              user_id: userId,
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
            await updateDoc(entryRef, {
              ...item.data,
              user_id: userId,
              updated_at: serverTimestamp(),
              _syncedFromOffline: true,
            });
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

      if (synced > 0 && auth.currentUser?.uid === userId) {
        toast.success(`Synced ${synced} offline change${synced > 1 ? 's' : ''}`);
        window.dispatchEvent(new Event('nova:entries-changed'));
      }

      const remaining = await getOfflineQueue(userId);
      if (auth.currentUser?.uid === userId) setPendingCount(remaining.length);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
      syncingRef.current = false;
    }
  }, [userId]);

  const checkPendingCount = useCallback(async () => {
    setPendingCount(0);
    if (!userId) return;
    const queue = await getOfflineQueue(userId);
    if (auth.currentUser?.uid === userId) setPendingCount(queue.length);
  }, [userId]);

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
      if (!userId) return;
      await cacheEntries(entries.map(entry => ({ ...entry, user_id: userId })));
    } catch (error) {
      console.warn('Failed to cache entries locally:', error);
    }
  }, [userId]);

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
