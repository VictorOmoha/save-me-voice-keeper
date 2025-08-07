import { supabase } from "@/integrations/supabase/client";

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
  async trackSearch(data: SearchAnalyticsData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('search_analytics')
        .insert({
          user_id: user.id,
          query: data.query,
          results_count: data.resultsCount,
          clicked_result_id: data.clickedResultId,
          search_type: data.searchType || 'text',
          response_time_ms: data.responseTimeMs
        });

      if (error) {
        console.error('Error tracking search:', error);
      }
    } catch (error) {
      console.error('Search analytics error:', error);
    }
  }

  async getPopularSearches(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('search_analytics')
        .select('query, count(*)')
        .not('query', 'eq', '')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .order('count', { ascending: false })
        .limit(limit);

      return data || [];
    } catch (error) {
      console.error('Error fetching popular searches:', error);
      return [];
    }
  }

  async getUserSearchHistory(limit = 20) {
    try {
      const { data, error } = await supabase
        .from('search_analytics')
        .select('query, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

      return data || [];
    } catch (error) {
      console.error('Error fetching search history:', error);
      return [];
    }
  }

  async getSearchPreferences(): Promise<SearchPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('search_preferences')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching search preferences:', error);
        return null;
      }

      return data ? {
        preferredCategories: data.preferred_categories || [],
        searchSuggestionsEnabled: data.search_suggestions_enabled ?? true,
        voiceSearchEnabled: data.voice_search_enabled ?? true,
        semanticSearchEnabled: data.semantic_search_enabled ?? true,
        autoCompleteEnabled: data.auto_complete_enabled ?? true,
        recentSearchesLimit: data.recent_searches_limit ?? 10
      } : null;
    } catch (error) {
      console.error('Search preferences error:', error);
      return null;
    }
  }

  async updateSearchPreferences(preferences: Partial<SearchPreferences>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('search_preferences')
        .upsert({
          user_id: user.id,
          preferred_categories: preferences.preferredCategories,
          search_suggestions_enabled: preferences.searchSuggestionsEnabled,
          voice_search_enabled: preferences.voiceSearchEnabled,
          semantic_search_enabled: preferences.semanticSearchEnabled,
          auto_complete_enabled: preferences.autoCompleteEnabled,
          recent_searches_limit: preferences.recentSearchesLimit
        });

      if (error) {
        console.error('Error updating search preferences:', error);
      }
    } catch (error) {
      console.error('Search preferences update error:', error);
    }
  }

  async trackEntryOpened(entryId: string, query: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('search_analytics').insert({
        user_id: user.id,
        query,
        result_type: 'entry',
        result_id: entryId,
        action_type: 'entry_opened'
      });
    } catch (error) {
      console.error('Error tracking entry opened:', error);
    }
  }
}

export const searchAnalyticsService = new SearchAnalyticsService();