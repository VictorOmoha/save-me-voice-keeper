export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const calculateDatabaseStorageSize = (entries: Array<Record<string, unknown>>): number => {
  let totalSize = 0;
  
  entries.forEach(entry => {
    // Calculate size of the entry data
    const entryData = {
      id: entry.id,
      title: entry.title,
      fields: entry.fields,
      field_definitions: entry.field_definitions,
      created_at: entry.created_at,
      updated_at: entry.updated_at,
      user_id: entry.user_id
    };
    
    const entryString = JSON.stringify(entryData);
    totalSize += entryString.length * 2; // UTF-16 bytes estimate
    
    // Add extra calculation for field data
    if (entry.fields) {
      Object.values(entry.fields as Record<string, unknown>).forEach((value) => {
        if (typeof value === 'string') {
          totalSize += value.length * 2;
        }
      });
    }
  });
  
  return totalSize;
};

export const calculateLocalStorageSize = (): number => {
  // Since we're now using Firebase, local storage should be minimal
  // Only count auth tokens and app preferences
  let totalSize = 0;

  const relevantKeys = ['firebase:authUser', 'ui-theme', 'savedEntries'];
  
  relevantKeys.forEach(key => {
    const item = localStorage.getItem(key);
    if (item) {
      totalSize += (item.length + key.length) * 2;
    }
  });
  
  return totalSize;
};

export const getStorageLimit = (userTier: string = 'free'): number => {
  // Storage limits based on subscription tier
  const limits = {
    free: 500 * 1024 * 1024,      // 500 MB
    basic: 5 * 1024 * 1024 * 1024, // 5 GB  
    premium: 50 * 1024 * 1024 * 1024, // 50 GB
    enterprise: 500 * 1024 * 1024 * 1024 // 500 GB
  };
  
  return limits[userTier as keyof typeof limits] || limits.free;
};

export const calculateStoragePercentage = (used: number, limit: number): number => {
  return Math.round((used / limit) * 100);
};

export const getRecentActivityCount = (entries: Array<Record<string, unknown>>): number => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  return entries.filter(entry => {
    const entryDate = new Date(entry.createdAt);
    return entryDate >= oneWeekAgo;
  }).length;
};