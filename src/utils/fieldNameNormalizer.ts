// Utility to normalize field names between display and database formats

export function normalizeToDbFieldName(name: string): string {
  if (!name) return '';
  // Convert camelCase to spaces, replace non-alphanumerics with space, trim, lower, underscores
  const withSpaces = name
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase -> spaces
    .replace(/[^a-zA-Z0-9]+/g, ' ') // non-alphanumeric -> space
    .trim()
    .toLowerCase();
  return withSpaces
    .replace(/\s+/g, '_') // spaces -> underscore
    .replace(/^_+|_+$/g, ''); // trim underscores
}

export function toDisplayFieldName(dbName: string): string {
  if (!dbName) return '';
  return dbName
    .replace(/[_\s]+/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .trim();
}
