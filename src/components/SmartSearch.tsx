
import { useState, useEffect, useRef } from "react";
import { SavedEntry } from "@/types/dashboard";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

interface SearchSuggestion {
  id: string;
  title: string;
  type: 'entry' | 'category' | 'field' | 'recent';
  matchText: string;
  entry?: SavedEntry;
  confidence?: number;
}

interface SmartSearchProps {
  entries: SavedEntry[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  className?: string;
}

export const SmartSearch = ({
  entries,
  searchQuery,
  onSearchChange,
  onSuggestionSelect,
  placeholder = "Search your entries...",
  className
}: SmartSearchProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const categories = ["Documents", "Health", "Contacts", "Finance", "Personal"];

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('smartSearch_recent');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = (query: string) => {
    if (query.trim().length < 2) return;
    
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('smartSearch_recent', JSON.stringify(updated));
  };

  useEffect(() => {
    if (searchQuery.length === 0) {
      // Show recent searches when empty
      if (recentSearches.length > 0) {
        const recentSuggestions: SearchSuggestion[] = recentSearches.map((search, index) => ({
          id: `recent-${index}`,
          title: search,
          type: 'recent',
          matchText: search,
          confidence: 1.0
        }));
        setSuggestions(recentSuggestions);
        setIsOpen(true);
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const newSuggestions: SearchSuggestion[] = [];

    // Enhanced scoring system
    const calculateConfidence = (text: string, searchTerm: string): number => {
      const lowerText = text.toLowerCase();
      const lowerSearch = searchTerm.toLowerCase();
      
      if (lowerText === lowerSearch) return 1.0; // Exact match
      if (lowerText.startsWith(lowerSearch)) return 0.9; // Starts with
      if (lowerText.includes(` ${lowerSearch}`)) return 0.8; // Word boundary
      if (lowerText.includes(lowerSearch)) return 0.7; // Contains
      
      // Fuzzy matching for typos
      const words = lowerSearch.split(' ');
      let matchCount = 0;
      words.forEach(word => {
        if (lowerText.includes(word)) matchCount++;
      });
      
      return matchCount / words.length * 0.6;
    };

    // Search in entry titles with enhanced scoring
    entries.forEach(entry => {
      const confidence = calculateConfidence(entry.title, query);
      if (confidence > 0.5) {
        newSuggestions.push({
          id: `entry-${entry.id}`,
          title: entry.title,
          type: 'entry',
          matchText: entry.title,
          entry,
          confidence
        });
      }
    });

    // Search in entry fields content with context
    entries.forEach(entry => {
      Object.entries(entry.fields).forEach(([key, value]) => {
        const valueStr = String(value);
        const keyConfidence = calculateConfidence(key, query);
        const valueConfidence = calculateConfidence(valueStr, query);
        const maxConfidence = Math.max(keyConfidence, valueConfidence);
        
        if (maxConfidence > 0.5 && !newSuggestions.find(s => s.id === `entry-${entry.id}`)) {
          newSuggestions.push({
            id: `field-${entry.id}-${key}`,
            title: entry.title,
            type: 'field',
            matchText: `${key}: ${valueStr}`,
            entry,
            confidence: maxConfidence
          });
        }
      });
    });

    // Search in categories with enhanced matching
    categories.forEach(category => {
      const confidence = calculateConfidence(category, query);
      if (confidence > 0.5) {
        const categoryEntries = entries.filter(entry => 
          entry.fields.category === category
        );
        if (categoryEntries.length > 0) {
          newSuggestions.push({
            id: `category-${category}`,
            title: `${category} (${categoryEntries.length} entries)`,
            type: 'category',
            matchText: category,
            confidence
          });
        }
      }
    });

    // Sort by confidence and limit results
    const sortedSuggestions = newSuggestions
      .sort((a, b) => {
        // First sort by confidence
        const confidenceDiff = (b.confidence || 0) - (a.confidence || 0);
        if (confidenceDiff !== 0) return confidenceDiff;
        
        // Then by type priority (entry > field > category)
        const typePriority = { entry: 3, field: 2, category: 1, recent: 0 };
        return (typePriority[b.type] || 0) - (typePriority[a.type] || 0);
      })
      .slice(0, 8);

    setSuggestions(sortedSuggestions);
    setIsOpen(sortedSuggestions.length > 0);
    setSelectedIndex(-1);
  }, [searchQuery, entries, recentSearches]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onSearchChange(suggestion.type === 'recent' ? suggestion.title : suggestion.matchText);
    saveRecentSearch(suggestion.type === 'recent' ? suggestion.title : suggestion.matchText);
    setIsOpen(false);
    onSuggestionSelect?.(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else if (searchQuery.trim()) {
          saveRecentSearch(searchQuery);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
      case 'Tab':
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          e.preventDefault();
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
    }
  };

  const handleBlur = () => {
    // Delay closing to allow for suggestion clicks
    setTimeout(() => setIsOpen(false), 150);
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'entry': return '📄';
      case 'category': return '📁';
      case 'field': return '🔍';
      case 'recent': return '🕐';
      default: return '📄';
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query || query.length < 2) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          className="w-full pl-10 pr-3 py-2 border border-input bg-muted/50 text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
          autoComplete="off"
        />
      </div>
      
      {isOpen && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          {searchQuery.length === 0 && recentSearches.length > 0 && (
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
              Recent Searches
            </div>
          )}
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              className={cn(
                "px-3 py-3 cursor-pointer flex items-center space-x-3 hover:bg-accent transition-colors duration-150",
                selectedIndex === index && "bg-accent"
              )}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <span className="text-lg flex-shrink-0">{getSuggestionIcon(suggestion.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {searchQuery.length > 1 ? 
                    highlightMatch(suggestion.title, searchQuery) : 
                    suggestion.title
                  }
                </div>
                <div className="text-xs text-muted-foreground truncate mt-0.5">
                  {suggestion.type === 'field' ? (
                    searchQuery.length > 1 ? 
                      highlightMatch(suggestion.matchText, searchQuery) :
                      suggestion.matchText
                  ) : suggestion.type === 'category' ? (
                    `Category: ${suggestion.matchText}`
                  ) : suggestion.type === 'recent' ? (
                    'Recent search'
                  ) : (
                    `Entry: ${suggestion.matchText}`
                  )}
                </div>
              </div>
              {suggestion.confidence && suggestion.confidence > 0.8 && (
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {Math.round(suggestion.confidence * 100)}%
                  </span>
                </div>
              )}
            </div>
          ))}
          {searchQuery.length > 1 && suggestions.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              No results found for "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
