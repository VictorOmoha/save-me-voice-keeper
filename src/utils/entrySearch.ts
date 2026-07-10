import type { SavedEntry } from "@/types/dashboard";

/**
 * Shared entry-search primitives. Every retrieval surface (entry list filter,
 * smart search suggestions) should match against the same haystack so a query
 * that works in one place works in all of them.
 *
 * Coverage: title, category, tags, summary, entities, action items, and every
 * value nested inside `fields` (including table cells), not just top-level
 * string fields.
 */

/** Lowercase + strip diacritics so "café" matches "cafe". */
export const normalizeSearchText = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFD")
    // combining marks range U+0300-U+036F
    .replace(/[̀-ͯ]/g, "");

const MAX_SEARCH_NESTING = 8;

const collectText = (value: unknown, out: string[], depth = 0): void => {
  if (value === null || value === undefined || depth > MAX_SEARCH_NESTING) return;
  if (typeof value === "string") {
    if (value) out.push(value);
    return;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    out.push(String(value));
    return;
  }
  if (value instanceof Date) {
    out.push(value.toISOString().slice(0, 10));
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectText(item, out, depth + 1);
    return;
  }
  if (typeof value === "object") {
    for (const item of Object.values(value)) collectText(item, out, depth + 1);
  }
};

const haystackCache = new WeakMap<SavedEntry, string>();

/** All searchable text of an entry, normalized, cached per entry object. */
export const buildEntryHaystack = (entry: SavedEntry): string => {
  const cached = haystackCache.get(entry);
  if (cached !== undefined) return cached;

  const parts: string[] = [entry.title];
  if (entry.category) parts.push(entry.category);
  if (entry.summary) parts.push(entry.summary);
  if (entry.tags?.length) parts.push(entry.tags.join(" "));
  if (entry.entities?.length) parts.push(entry.entities.join(" "));
  collectText(entry.action_items, parts);
  collectText(entry.fields, parts);

  const haystack = normalizeSearchText(parts.join("\n"));
  haystackCache.set(entry, haystack);
  return haystack;
};

/**
 * Token-AND matching: every word of the query must appear somewhere in the
 * entry ("dentist tuesday" matches an entry with "dentist" in the title and
 * "Tuesday" in a field). An empty query matches everything.
 */
export const entryMatchesQuery = (entry: SavedEntry, query: string): boolean => {
  const tokens = normalizeSearchText(query.trim()).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = buildEntryHaystack(entry);
  return tokens.every((token) => haystack.includes(token));
};
