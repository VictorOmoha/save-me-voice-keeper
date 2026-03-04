import React, { useState, useMemo } from "react";
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
import { EnhancedEntryViewDialog } from "./EnhancedEntryViewDialog";
import { printProfessionally } from "./ProfessionalPrintView";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
}

type ViewMode = "list" | "grid" | "compact";

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

  const handleDownload = async (entry: SavedEntry) => {
    if (!entry.fields.hasUploadedFile || !entry.fields.fileName) {
      toast.error("No file available for download");
      return;
    }

    try {
      const allKeys = Object.keys(localStorage);
      const documentKeys = allKeys.filter(key => key.startsWith("document_"));

      let fileData = null;
      for (const key of documentKeys) {
        try {
          const storedData = JSON.parse(localStorage.getItem(key) || "");
          if (storedData.name === entry.fields.fileName) {
            fileData = storedData;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!fileData) {
        toast.error("File data not found");
        return;
      }

      const link = document.createElement("a");
      link.href = fileData.data;
      link.download = fileData.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Downloaded ${fileData.name}`);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
    }
  };

  const handlePrintAll = () => {
    if (recentEntries.length === 0) {
      toast.error("No entries to print");
      return;
    }
    printProfessionally(recentEntries, {
      title: "Recent Entries",
      includeMetadata: true,
    });
    toast.success("Print dialog opened");
  };

  return (
    <>
      <Card className="overflow-hidden border-2">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {entries.length === 0
                    ? "No entries yet"
                    : `${entries.length} total • Showing ${recentEntries.length}`}
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
                    className="h-7 px-2"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 px-2"
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
                  onClick={handlePrintAll}
                  className="gap-1"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Print</span>
                </Button>
              )}

              {/* View All Button */}
              {onViewAll && entries.length > maxEntries && (
                <Button
                  onClick={onViewAll}
                  size="sm"
                  className="gap-1"
                >
                  View All
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {recentEntries.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No entries yet</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Start adding entries to keep track of your important information.
                Use voice commands or the Add Entry button to get started.
              </p>
            </div>
          ) : (
            <div
              className={cn(
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                  : "space-y-3"
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
      <EnhancedEntryViewDialog
        entry={viewingEntry}
        isOpen={!!viewingEntry}
        onClose={handleCloseDialog}
        onEdit={onEdit}
        onFill={onFill}
        onUseAsTemplate={onUseAsTemplate}
        onViewDocument={onView}
      />
    </>
  );
});

EnhancedRecentEntries.displayName = 'EnhancedRecentEntries';

export default EnhancedRecentEntries;
