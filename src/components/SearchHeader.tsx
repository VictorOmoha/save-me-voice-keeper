
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SavedEntry } from "@/types/dashboard";

interface SearchHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  userName?: string;
  savedEntries: SavedEntry[];
  onAddEntry: () => void;
  onCategorySelect: (categoryName: string) => void;
  onAllEntriesSelect: () => void;
}

export const SearchHeader: React.FC<SearchHeaderProps> = ({
  searchQuery,
  onSearchChange,
  userName,
  savedEntries,
  onAddEntry,
  onCategorySelect,
  onAllEntriesSelect,
}) => {
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

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search your entries..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
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
    </div>
  );
};
