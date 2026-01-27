import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import type { User } from "firebase/auth";

export interface SearchAnalyticsData {
  query: string;
  resultsCount: number;
  clickedResultId?: string;
  searchType?: 'text' | 'voice' | 'semantic';
  responseTimeMs?: number;
}

export interface SearchPreferences {
  preferredCategories: string[];
  searchSuggestionsEnabled: boolean;
  voiceSearchEnabled: boolean;
  semanticSearchEnabled: boolean;
  autoCompleteEnabled: boolean;
  recentSearchesLimit: number;
}

class SearchAnalyticsService {
  async trackSearch(data: SearchAnalyticsData, user: User | null) {
    try {
      if (!user) return;

      const analyticsRef = collection(db, 'search_analytics');
      await addDoc(analyticsRef, {
        user_id: user.uid,
        query: data.query,
        results_count: data.resultsCount,
        clicked_result_id: data.clickedResultId || null,
        search_type: data.searchType || 'text',
        response_time_ms: data.responseTimeMs || null,
        created_at: serverTimestamp()
      });
    } catch (error) {
      console.error('Search analytics error:', error);
    }
  }

  async getPopularSearches(limit = 10, user: User | null) {
    try {
      if (!user) return [];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const analyticsRef = collection(db, 'search_analytics');
      const q = query(
        analyticsRef,
        where('created_at', '>=', Timestamp.fromDate(thirtyDaysAgo)),
        orderBy('created_at', 'desc')
      );

      const querySnapshot = await getDocs(q);

      // Count occurrences manually and sort by popularity
      const queryCounts = new Map<string, number>();
      querySnapshot.docs.forEach(docSnap => {
        const searchQuery = docSnap.data().query?.trim();
        if (searchQuery) {
          queryCounts.set(searchQuery, (queryCounts.get(searchQuery) || 0) + 1);
        }
      });

      return Array.from(queryCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([query]) => ({ query }));
    } catch (error) {
      console.error('Error fetching popular searches:', error);
      return [];
    }
  }

  async getUserSearchHistory(limit = 20, user: User | null) {
    try {
      if (!user) return [];

      const analyticsRef = collection(db, 'search_analytics');
      const q = query(
        analyticsRef,
        where('user_id', '==', user.uid),
        orderBy('created_at', 'desc')
      );

      const querySnapshot = await getDocs(q);

      const results: { query: string; created_at: Date }[] = [];
      querySnapshot.docs.slice(0, limit).forEach(docSnap => {
        const data = docSnap.data();
        if (data.query) {
          results.push({
            query: data.query,
            created_at: data.created_at?.toDate() || new Date()
          });
        }
      });

      return results;
    } catch (error) {
      console.error('Error fetching search history:', error);
      return [];
    }
  }

  async getSearchPreferences(user: User | null): Promise<SearchPreferences | null> {
    try {
      if (!user) return null;

      const prefsRef = doc(db, 'search_preferences', user.uid);
      const prefsSnap = await getDoc(prefsRef);

      if (!prefsSnap.exists()) {
        // Return default preferences if none exist
        return {
          preferredCategories: [],
          searchSuggestionsEnabled: true,
          voiceSearchEnabled: true,
          semanticSearchEnabled: true,
          autoCompleteEnabled: true,
          recentSearchesLimit: 10
        };
      }

      const data = prefsSnap.data();
      return {
        preferredCategories: data.preferred_categories || [],
        searchSuggestionsEnabled: data.search_suggestions_enabled ?? true,
        voiceSearchEnabled: data.voice_search_enabled ?? true,
        semanticSearchEnabled: data.semantic_search_enabled ?? true,
        autoCompleteEnabled: data.auto_complete_enabled ?? true,
        recentSearchesLimit: data.recent_searches_limit ?? 10
      };
    } catch (error) {
      console.error('Search preferences error:', error);
      return null;
    }
  }

  async updateSearchPreferences(preferences: Partial<SearchPreferences>, user: User | null) {
    try {
      if (!user) return;

      const prefsRef = doc(db, 'search_preferences', user.uid);
      await setDoc(prefsRef, {
        user_id: user.uid,
        preferred_categories: preferences.preferredCategories,
        search_suggestions_enabled: preferences.searchSuggestionsEnabled,
        voice_search_enabled: preferences.voiceSearchEnabled,
        semantic_search_enabled: preferences.semanticSearchEnabled,
        auto_complete_enabled: preferences.autoCompleteEnabled,
        recent_searches_limit: preferences.recentSearchesLimit,
        updated_at: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Search preferences update error:', error);
    }
  }

  async trackEntryOpened(entryId: string, query: string, user: User | null): Promise<void> {
    try {
      if (!user) return;

      const analyticsRef = collection(db, 'search_analytics');
      await addDoc(analyticsRef, {
        user_id: user.uid,
        query,
        result_type: 'entry',
        result_id: entryId,
        action_type: 'entry_opened',
        created_at: serverTimestamp()
      });
    } catch (error) {
      console.error('Error tracking entry opened:', error);
    }
  }
}

export const searchAnalyticsService = new SearchAnalyticsService();
