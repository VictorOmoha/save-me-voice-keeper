
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Settings, Brain } from "lucide-react";
import { SmartSearch } from "./SmartSearch";
import { SavedEntry } from "@/types/dashboard";
import { EntryViewDialog } from "@/components/recentEntries/EntryViewDialog";
import { Link, useLocation } from "react-router-dom";
import { 
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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
  showSettingsShortcut?: boolean;
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
  const location = useLocation();
  const breadcrumbs = (() => {
    const path = location.pathname;
    const items: { label: string; to?: string }[] = [{ label: "Dashboard", to: "/dashboard" }];
    if (path.includes("/all-entries")) items.push({ label: "All Entries" });
    if (path.startsWith("/category/")) {
      const name = decodeURIComponent(path.split("/category/")[1] || "");
      items.push({ label: "Category", to: "/dashboard" });
      if (name) items.push({ label: name });
    }
    if (path.startsWith("/settings")) items.push({ label: "Settings" });
    if (path.startsWith("/subscription")) items.push({ label: "Subscription" });
    return items;
  })();
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
          <Button asChild variant="ghost" size="icon" aria-label="Settings" title="Settings">
            <Link to="/settings">
              <Settings className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/brain-dump" className="flex items-center gap-2" aria-label="Open Brain Dump">
              <Brain className="w-4 h-4" />
              Brain Dump
            </Link>
          </Button>
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
      
      <div className="max-w-7xl mx-auto mt-2">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((item, idx) => (
              <React.Fragment key={`${item.label}-${idx}`}>
                <BreadcrumbItem>
                  {item.to && idx !== breadcrumbs.length - 1 ? (
                    <BreadcrumbLink asChild>
                      <Link to={item.to}>{item.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {idx < breadcrumbs.length - 1 && (
                  <BreadcrumbSeparator />
                )}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
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
