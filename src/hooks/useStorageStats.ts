import { useMemo } from 'react';
import { SavedEntry } from "@/types/dashboard";
import { 
  calculateLocalStorageSize, 
  calculateDatabaseStorageSize, 
  getStorageLimit,
  calculateStoragePercentage,
  formatBytes 
} from '@/utils/storageUtils';

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

export const useStorageStats = (entries: SavedEntry[], userTier?: string): StorageStats => {
  return useMemo(() => {
    const localStorageUsed = calculateLocalStorageSize();
    const databaseUsed = calculateDatabaseStorageSize(entries);
    const totalUsed = localStorageUsed + databaseUsed;
    const limit = getStorageLimit(userTier);
    const percentage = calculateStoragePercentage(totalUsed, limit);
    const available = limit - totalUsed;

    return {
      totalUsed,
      totalUsedFormatted: formatBytes(totalUsed),
      localStorageUsed,
      databaseUsed,
      limit,
      limitFormatted: formatBytes(limit),
      percentage,
      availableFormatted: formatBytes(available),
    };
  }, [entries, userTier]);
};