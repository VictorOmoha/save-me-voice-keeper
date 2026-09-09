import {useDownload} from '@/components/categoryView/useDownload';
import React, { Suspense, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SavedEntry } from "@/types/dashboard";
import {
  FileText,
  ExternalLink,
  Grid3X3,
  List,
  Printer,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { EnhancedEntryCard } from "./EnhancedEntryCard";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { demoEntries } from "@/data/demoEntries";

interface EnhancedRecentEntriesProps {
  entries: SavedEntry[];
  onEdit?: (entry: SavedEntry) => void;
  onFill?: (entry: SavedEntry) => void;
  onUseAsTemplate?: (entry: SavedEntry) => void;
  onDelete?: (id: string) => void;
  onView?: (entry: SavedEntry) => void;
  onViewAll?: () => void;
  maxEntries?: number;
  title?: string;
  showViewToggle?: boolean;
  searchQuery?: string;
  onClearSearch?: () => void;
}

type ViewMode = "list" | "grid" | "compact";

const EnhancedEntryViewDialog = React.lazy(() =>
  import('./EnhancedEntryViewDialog').then((module) => ({ default: module.EnhancedEntryViewDialog }))
);

export const EnhancedRecentEntries: React.FC<EnhancedRecentEntriesProps> = React.memo(({
  entries,
  onEdit,
  onFill,
  onUseAsTemplate,
  onDelete,
  onView,
  onViewAll,
  maxEntries = 5,
  title = "Recent Entries",
  showViewToggle = true,
  searchQuery = "",
  onClearSearch,
}) => {
  const [viewingEntry, setViewingEntry] = useState<SavedEntry | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const navigate = useNavigate();

  // Memoize sliced entries to prevent recalculation on every render
  const recentEntries = useMemo(() => entries.slice(0, maxEntries), [entries, maxEntries]);

  const handleEntryClick = (entry: SavedEntry) => {
    setViewingEntry(entry);
  };

  const handleCloseDialog = () => {
    setViewingEntry(null);
  };

  const {handleDownload} = useDownload();

  const handlePrintAll = async () => {
    if (recentEntries.length === 0) {
      toast.error("No entries to print");
      return;
    }

    const { printProfessionally } = await import('./ProfessionalPrintView');
    printProfessionally(recentEntries, {
      title: "Recent Entries",
      includeMetadata: true,
    });
    toast.success("Print dialog opened");
  };

  return (
    <>
      <Card className="overflow-hidden border-border/70 shadow-none rounded-2xl">
        <CardHeader className="p-5 md:p-6 border-b border-border/60">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div>
                <CardTitle className="text-lg">{title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {searchQuery.trim() ? `${entries.length} matching memor${entries.length === 1 ? "y" : "ies"}` : entries.length === 0
                    ? "No entries yet"
                    : "Pick up where you left off"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View Toggle */}
              {showViewToggle && recentEntries.length > 0 && (
                <div className="flex items-center bg-muted rounded-lg p-1">
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-9 px-2"
                    aria-label="List view"
                    aria-pressed={viewMode === "list"}
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-9 px-2"
                    aria-label="Grid view"
                    aria-pressed={viewMode === "grid"}
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Print Button */}
              {recentEntries.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Print recent entries"
                  onClick={handlePrintAll}
                  className="gap-1"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Print</span>
                </Button>
              )}

              {/* View All Button */}
              {onViewAll && entries.length > 0 && (
                <Button
                  onClick={onViewAll}
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-primary"
                >
                  View all
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {recentEntries.length === 0 && searchQuery.trim() ? (
            <div className="py-12 text-center">
              <h3 className="text-base font-semibold">No memories match “{searchQuery}”</h3>
              <p className="mt-2 text-sm text-muted-foreground">Try a different word, name, or detail.</p>
              {onClearSearch && <Button variant="outline" className="mt-5" onClick={onClearSearch}>Clear search</Button>}
            </div>
          ) : recentEntries.length === 0 ? (
            <div className="py-12">
              <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No entries yet</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Save your first thought with Nova. Your memories will appear here, ready to find again.
              </p>
              </div>

              <p className="mt-6 text-center text-xs font-medium text-muted-foreground">A few things you could save</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3" aria-label="Example memories">
                {demoEntries.map((entry) => (
                  <div key={entry.id} className="rounded-xl border bg-background/90 p-3 text-left">
                    <p className="text-sm font-semibold text-foreground">{entry.title}</p>
                    <p className="mt-1 text-xs font-medium text-primary">{entry.category}</p>
                    <p className="mt-2 text-xs text-foreground/80 line-clamp-2">{entry.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              className={cn(
                viewMode === "grid"
                  ? "memory-grid grid grid-cols-1 md:grid-cols-2 gap-4"
                  : "memory-list space-y-2"
              )}
            >
              {recentEntries.map((entry) => (
                <EnhancedEntryCard
                  key={entry.id}
                  entry={entry}
                  variant={viewMode === "grid" ? "grid" : viewMode === "compact" ? "compact" : "list"}
                  onView={handleEntryClick}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onFill={onFill}
                  onUseAsTemplate={onUseAsTemplate}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          )}

          {/* Show more indicator */}
          {entries.length > maxEntries && onViewAll && (
            <div className="mt-4 pt-4 border-t text-center">
              <Button
                variant="ghost"
                onClick={onViewAll}
                className="text-muted-foreground hover:text-foreground"
              >
                +{entries.length - maxEntries} more entries
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entry View Dialog */}
      {viewingEntry && (
        <Suspense fallback={null}>
          <EnhancedEntryViewDialog
            entry={viewingEntry}
            isOpen={!!viewingEntry}
            onClose={handleCloseDialog}
            onEdit={onEdit}
            onFill={onFill}
            onUseAsTemplate={onUseAsTemplate}
            onViewDocument={onView}
            allEntries={entries}
            onOpenRelatedEntry={(entry) => setViewingEntry(entry)}
          />
        </Suspense>
      )}
    </>
  );
});

EnhancedRecentEntries.displayName = 'EnhancedRecentEntries';

export default EnhancedRecentEntries;
