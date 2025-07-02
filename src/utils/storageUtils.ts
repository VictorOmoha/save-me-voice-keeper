export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const calculateLocalStorageSize = (): number => {
  let totalSize = 0;
  
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      totalSize += localStorage[key].length + key.length;
    }
  }
  
  // Convert to bytes (rough estimate, each character is ~2 bytes in UTF-16)
  return totalSize * 2;
};

export const calculateEntryDataSize = (entries: any[]): number => {
  const entriesString = JSON.stringify(entries);
  return entriesString.length * 2; // UTF-16 bytes estimate
};

export const getStorageLimit = (): number => {
  // 10 GB limit in bytes
  return 10 * 1024 * 1024 * 1024;
};

export const calculateStoragePercentage = (used: number, limit: number): number => {
  return Math.round((used / limit) * 100);
};