import { useMemo, useEffect, useState } from 'react';
import { SavedEntry } from "@/types/dashboard";
import {
  calculateLocalStorageSize,
  calculateDatabaseStorageSize,
  getStorageLimit,
  calculateStoragePercentage,
  formatBytes
} from '@/utils/storageUtils';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface StorageStats {
  totalUsed: number;
  totalUsedFormatted: string;
  localStorageUsed: number;
  databaseUsed: number;
  limit: number;
  limitFormatted: string;
  percentage: number;
  availableFormatted: string;
}

type ServerUsage = {
  user_id: string;
  tier: 'free' | 'basic' | 'premium' | 'enterprise';
  limit_bytes: number;
  db_bytes_used: number;
  file_bytes_used: number;
  total_bytes: number;
  updated_at: string;
} | null;

type Tier = 'free' | 'basic' | 'premium' | 'enterprise';

const isValidTier = (tier: string): tier is Tier =>
  ['free', 'basic', 'premium', 'enterprise'].includes(tier as Tier);

export const useStorageStats = (entries: SavedEntry[], userTier?: string): StorageStats => {
  const [serverUsage, setServerUsage] = useState<ServerUsage>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchUsage = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          if (isMounted) setServerUsage(null);
          return;
        }

        // Try to get storage usage from Firebase (if stored there)
        // This is a simplified approach - you may want to implement a Cloud Function
        // to calculate accurate storage usage
        const usageRef = doc(db, 'storage_usage', user.uid);
        const usageSnap = await getDoc(usageRef);

        if (usageSnap.exists()) {
          const data = usageSnap.data();
          if (isMounted) {
            setServerUsage({
              user_id: user.uid,
              tier: data.tier || 'free',
              limit_bytes: data.limit_bytes || getStorageLimit('free'),
              db_bytes_used: data.db_bytes_used || 0,
              file_bytes_used: data.file_bytes_used || 0,
              total_bytes: data.total_bytes || 0,
              updated_at: data.updated_at || new Date().toISOString(),
            });
          }
        } else {
          if (isMounted) setServerUsage(null);
        }
      } catch (e) {
        if (import.meta.env.DEV) {
          console.warn('Failed to fetch storage usage:', e);
        }
        if (isMounted) setServerUsage(null);
      }
    };

    fetchUsage();

    // Optionally refresh when entries change to keep UI in sync
    // We intentionally don't run too often to avoid excessive calls
    return () => {
      isMounted = false;
    };
  }, [entries.length, userTier]);

  return useMemo(() => {
    const localStorageUsed = calculateLocalStorageSize();

    // Fallback estimates if server usage isn't available yet
    const estimatedDbUsed = calculateDatabaseStorageSize(entries.map(entry => ({ ...entry })));

    const normalizedTier = isValidTier((userTier || 'free').toLowerCase())
      ? ((userTier || 'free').toLowerCase() as Tier)
      : 'free';
    const fallbackLimit = getStorageLimit(normalizedTier);

    const dbUsed = serverUsage?.db_bytes_used ?? estimatedDbUsed;
    const fileUsed = serverUsage?.file_bytes_used ?? 0;
    const serverTotal = serverUsage?.total_bytes ?? (dbUsed + fileUsed);
    const limit = serverUsage?.limit_bytes ?? fallbackLimit;

    // For accurate quota usage, use only server-side bytes (DB + files).
    const totalUsed = serverTotal;
    const percentage = calculateStoragePercentage(totalUsed, limit);
    const available = Math.max(0, limit - totalUsed);

    return {
      totalUsed,
      totalUsedFormatted: formatBytes(totalUsed),
      localStorageUsed,
      databaseUsed: dbUsed + fileUsed,
      limit,
      limitFormatted: formatBytes(limit),
      percentage,
      availableFormatted: formatBytes(available),
    };
  }, [entries, userTier, serverUsage]);
};
