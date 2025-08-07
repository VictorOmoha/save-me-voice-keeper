import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { SavedEntry } from "@/types/dashboard";
import { Search, Clock, TrendingUp, FileText, Hash, Grid, Zap, Sparkles } from "lucide-react";
import { useIntelligentSearch } from "@/hooks/useIntelligentSearch";
import { SearchSuggestion } from "@/utils/searchIntelligence";

interface SmartSearchProps {
  entries: SavedEntry[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  className?: string;
}

export const SmartSearch: React.FC<SmartSearchProps> = ({
  entries,
  searchQuery,
  onSearchChange,
  onSuggestionSelect,
  placeholder = "🔍 Search with AI intelligence...",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const {
    suggestions,
    isLoading,
    selectedIndex,
    recentSearches,
    popularSearches,
    searchPreferences,
    handleSearchChange,
    handleSuggestionSelect,
    handleKeyDown,
  } = useIntelligentSearch({
    entries,
    onSuggestionSelect,
    onSearchChange,
    debounceMs: 200
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleSearchChange(e.target.value);
  };

  const onSuggestionClick = (suggestion: SearchSuggestion) => {
    handleSuggestionSelect(suggestion);
    setIsOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }
    handleKeyDown(e);
    if (e.key === 'Escape' || e.key === 'Enter') {
      setIsOpen(false);
    }
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'entry': return <FileText className="w-4 h-4" />;
      case 'field': return <Hash className="w-4 h-4" />;
      case 'category': return <Grid className="w-4 h-4" />;
      case 'recent': return <Clock className="w-4 h-4" />;
      case 'popular': return <TrendingUp className="w-4 h-4" />;
      case 'completion': return <Zap className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, index) =>
          regex.test(part) ? (
            <mark key={index} className="bg-primary/20 text-primary font-medium">
              {part}
            </mark>
          ) : part
        )}
      </span>
    );
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={onKeyDown}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          className="pl-10 pr-12 py-2 w-full transition-all duration-300 ease-in-out focus:scale-[1.02] hover:shadow-md"
          autoComplete="off"
        />
        {searchPreferences.enableSemanticSearch && (
          <Sparkles className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary/60" />
        )}
        {isLoading && (
          <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
            <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-background/95 backdrop-blur-sm border border-border rounded-md shadow-xl max-h-80 overflow-y-auto z-50"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              className={`px-3 py-2 cursor-pointer transition-all duration-200 hover:bg-accent/50 hover:text-accent-foreground ${
                index === selectedIndex ? 'bg-accent text-accent-foreground' : ''
              }`}
              onClick={() => onSuggestionClick(suggestion)}
            >
              <div className="flex items-center gap-2">
                <span className={`text-muted-foreground ${suggestion.type === 'completion' ? 'text-primary' : ''}`}>
                  {getSuggestionIcon(suggestion.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {highlightMatch(suggestion.title, searchQuery)}
                  </div>
                  {suggestion.matchText !== suggestion.title && (
                    <div className="text-sm text-muted-foreground truncate">
                      {highlightMatch(suggestion.matchText, searchQuery)}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {suggestion.confidence > 0.8 && (
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  )}
                  <div className="text-xs text-muted-foreground">
                    {Math.round(suggestion.confidence * 100)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};