import { SavedEntry, FieldValue, TableFieldValue } from "@/types/dashboard";

export interface VaultQueryResult {
  answer: string;
  matchedEntries: SavedEntry[];
  confidence: "high" | "medium" | "low";
  queryType:
    | "count"
    | "lookup"
    | "list"
    | "compare"
    | "timeline"
    | "general";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Lowercase-safe trim */
function lc(s: string): string {
  return (s ?? "").toLowerCase().trim();
}

/** Extract all searchable text from a FieldValue */
function fieldValueToStrings(val: FieldValue): string[] {
  if (val == null) return [];
  if (typeof val === "string") return [val];
  if (typeof val === "number") return [String(val)];
  if (val instanceof Date) return [val.toLocaleDateString()];
  // TableFieldValue
  if (typeof val === "object" && "headers" in val && "rows" in val) {
    const table = val as TableFieldValue;
    const parts: string[] = [...table.headers];
    table.rows.forEach((row) =>
      row.cells.forEach((cell) => parts.push(cell.value))
    );
    return parts;
  }
  // ImageFieldValue
  if (typeof val === "object" && "url" in val && !Array.isArray(val)) {
    return [(val as { name?: string }).name ?? ""];
  }
  // GalleryFieldValue (array of images)
  if (Array.isArray(val)) {
    return val.map((img) => img.name ?? "");
  }
  return [];
}

/** Get all searchable text for an entry */
function entrySearchText(entry: SavedEntry): string {
  const parts: string[] = [entry.title, entry.category ?? ""];
  for (const val of Object.values(entry.fields)) {
    parts.push(...fieldValueToStrings(val));
  }
  return parts.join(" ").toLowerCase();
}

/** Get a field value as a readable string for display */
function readableFieldValue(key: string, val: FieldValue): string | null {
  if (val == null) return null;
  if (typeof val === "string" && val.trim()) return val;
  if (typeof val === "number") return String(val);
  if (val instanceof Date) return val.toLocaleDateString();
  return null;
}

// ---------------------------------------------------------------------------
// Category matching
// ---------------------------------------------------------------------------

const CATEGORY_ALIASES: Record<string, string[]> = {
  documents: ["document", "documents", "doc", "docs", "paper", "papers", "certificate", "certificates", "contract", "contracts"],
  health: ["health", "medical", "medicine", "doctor", "hospital", "prescription", "prescriptions"],
  contacts: ["contact", "contacts", "people", "person", "phone", "email"],
  finance: ["finance", "financial", "money", "bank", "banking", "investment", "investments", "insurance", "tax", "taxes"],
  personal: ["personal", "private", "note", "notes", "memo", "memos", "goal", "goals"],
};

function matchCategory(query: string): string | null {
  const q = lc(query);
  for (const [category, aliases] of Object.entries(CATEGORY_ALIASES)) {
    if (aliases.some((a) => q.includes(a))) {
      return category;
    }
  }
  return null;
}

function entriesInCategory(entries: SavedEntry[], cat: string): SavedEntry[] {
  const c = lc(cat);
  return entries.filter((e) => lc(e.category ?? "").includes(c));
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}

function parseTimeRange(query: string): { from: Date; to: Date } | null {
  const q = lc(query);
  const now = new Date();
  if (q.includes("today")) return { from: startOfDay(now), to: now };
  if (q.includes("yesterday")) {
    const y = daysAgo(1);
    const end = new Date(y);
    end.setHours(23, 59, 59, 999);
    return { from: y, to: end };
  }
  if (q.includes("last week") || q.includes("past week"))
    return { from: daysAgo(7), to: now };
  if (q.includes("last month") || q.includes("past month"))
    return { from: daysAgo(30), to: now };
  if (q.includes("last year") || q.includes("past year"))
    return { from: daysAgo(365), to: now };
  if (q.includes("recent") || q.includes("latest") || q.includes("newest"))
    return { from: daysAgo(14), to: now };
  return null;
}

// ---------------------------------------------------------------------------
// Intent detection
// ---------------------------------------------------------------------------

type QueryType = VaultQueryResult["queryType"];

interface ParsedIntent {
  type: QueryType;
  keywords: string[];
  category: string | null;
  timeRange: { from: Date; to: Date } | null;
  compareCategories: [string, string] | null;
}

function parseIntent(question: string): ParsedIntent {
  const q = lc(question);

  const category = matchCategory(q);
  const timeRange = parseTimeRange(q);

  // Compare
  const compareMatch = q.match(
    /(?:more|compare|versus|vs)\b.*?\b(\w+)\b.*?\b(?:or|and|vs|versus)\b.*?\b(\w+)/
  );
  if (compareMatch) {
    const cat1 = matchCategory(compareMatch[1]) ?? compareMatch[1];
    const cat2 = matchCategory(compareMatch[2]) ?? compareMatch[2];
    return {
      type: "compare",
      keywords: [],
      category: null,
      timeRange: null,
      compareCategories: [cat1, cat2],
    };
  }

  // Count
  if (
    /\b(how many|count|number of|total)\b/.test(q)
  ) {
    return {
      type: "count",
      keywords: extractKeywords(q),
      category,
      timeRange,
      compareCategories: null,
    };
  }

  // Timeline
  if (
    timeRange ||
    /\b(when|recent|latest|newest|oldest|first|last\s+\w+|timeline)\b/.test(q)
  ) {
    return {
      type: "timeline",
      keywords: extractKeywords(q),
      category,
      timeRange: timeRange ?? { from: daysAgo(14), to: new Date() },
      compareCategories: null,
    };
  }

  // List
  if (/\b(list|show|display|all|what\s+(documents?|entries|items|records?))\b/.test(q)) {
    return {
      type: "list",
      keywords: extractKeywords(q),
      category,
      timeRange: null,
      compareCategories: null,
    };
  }

  // Lookup  (what's my, find, where is, search)
  if (
    /\b(what'?s?\s+my|find|where\s+is|search|look\s*up|get\s+my|show\s+my)\b/.test(
      q
    )
  ) {
    return {
      type: "lookup",
      keywords: extractKeywords(q),
      category,
      timeRange: null,
      compareCategories: null,
    };
  }

  // Fallback: general
  return {
    type: "general",
    keywords: extractKeywords(q),
    category,
    timeRange,
    compareCategories: null,
  };
}

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "do", "does", "did",
  "i", "me", "my", "have", "has", "had", "how", "many", "much",
  "what", "where", "when", "which", "who", "show", "list", "find",
  "get", "all", "of", "in", "on", "to", "for", "and", "or", "it",
  "that", "this", "with", "from", "about", "can", "you", "tell",
  "please", "give", "display", "count", "number", "total",
  "entries", "entry", "records", "record", "items", "item",
  "do", "more", "than", "compare", "versus", "vs",
]);

