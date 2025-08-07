
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SmartSearch } from "./SmartSearch";
import { SavedEntry } from "@/types/dashboard";
import { EntryViewDialog } from "@/components/recentEntries/EntryViewDialog";

interface SearchHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  userName?: string;
  savedEntries: SavedEntry[];
  onAddEntry: () => void;
  onCategorySelect: (categoryName: string) => void;
  onAllEntriesSelect: () => void;
  onEditEntry?: (entry: SavedEntry) => void;
  onFillEntry?: (entry: SavedEntry) => void;
}

export const SearchHeader: React.FC<SearchHeaderProps> = ({
  searchQuery,
  onSearchChange,
  userName,
  savedEntries,
  onAddEntry,
  onCategorySelect,
  onAllEntriesSelect,
  onEditEntry,
  onFillEntry,
}) => {
  const [viewingEntry, setViewingEntry] = useState<SavedEntry | null>(null);

  const handleEntrySelect = (entry: SavedEntry) => {
    setViewingEntry(entry);
  };
  return (
    <div className="bg-background border-b border-border px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo/Title */}
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-foreground">SaveMe</h1>
          {userName && (
            <span className="text-muted-foreground">Welcome, {userName}</span>
          )}
        </div>

        {/* Smart Search Bar */}
        <div className="flex-1 max-w-md mx-6">
          <SmartSearch 
            entries={savedEntries}
            searchQuery={searchQuery} 
            onSearchChange={onSearchChange}
            onEntrySelect={handleEntrySelect}
            placeholder="🔍 Search with AI intelligence..."
            className="w-full"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <Button
            onClick={onAllEntriesSelect}
            variant="outline"
            size="sm"
          >
            All Entries
          </Button>
          <Button
            onClick={onAddEntry}
            size="sm"
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Entry</span>
          </Button>
        </div>
      </div>
      
      <EntryViewDialog
        entry={viewingEntry}
        isOpen={!!viewingEntry}
        onClose={() => setViewingEntry(null)}
        onEdit={onEditEntry}
        onFill={onFillEntry}
      />
    </div>
  );
};
