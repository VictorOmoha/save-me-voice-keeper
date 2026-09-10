/** Server-owned inventory. Every query is scoped to the authenticated account. */
export const ACCOUNT_COLLECTIONS = [
  ...['entries','action_items','nova_memories','nova_conversations','entry_links','entry_entities','entity_graph','user_patterns','user_category_patterns','reminders','pending_notifications','api_keys','shared_memories','search_analytics','webhook_events','support_tickets'].map(name => ({name, owner: 'user_id'})),
  ...['users','profiles','user_preferences','search_preferences','nova_user_profile','user_roles','billing_entitlements','entitlement_usage','storage_usage'].map(name => ({name, owner: 'documentId'})),
  ...['extensionCredentials','extensionAccessTokens','extensionPairingCodes'].map(name => ({name, owner: 'userId'})),
  {name: 'stripe_event_ledger', owner: 'uid'},
] as const;
export const ACCOUNT_FILE_PREFIXES = ['documents', 'images', 'users'] as const;

export function safeAccountUid(uid: string): string {
  if (!uid || uid.length > 128 || /[/\\]/.test(uid) || [...uid].some(c => c.charCodeAt(0) < 32) || uid === '.' || uid === '..') throw new Error('Invalid account identifier');
  return uid;
}

/** Normalize timestamps and remove credentials recursively, including camelCase secrets. */
export function exportSafeValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(exportSafeValue);
  if (!value || typeof value !== 'object') return value;
  if ('toDate' in value && typeof value.toDate === 'function') return value.toDate().toISOString();
  return Object.fromEntries(Object.entries(value).filter(([key]) => {
    const normalized = key.replace(/[^a-z]/gi, '').toLowerCase();
    return !/secret|password|token|apikey|privatekey|keyhash|codehash/.test(normalized);
  }).map(([key, nested]) => [key, exportSafeValue(nested)]));
}

/** Preserve byte boundaries when a Storage stream splits a file between chunks. */
export async function* base64Chunks(source: AsyncIterable<Buffer>): AsyncGenerator<string> {
  let tail = Buffer.alloc(0);
  for await (const chunk of source) {
    const bytes = Buffer.concat([tail, chunk]);
    const boundary = bytes.length - bytes.length % 3;
    if (boundary) yield bytes.subarray(0, boundary).toString('base64');
    tail = bytes.subarray(boundary);
  }
  if (tail.length) yield tail.toString('base64');
}