function extractKeywords(q: string): string[] {
  return q
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

// ---------------------------------------------------------------------------
// Search helpers
// ---------------------------------------------------------------------------

function searchEntries(entries: SavedEntry[], keywords: string[]): SavedEntry[] {
  if (keywords.length === 0) return entries;
  return entries.filter((entry) => {
    const text = entrySearchText(entry);
    return keywords.some((kw) => text.includes(kw));
  });
}

function findFieldMatch(
  entry: SavedEntry,
  keywords: string[]
): { key: string; value: string } | null {
  for (const [key, val] of Object.entries(entry.fields)) {
    const readable = readableFieldValue(key, val);
    if (!readable) continue;
    const lower = readable.toLowerCase();
    if (keywords.some((kw) => key.toLowerCase().includes(kw) || lower.includes(kw))) {
      return { key, value: readable };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Answer composers
// ---------------------------------------------------------------------------

function composeCountAnswer(
  matched: SavedEntry[],
  intent: ParsedIntent,
  total: number
): string {
  if (intent.category) {
    const catName = intent.category.charAt(0).toUpperCase() + intent.category.slice(1);
    return `You have ${matched.length} ${catName} ${matched.length === 1 ? "entry" : "entries"} (out of ${total} total).`;
  }
  return `You have ${total} ${total === 1 ? "entry" : "entries"} in your vault.`;
}

function composeLookupAnswer(
  matched: SavedEntry[],
  intent: ParsedIntent
): string {
  if (matched.length === 0) {
    return `I couldn't find anything matching "${intent.keywords.join(" ")}". Try rephrasing or check your vault entries.`;
  }
  const lines: string[] = [];
  for (const entry of matched.slice(0, 5)) {
    const fieldMatch = findFieldMatch(entry, intent.keywords);
    if (fieldMatch) {
      lines.push(`**${entry.title}** - ${fieldMatch.key}: ${fieldMatch.value}`);
    } else {
      lines.push(`**${entry.title}**`);
    }
  }
  if (matched.length > 5) {
    lines.push(`...and ${matched.length - 5} more.`);
  }
  return `Found ${matched.length} matching ${matched.length === 1 ? "entry" : "entries"}:\n${lines.join("\n")}`;
}

function composeListAnswer(
  matched: SavedEntry[],
  intent: ParsedIntent
): string {
  const label = intent.category
    ? intent.category.charAt(0).toUpperCase() + intent.category.slice(1)
    : "matching";
  if (matched.length === 0) {
    return `No ${label} entries found in your vault.`;
  }
  const lines = matched.slice(0, 10).map(
    (e) => `- **${e.title}**${e.category ? ` [${e.category}]` : ""}`
  );
  if (matched.length > 10) {
    lines.push(`...and ${matched.length - 10} more.`);
  }
  return `Here are your ${label} entries (${matched.length}):\n${lines.join("\n")}`;
}

function composeTimelineAnswer(matched: SavedEntry[]): string {
  if (matched.length === 0) {
    return "No entries found for that time period.";
  }
  const sorted = [...matched].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
  const lines = sorted.slice(0, 10).map(
    (e) =>
      `- **${e.title}** (${e.createdAt.toLocaleDateString()})${e.category ? ` [${e.category}]` : ""}`
  );
  if (sorted.length > 10) {
    lines.push(`...and ${sorted.length - 10} more.`);
  }
  return `Found ${matched.length} ${matched.length === 1 ? "entry" : "entries"} in that period:\n${lines.join("\n")}`;
}

function composeCompareAnswer(
  entries: SavedEntry[],
  cats: [string, string]
): string {
  const count1 = entriesInCategory(entries, cats[0]).length;
  const count2 = entriesInCategory(entries, cats[1]).length;
  const name1 = cats[0].charAt(0).toUpperCase() + cats[0].slice(1);
  const name2 = cats[1].charAt(0).toUpperCase() + cats[1].slice(1);
  if (count1 === count2) {
    return `You have the same number of ${name1} and ${name2} entries: ${count1} each.`;
  }
  const more = count1 > count2 ? name1 : name2;
  const less = count1 > count2 ? name2 : name1;
  const moreCount = Math.max(count1, count2);
  const lessCount = Math.min(count1, count2);
  return `You have more ${more} entries (${moreCount}) than ${less} entries (${lessCount}).`;
}

// ---------------------------------------------------------------------------
// Main query function
// ---------------------------------------------------------------------------

export function queryVault(
  question: string,
  entries: SavedEntry[]
): VaultQueryResult {
  const trimmed = question.trim();
  if (!trimmed) {
    return {
      answer: "Please ask a question about your vault entries.",
      matchedEntries: [],
      confidence: "low",
      queryType: "general",
    };
  }

  if (entries.length === 0) {
    return {
      answer:
        "Your vault is empty. Start by adding some entries, and then I can help you search and analyze them!",
      matchedEntries: [],
      confidence: "high",
      queryType: "general",
    };
  }

  const intent = parseIntent(trimmed);

  switch (intent.type) {
    case "count": {
      const matched = intent.category
        ? entriesInCategory(entries, intent.category)
        : searchEntries(entries, intent.keywords);
      return {
        answer: composeCountAnswer(matched, intent, entries.length),
        matchedEntries: matched,
        confidence: "high",
        queryType: "count",
      };
    }

    case "lookup": {
      const matched = searchEntries(entries, intent.keywords);
      return {
        answer: composeLookupAnswer(matched, intent),
        matchedEntries: matched.slice(0, 10),
        confidence: matched.length > 0 ? "high" : "low",
        queryType: "lookup",
      };
    }

    case "list": {
      let matched: SavedEntry[];
      if (intent.category) {
        matched = entriesInCategory(entries, intent.category);
      } else {
        matched = searchEntries(entries, intent.keywords);
        if (matched.length === 0) matched = entries;
      }
      return {
        answer: composeListAnswer(matched, intent),
        matchedEntries: matched.slice(0, 10),
        confidence: matched.length > 0 ? "high" : "medium",
        queryType: "list",
      };
    }

    case "timeline": {
      let matched = entries;
      if (intent.timeRange) {
        matched = entries.filter(
          (e) =>
            e.createdAt >= intent.timeRange!.from &&
            e.createdAt <= intent.timeRange!.to
        );
      }
      if (intent.category) {
        matched = entriesInCategory(matched, intent.category);
      }
      return {
        answer: composeTimelineAnswer(matched),
        matchedEntries: matched.slice(0, 10),
        confidence: matched.length > 0 ? "high" : "medium",
        queryType: "timeline",
      };
    }

    case "compare": {
      if (intent.compareCategories) {
        const [c1, c2] = intent.compareCategories;
        const m1 = entriesInCategory(entries, c1);
        const m2 = entriesInCategory(entries, c2);
        return {
          answer: composeCompareAnswer(entries, intent.compareCategories),
          matchedEntries: [...m1.slice(0, 5), ...m2.slice(0, 5)],
          confidence: "high",
          queryType: "compare",
        };
      }
      // Fallthrough if no categories identified
      return {
        answer:
          "I couldn't determine which categories to compare. Try something like: \"Do I have more health or finance entries?\"",
        matchedEntries: [],
        confidence: "low",
        queryType: "compare",
      };
    }

    default: {
      // General fallback - keyword search
      const matched = searchEntries(entries, intent.keywords);
      if (matched.length > 0) {
        const lines = matched.slice(0, 5).map(
          (e) => `- **${e.title}**${e.category ? ` [${e.category}]` : ""}`
        );
        return {
          answer: `I found ${matched.length} ${matched.length === 1 ? "entry" : "entries"} that might be relevant:\n${lines.join("\n")}`,
          matchedEntries: matched.slice(0, 10),
          confidence: "medium",
          queryType: "general",
        };
      }
      return {
        answer: `I couldn't find anything matching your question. Try asking things like:\n- "How many entries do I have?"\n- "Show my health records"\n- "Find my passport number"\n- "What did I save last week?"`,
        matchedEntries: [],
        confidence: "low",
        queryType: "general",
      };
    }
  }
}
