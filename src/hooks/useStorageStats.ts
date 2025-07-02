import { useMemo } from 'react';
import { SavedEntry } from '@/pages/Dashboard';
import { 
  calculateLocalStorageSize, 
  calculateEntryDataSize, 
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

export const useStorageStats = (entries: SavedEntry[]): StorageStats => {
  return useMemo(() => {
    const localStorageUsed = calculateLocalStorageSize();
    const databaseUsed = calculateEntryDataSize(entries);
    const totalUsed = localStorageUsed + databaseUsed;
    const limit = getStorageLimit();
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
  }, [entries]);
};