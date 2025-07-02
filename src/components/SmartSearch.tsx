import { useState, useEffect, useRef } from "react";
import { SavedEntry } from "@/types/dashboard";
import { cn } from "@/lib/utils";

interface SearchSuggestion {
  id: string;
  title: string;
  type: 'entry' | 'category' | 'field';
  matchText: string;
  entry?: SavedEntry;
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
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const categories = ["Documents", "Health", "Contacts", "Finance", "Personal"];

  useEffect(() => {
    if (searchQuery.length === 0) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    const newSuggestions: SearchSuggestion[] = [];

    // Search in entry titles
    entries.forEach(entry => {
      if (entry.title.toLowerCase().includes(query)) {
        newSuggestions.push({
          id: `entry-${entry.id}`,
          title: entry.title,
          type: 'entry',
          matchText: entry.title,
          entry
        });
      }
    });

    // Search in entry fields content
    entries.forEach(entry => {
      Object.entries(entry.fields).forEach(([key, value]) => {
        const valueStr = String(value).toLowerCase();
        if (valueStr.includes(query) && !newSuggestions.find(s => s.id === `entry-${entry.id}`)) {
          newSuggestions.push({
            id: `field-${entry.id}-${key}`,
            title: entry.title,
            type: 'field',
            matchText: `${key}: ${String(value)}`,
            entry
          });
        }
      });
    });

    // Search in categories
    categories.forEach(category => {
      if (category.toLowerCase().includes(query)) {
        const categoryEntries = entries.filter(entry => 
          entry.fields.category === category
        );
        if (categoryEntries.length > 0) {
          newSuggestions.push({
            id: `category-${category}`,
            title: `${category} (${categoryEntries.length} entries)`,
            type: 'category',
            matchText: category
          });
        }
      }
    });

    // Limit suggestions and sort by relevance
    const limitedSuggestions = newSuggestions
      .slice(0, 8)
      .sort((a, b) => {
        // Prioritize exact matches
        const aExact = a.matchText.toLowerCase() === query;
        const bExact = b.matchText.toLowerCase() === query;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Then prioritize title matches over field matches
        if (a.type === 'entry' && b.type === 'field') return -1;
        if (a.type === 'field' && b.type === 'entry') return 1;
        
        return 0;
      });

    setSuggestions(limitedSuggestions);
    setIsOpen(limitedSuggestions.length > 0);
    setSelectedIndex(-1);
  }, [searchQuery, entries]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onSearchChange(suggestion.matchText);
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
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleBlur = () => {
    // Delay closing to allow for suggestion clicks
    setTimeout(() => setIsOpen(false), 150);
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'entry': return '📄';
      case 'category': return '📁';
      case 'field': return '🔍';
      default: return '📄';
    }
  };

  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={() => suggestions.length > 0 && setIsOpen(true)}
        className="w-full px-3 py-2 pl-10 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
      />
      
      {isOpen && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              className={cn(
                "px-3 py-2 cursor-pointer flex items-center space-x-3 hover:bg-accent",
                selectedIndex === index && "bg-accent"
              )}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <span className="text-lg">{getSuggestionIcon(suggestion.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {suggestion.title}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {suggestion.type === 'field' 
                    ? suggestion.matchText 
                    : suggestion.type === 'category'
                    ? `Category: ${suggestion.matchText}`
                    : `Entry: ${suggestion.matchText}`
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};