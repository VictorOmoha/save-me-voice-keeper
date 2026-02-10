import { useState, useEffect, useCallback } from 'react';
import { dequeue, removeFromQueue, type QueuedOperation } from '@/utils/offlineQueue';
import { logError } from '@/utils/logger';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  const refreshPendingCount = useCallback(async () => {
    try {
      const items = await dequeue();
      setPendingCount(items.length);
    } catch {
      // IndexedDB may not be available
      setPendingCount(0);
    }
  }, []);

  const processQueue = useCallback(async (items: QueuedOperation[]) => {
    const sorted = [...items].sort((a, b) => a.timestamp - b.timestamp);

    for (const item of sorted) {
      try {
        // Process based on operation type
        // Consumers should provide their own sync logic via event listeners
        const event = new CustomEvent('offlineSync:process', {
          detail: item,
        });
        window.dispatchEvent(event);

        await removeFromQueue(item.id);
      } catch (error) {
        logError('[OfflineSync] Failed to process queued item:', item.id);
        // Stop processing on error to maintain order
        break;
      }
    }

    await refreshPendingCount();
  }, [refreshPendingCount]);

  const syncNow = useCallback(async () => {
    if (!navigator.onLine) return;

    try {
      const items = await dequeue();
      if (items.length > 0) {
        await processQueue(items);
      }
    } catch (error) {
      logError('[OfflineSync] Sync failed:', error);
    }
  }, [processQueue]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending count on mount
    refreshPendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncNow, refreshPendingCount]);

  return { isOnline, pendingCount, syncNow };
}
