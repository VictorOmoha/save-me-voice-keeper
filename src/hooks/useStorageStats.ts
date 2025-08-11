import React, { useMemo, useEffect, useState } from 'react';
import { SavedEntry } from "@/types/dashboard";
import { 
  calculateLocalStorageSize, 
  calculateDatabaseStorageSize, 
  getStorageLimit,
  calculateStoragePercentage,
  formatBytes 
} from '@/utils/storageUtils';
import { supabase } from '@/integrations/supabase/client';

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
        // get_current_storage_usage may not exist in generated types; cast supabase to any
        const { data, error } = await (supabase as any).rpc('get_current_storage_usage');
        if (error) {
          console.warn('get_current_storage_usage error:', error);
          if (isMounted) setServerUsage(null);
          return;
        }

        if (data == null) {
          if (isMounted) setServerUsage(null);
          return;
        }

        const row = Array.isArray(data) ? (data[0] ?? null) : data;
        if (isMounted && row) {
          setServerUsage({
            user_id: row.user_id,
            tier: row.tier,
            limit_bytes: row.limit_bytes,
            db_bytes_used: row.db_bytes_used,
            file_bytes_used: row.file_bytes_used,
            total_bytes: row.total_bytes,
            updated_at: row.updated_at,
          });
        }
      } catch (e) {
        console.warn('Failed to fetch storage usage:', e);
        if (isMounted) setServerUsage(null);
      }
    };

    fetchUsage();

    // Optionally refresh when entries change to keep UI in sync
    // We intentionally don't run too often to avoid excessive RPC calls
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.length, userTier]);

  return useMemo(() => {
    const localStorageUsed = calculateLocalStorageSize();

    // Fallback estimates if server usage isn't available yet
    const estimatedDbUsed = calculateDatabaseStorageSize(entries);

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
