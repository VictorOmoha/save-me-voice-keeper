
import { auth } from '@/lib/firebase';

const CLOUD_FUNCTIONS_URL = import.meta.env.VITE_CLOUD_FUNCTIONS_URL || '';

// Local embedding cache to avoid redundant API calls
type SearchableEntry = {
  title?: string;
  fields?: Record<string, unknown>;
};

const embeddingCache = new Map<string, number[]>();

/**
 * Generate an embedding vector for a text string via Cloud Function
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!CLOUD_FUNCTIONS_URL) return null;

  const cacheKey = text.trim().toLowerCase().slice(0, 200);
  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey)!;
  }

  const currentUser = auth.currentUser;
  if (!currentUser) return null;

  try {
    const token = await currentUser.getIdToken();
    const response = await fetch(`${CLOUD_FUNCTIONS_URL}/generateEmbedding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ text: text.trim() }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.embedding) {
      embeddingCache.set(cacheKey, data.embedding);
      // Keep cache manageable
      if (embeddingCache.size > 100) {
        const firstKey = embeddingCache.keys().next().value;
        if (firstKey) embeddingCache.delete(firstKey);
      }
      return data.embedding;
    }
    return null;
  } catch (error) {
    console.warn('Semantic search embedding failed:', error);
    return null;
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * Build a searchable text from an entry
 */
export function entryToSearchText(entry: SearchableEntry): string {
  const parts = [entry.title || ''];

  if (entry.fields) {
    for (const [key, value] of Object.entries(entry.fields)) {
      if (typeof value === 'string') {
        parts.push(value);
      }
    }
  }

  return parts.join(' ').trim();
}

/**
 * Perform semantic search over entries
 * Returns entries sorted by semantic similarity to the query
 */
export async function semanticSearch(
  query: string,
  entries: SearchableEntry[],
  topK = 10
): Promise<Array<{ entry: SearchableEntry; score: number }>> {
  const queryEmbedding = await generateEmbedding(query);
  if (!queryEmbedding) return [];

  const results: Array<{ entry: SearchableEntry; score: number }> = [];

  for (const entry of entries) {
    const searchText = entryToSearchText(entry);
    if (!searchText) continue;

    const entryEmbedding = await generateEmbedding(searchText.slice(0, 500));
    if (!entryEmbedding) continue;

    const score = cosineSimilarity(queryEmbedding, entryEmbedding);
    results.push({ entry, score });
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter(r => r.score > 0.3); // Minimum relevance threshold
}

/**
 * Check if semantic search is available
 */
export function isSemanticSearchAvailable(): boolean {
  return !!CLOUD_FUNCTIONS_URL && !!auth.currentUser;
}
