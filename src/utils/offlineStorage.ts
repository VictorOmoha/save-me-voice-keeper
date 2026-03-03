
const DB_NAME = 'saveme-offline';
const DB_VERSION = 1;
const ENTRIES_STORE = 'cached_entries';
const QUEUE_STORE = 'offline_queue';

interface OfflineQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  userId: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(ENTRIES_STORE)) {
        const entriesStore = db.createObjectStore(ENTRIES_STORE, { keyPath: 'id' });
        entriesStore.createIndex('userId', 'user_id', { unique: false });
        entriesStore.createIndex('updatedAt', 'updated_at', { unique: false });
      }

      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        const queueStore = db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Cache entries locally
export async function cacheEntries(entries: any[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(ENTRIES_STORE, 'readwrite');
    const store = tx.objectStore(ENTRIES_STORE);

    for (const entry of entries) {
      store.put({ ...entry, _cachedAt: Date.now() });
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    db.close();
  } catch (error) {
    console.warn('Failed to cache entries:', error);
  }
}

// Get cached entries for a user
export async function getCachedEntries(userId: string): Promise<any[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(ENTRIES_STORE, 'readonly');
    const store = tx.objectStore(ENTRIES_STORE);
    const index = store.index('userId');

    return new Promise((resolve, reject) => {
      const request = index.getAll(userId);
      request.onsuccess = () => {
        db.close();
        resolve(request.result || []);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    console.warn('Failed to get cached entries:', error);
    return [];
  }
}

// Add item to offline queue
export async function addToOfflineQueue(item: Omit<OfflineQueueItem, 'id' | 'timestamp'>): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(QUEUE_STORE);

    store.put({
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
    });

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    db.close();
  } catch (error) {
    console.warn('Failed to add to offline queue:', error);
  }
}

// Get all items from offline queue
export async function getOfflineQueue(): Promise<OfflineQueueItem[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(QUEUE_STORE, 'readonly');
    const store = tx.objectStore(QUEUE_STORE);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        db.close();
        resolve(request.result || []);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    console.warn('Failed to get offline queue:', error);
    return [];
  }
}

// Remove item from offline queue
export async function removeFromOfflineQueue(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(QUEUE_STORE);
    store.delete(id);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    db.close();
  } catch (error) {
    console.warn('Failed to remove from offline queue:', error);
  }
}

// Clear the entire offline queue
export async function clearOfflineQueue(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    const store = tx.objectStore(QUEUE_STORE);
    store.clear();

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    db.close();
  } catch (error) {
    console.warn('Failed to clear offline queue:', error);
  }
}

// Check if browser is online
export function isOnline(): boolean {
  return navigator.onLine;
}
