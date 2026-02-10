import { useState, useEffect, useCallback, useRef } from "react";
import { SavedEntry } from "@/types/dashboard";
import { searchIntelligence, SearchSuggestion, IntelligentSearchOptions } from "@/utils/searchIntelligence";
import { searchAnalyticsService } from "@/services/searchAnalytics";
import { useAuth } from "@/contexts/AuthContext";
import { logDebug, logError } from "@/utils/logger";

interface UseIntelligentSearchProps {
  entries: SavedEntry[];
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  onSearchChange?: (query: string) => void;
  debounceMs?: number;
}

export const useIntelligentSearch = ({
  entries,
  onSuggestionSelect,
  onSearchChange,
  debounceMs = 300
}: UseIntelligentSearchProps) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [searchPreferences, setSearchPreferences] = useState<IntelligentSearchOptions>({
    enableSemanticSearch: true,
    enableAutoComplete: true,
    enableSpellCorrection: true,
    maxSuggestions: 8,
    recentSearches: [],
    popularSearches: [],
    userPreferences: []
  });

  const debounceRef = useRef<NodeJS.Timeout>();
  const searchStartTime = useRef<number>();

  // Load search preferences and history - deferred to avoid blocking initial render
  useEffect(() => {
    if (!user) return;

    // Defer loading to after initial paint
    const timer = setTimeout(() => {
      const loadSearchData = async () => {
        try {
          const [preferences, history, popular] = await Promise.all([
            searchAnalyticsService.getSearchPreferences(user),
            searchAnalyticsService.getUserSearchHistory(10, user),
            searchAnalyticsService.getPopularSearches(5, user)
          ]);

          if (preferences) {
            setSearchPreferences(prev => ({
              ...prev,
              enableSemanticSearch: preferences.semanticSearchEnabled,
              enableAutoComplete: preferences.autoCompleteEnabled,
              maxSuggestions: Math.min(preferences.recentSearchesLimit, 10),
              userPreferences: preferences.preferredCategories
            }));
          }

          const recentQueries = history?.map(h => h.query).filter(Boolean) || [];
          const popularQueries = popular?.map((p: any) => p.query).filter(Boolean) || [];

          setRecentSearches(recentQueries);
          setPopularSearches(popularQueries);

          setSearchPreferences(prev => ({
            ...prev,
            recentSearches: recentQueries,
            popularSearches: popularQueries
          }));
        } catch (error) {
          // Silently fail - search still works without preferences
          console.log('Failed to load search preferences:', error);
        }
      };

      loadSearchData();
    }, 500); // Defer 500ms to let dashboard render first

    return () => clearTimeout(timer);
  }, [user]);

  // Generate suggestions with debouncing
  const generateSuggestions = useCallback(async (query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      searchStartTime.current = Date.now();

      try {
        const newSuggestions = searchIntelligence.generateIntelligentSuggestions(
          query,
          entries,
          searchPreferences
        );

        setSuggestions(newSuggestions);
        setSelectedIndex(-1);

        // Track search if query is meaningful
        if (query.trim().length >= 2 && user) {
          const responseTime = Date.now() - (searchStartTime.current || Date.now());
          await searchAnalyticsService.trackSearch({
            query: query.trim(),
            resultsCount: newSuggestions.length,
            searchType: 'text',
            responseTimeMs: responseTime
          }, user);
        }
      } catch (error) {
        console.error('Error generating suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);
  }, [entries, searchPreferences, debounceMs, user]);

  // Handle search query changes
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    generateSuggestions(query);
    onSearchChange?.(query);
  }, [generateSuggestions, onSearchChange]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback(async (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.completionText || suggestion.title);
    setSuggestions([]);
    setSelectedIndex(-1);

    // Track the click
    if (suggestion.entry && user) {
      await searchAnalyticsService.trackSearch({
        query: searchQuery,
        resultsCount: suggestions.length,
        clickedResultId: suggestion.entry.id,
        searchType: 'text'
      }, user);
    }

    // Update recent searches
    const newRecent = [suggestion.title, ...recentSearches.filter(r => r !== suggestion.title)].slice(0, 10);
    setRecentSearches(newRecent);

    onSuggestionSelect?.(suggestion);
  }, [searchQuery, suggestions.length, recentSearches, onSuggestionSelect, user]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!suggestions.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? suggestions.length - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setSuggestions([]);
        setSelectedIndex(-1);
        break;
    }
  }, [suggestions, selectedIndex, handleSuggestionSelect]);

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setSelectedIndex(-1);
  }, []);

  // Voice search support
  const handleVoiceSearch = useCallback(async (transcript: string) => {
    if (searchPreferences.enableSemanticSearch) {
      handleSearchChange(transcript);

      // Track voice search
      if (user) {
        await searchAnalyticsService.trackSearch({
          query: transcript,
          resultsCount: 0,
          searchType: 'voice'
        }, user);
      }
    }
  }, [searchPreferences.enableSemanticSearch, handleSearchChange, user]);

  return {
    searchQuery,
    suggestions,
    isLoading,
    selectedIndex,
    recentSearches,
    popularSearches,
    searchPreferences,
    handleSearchChange,
    handleSuggestionSelect,
    handleKeyDown,
    clearSuggestions,
    handleVoiceSearch,
    setSearchPreferences
  };
};