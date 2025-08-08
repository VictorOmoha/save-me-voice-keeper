// Utility for robust category matching from free-form voice input
// Prefer exact and whole-word matches, avoid over-permissive substring checks

export const KNOWN_CATEGORIES = ['Documents', 'Health', 'Contacts', 'Finance', 'Personal'] as const;
export type KnownCategory = typeof KNOWN_CATEGORIES[number];

const CATEGORY_SYNONYMS: Record<KnownCategory, string[]> = {
  Documents: ['documents', 'document', 'docs', 'doc', 'files', 'file', 'paperwork', 'papers'],
  Health: ['health', 'medical', 'healthcare', 'medicine', 'doctor', 'wellness', 'fitness'],
  Contacts: ['contacts', 'contact', 'people', 'friends', 'friend', 'family', 'relationships', 'addresses', 'address book'],
  Finance: ['finance', 'financial', 'money', 'bank', 'budget', 'expense', 'expenses', 'income', 'banking', 'accounting'],
  Personal: ['personal', 'private', 'myself', 'self', 'misc', 'other', 'general']
};

// Normalize text: lowercase, remove diacritics, trim
function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();
}

function tokenize(input: string): string[] {
  return normalize(input)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

// Check if phrase is present as whole words
function containsWholePhrase(tokens: string[], phrase: string): boolean {
  const phraseTokens = tokenize(phrase);
  if (phraseTokens.length === 0) return false;
  // All tokens of the phrase must be present in order
  for (let i = 0; i <= tokens.length - phraseTokens.length; i++) {
    let ok = true;
    for (let j = 0; j < phraseTokens.length; j++) {
      if (tokens[i + j] !== phraseTokens[j]) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

export function matchCategory(input: string): KnownCategory | null {
  if (!input) return null;
  const norm = normalize(input);
  const tokens = tokenize(input);

  // 1) Exact category name match
  for (const cat of KNOWN_CATEGORIES) {
    if (norm === normalize(cat)) return cat;
  }

  // 2) Exact whole-phrase synonym match (e.g., "address book")
  for (const cat of KNOWN_CATEGORIES) {
    for (const syn of CATEGORY_SYNONYMS[cat]) {
      if (norm === normalize(syn)) return cat;
    }
  }

  // 3) Whole-word contains any synonym token/phrase
  // Score by: full phrase match > single word match; longer synonyms preferred
  type Candidate = { cat: KnownCategory; score: number };
  const candidates: Candidate[] = [];

  for (const cat of KNOWN_CATEGORIES) {
    for (const syn of CATEGORY_SYNONYMS[cat]) {
      const synTokens = tokenize(syn);
      const isPhrase = synTokens.length > 1;
      const matched = isPhrase ? containsWholePhrase(tokens, syn) : tokens.includes(synTokens[0]);
      if (matched) {
        const score = (isPhrase ? 3 : 1) + Math.min(2, synTokens.join('').length / 6);
        candidates.push({ cat, score });
      }
    }
  }

  if (candidates.length === 0) return null;

  // Pick the highest score; if tie across different categories, treat as ambiguous
  let best = candidates[0];
  let ambiguous = false;
  for (let i = 1; i < candidates.length; i++) {
    const c = candidates[i];
    if (c.score > best.score) {
      best = c;
      ambiguous = false;
    } else if (c.score === best.score && c.cat !== best.cat) {
      ambiguous = true;
    }
  }

  return ambiguous ? null : best.cat;
}
