import { SavedEntry } from "@/types/dashboard";

export interface SearchSuggestion {
  id: string;
  title: string;
  type: 'entry' | 'field' | 'category' | 'recent' | 'popular' | 'completion';
  matchText: string;
  entry?: SavedEntry;
  confidence: number;
  completionText?: string;
  entryId?: string;
  category?: string;
  relevantData?: unknown;
}

export interface IntelligentSearchOptions {
  enableSemanticSearch: boolean;
  enableAutoComplete: boolean;
  enableSpellCorrection: boolean;
  maxSuggestions: number;
  recentSearches: string[];
  popularSearches: string[];
  userPreferences?: string[];
}

class SearchIntelligence {
  private levenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  private calculateSemanticScore(searchTerm: string, text: string): number {
    const searchWords = searchTerm.toLowerCase().split(/\s+/);
    const textWords = text.toLowerCase().split(/\s+/);
    
    let totalScore = 0;
    let matches = 0;

    for (const searchWord of searchWords) {
      let bestMatch = 0;
      for (const textWord of textWords) {
        if (textWord.includes(searchWord) || searchWord.includes(textWord)) {
          bestMatch = Math.max(bestMatch, 0.8);
        } else {
          const distance = this.levenshteinDistance(searchWord, textWord);
          const similarity = 1 - (distance / Math.max(searchWord.length, textWord.length));
          if (similarity > 0.6) {
            bestMatch = Math.max(bestMatch, similarity * 0.6);
          }
        }
      }
      totalScore += bestMatch;
      if (bestMatch > 0.3) matches++;
    }

    const coverage = matches / searchWords.length;
    return (totalScore / searchWords.length) * coverage;
  }

  private generateAutoCompletions(query: string, entries: SavedEntry[]): SearchSuggestion[] {
    if (query.length < 2) return [];

    const completions = new Set<string>();
    const queryLower = query.toLowerCase();

    // Extract potential completions from entry titles and fields
    entries.forEach(entry => {
      // Title completions
      if (entry.title.toLowerCase().includes(queryLower)) {
        const words = entry.title.split(/\s+/);
        for (let i = 0; i < words.length; i++) {
          const phrase = words.slice(i, i + 3).join(' ');
          if (phrase.toLowerCase().startsWith(queryLower) && phrase.length > query.length) {
            completions.add(phrase);
          }
        }
      }

      // Field completions
      Object.values(entry.fields).forEach(value => {
        const valueStr = String(value);
        if (valueStr.toLowerCase().includes(queryLower)) {
          const words = valueStr.split(/\s+/);
          for (let i = 0; i < words.length; i++) {
            const phrase = words.slice(i, i + 3).join(' ');
            if (phrase.toLowerCase().startsWith(queryLower) && phrase.length > query.length) {
              completions.add(phrase);
            }
          }
        }
      });
    });

    return Array.from(completions).slice(0, 5).map((completion, index) => ({
      id: `completion-${index}`,
      title: completion,
      type: 'completion' as const,
      matchText: completion,
      confidence: 0.7,
      completionText: completion
    }));
  }

  private correctSpelling(query: string, entries: SavedEntry[]): string {
    if (query.length < 3) return query;

    const words = query.toLowerCase().split(/\s+/);
    const correctedWords = [];

    for (const word of words) {
      let bestMatch = word;
      let bestDistance = Infinity;

      // Check against entry titles and field values
      entries.forEach(entry => {
        const checkWords = [
          ...entry.title.toLowerCase().split(/\s+/),
          ...Object.values(entry.fields).flatMap(value => 
            String(value).toLowerCase().split(/\s+/)
          )
        ];

        checkWords.forEach(checkWord => {
          if (checkWord.length > 2) {
            const distance = this.levenshteinDistance(word, checkWord);
            if (distance < bestDistance && distance <= 2) {
              bestDistance = distance;
              bestMatch = checkWord;
            }
          }
        });
      });

      correctedWords.push(bestMatch);
    }

    return correctedWords.join(' ');
  }

  generateIntelligentSuggestions(
    query: string,
    entries: SavedEntry[],
    options: IntelligentSearchOptions
  ): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    const queryLower = query.toLowerCase().trim();

    if (!queryLower) {
      // Show recent and popular searches when no query
      options.recentSearches.slice(0, 5).forEach((recent, index) => {
        suggestions.push({
          id: `recent-${index}`,
          title: recent,
          type: 'recent',
          matchText: recent,
          confidence: 0.9
        });
      });

      options.popularSearches.slice(0, 3).forEach((popular, index) => {
        suggestions.push({
          id: `popular-${index}`,
          title: popular,
          type: 'popular',
          matchText: popular,
          confidence: 0.8
        });
      });

      return suggestions.slice(0, options.maxSuggestions);
    }

    // Spell correction
    const correctedQuery = options.enableSpellCorrection 
      ? this.correctSpelling(queryLower, entries)
      : queryLower;

    // Auto-completions
    if (options.enableAutoComplete) {
      const completions = this.generateAutoCompletions(correctedQuery, entries);
      suggestions.push(...completions);
    }

    // Entry suggestions with semantic scoring
    entries.forEach(entry => {
      let confidence = 0;
      let matchText = '';

      // Title matching
      const titleScore = options.enableSemanticSearch 
        ? this.calculateSemanticScore(correctedQuery, entry.title)
        : (entry.title.toLowerCase().includes(correctedQuery) ? 0.8 : 0);

      if (titleScore > 0.3) {
        confidence = Math.max(confidence, titleScore);
        matchText = entry.title;
      }

      // Field matching
      Object.entries(entry.fields).forEach(([key, value]) => {
        const valueStr = String(value);
        const fieldScore = options.enableSemanticSearch
          ? this.calculateSemanticScore(correctedQuery, valueStr)
          : (valueStr.toLowerCase().includes(correctedQuery) ? 0.7 : 0);

        if (fieldScore > 0.3) {
          confidence = Math.max(confidence, fieldScore * 0.9);
          if (!matchText || fieldScore > titleScore) {
            matchText = `${key}: ${valueStr}`;
          }
        }
      });

      // Boost confidence for preferred categories
      if (options.userPreferences?.some(pref => 
        entry.title.toLowerCase().includes(pref.toLowerCase())
      )) {
        confidence *= 1.2;
      }

      if (confidence > 0.3) {
        suggestions.push({
          id: entry.id,
          title: entry.title,
          type: 'entry',
          matchText,
          entry,
          confidence,
          entryId: entry.id,
          category: (typeof entry.fields.category === 'string' && entry.fields.category) || 'Personal'
        });
      }
    });

    // Category suggestions (simplified)
    const categories = ['notes', 'tasks', 'ideas', 'documents', 'contacts'];
    categories.forEach(category => {
      if (category.includes(correctedQuery)) {
        suggestions.push({
          id: `category-${category}`,
          title: `Search in ${category}`,
          type: 'category',
          matchText: category,
          confidence: 0.6
        });
      }
    });

    // Sort by confidence and limit results
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, options.maxSuggestions);
  }

  extractSearchTerms(query: string): string[] {
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 1)
      .map(term => term.replace(/[^\w]/g, ''));
  }

  buildSearchQuery(terms: string[]): string {
    return terms.join(' ');
  }
}

export const searchIntelligence = new SearchIntelligence();