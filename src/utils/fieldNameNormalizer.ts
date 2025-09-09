// Utility to normalize field names between display and database formats

// Reserved field names that cannot be used for custom fields
export const RESERVED_FIELD_NAMES = [
  'id', 'title', 'category', 'created_at', 'updated_at', 'user_id',
  'fields', 'field_definitions', 'createdAt', 'updatedAt', 'userId'
];

export function normalizeToDbFieldName(name: string): string {
  if (!name) return '';
  // Convert camelCase to spaces, replace non-alphanumerics with space, trim, lower, underscores
  const withSpaces = name
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase -> spaces
    .replace(/[^a-zA-Z0-9]+/g, ' ') // non-alphanumeric -> space
    .trim()
    .toLowerCase();
  
  let normalized = withSpaces
    .replace(/\s+/g, '_') // spaces -> underscore
    .replace(/^_+|_+$/g, ''); // trim underscores
    
  // Check if the normalized name conflicts with reserved fields
  if (RESERVED_FIELD_NAMES.includes(normalized)) {
    normalized = `custom_${normalized}`;
  }
  
  return normalized;
}

export function isReservedFieldName(name: string): boolean {
  if (!name) return false;
  const normalized = name.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return RESERVED_FIELD_NAMES.includes(normalized);
}

export function validateFieldName(name: string): { isValid: boolean; error?: string; suggestion?: string } {
  if (!name || name.trim() === '') {
    return { isValid: false, error: 'Field name cannot be empty' };
  }
  
  if (isReservedFieldName(name)) {
    const suggestion = `Custom ${name}`;
    return { 
      isValid: false, 
      error: `"${name}" is a reserved field name`, 
      suggestion 
    };
  }
  
  return { isValid: true };
}

export function toDisplayFieldName(dbName: string): string {
  if (!dbName) return '';
  return dbName
    .replace(/[_\s]+/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .trim();
}
