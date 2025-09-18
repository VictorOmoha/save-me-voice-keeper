
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SavedEntry } from "@/types/dashboard";
import { FileText, ExternalLink, Table, Grid3X3 } from "lucide-react";
import { EntryItem } from "./recentEntries/EntryItem";
import { EntryViewDialog } from "./recentEntries/EntryViewDialog";
import { BooksRestructureButton } from "./restructure/BooksRestructureButton";

interface RecentEntriesProps {
  entries: SavedEntry[];
  onEdit?: (entry: SavedEntry) => void;
  onFill?: (entry: SavedEntry) => void;
  onView?: (entry: SavedEntry) => void;
  onViewAll?: () => void;
  onRestructure?: (newEntry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const RecentEntries: React.FC<RecentEntriesProps> = ({ 
  entries, 
  onEdit,
  onFill,
  onView,
  onViewAll,
  onRestructure
}) => {
  const [viewingEntry, setViewingEntry] = useState<SavedEntry | null>(null);
  const navigate = useNavigate();

  const recentEntries = entries.slice(0, 5);
  
  // Check for Books entries that could be restructured
  const booksEntries = entries.filter(entry => 
    entry.title.toLowerCase().includes('book') && 
    !entry.title.includes('(Restructured)') &&
    entry.fields.name && entry.fields.author &&
    !entry.fields.books_table
  );

  const handleEntryClick = (entry: SavedEntry) => {
    // Check if this is a document entry with a file
    const isDocumentWithFile = entry.fields.category === 'Documents' && entry.fields.hasUploadedFile;
    
    if (isDocumentWithFile && onView) {
      // For documents with files, use the document viewer
      onView(entry);
    } else {
      // For regular entries, navigate to the all-entries page with the entry ID
      navigate(`/all-entries/${entry.id}`);
    }
  };

  const handleCloseDialog = () => {
    setViewingEntry(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Recent Entries</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Your latest saved information</p>
          </div>
          <div className="flex items-center space-x-2">
            {onViewAll && entries.length > 5 && (
              <Button 
                onClick={onViewAll}
                variant="outline" 
                size="sm" 
                className="text-primary hover:text-primary/80"
              >
                <Table className="w-4 h-4 mr-1" />
                Table View
              </Button>
            )}
            {onViewAll && (
              <Button 
                onClick={onViewAll}
                variant="ghost" 
                size="sm" 
                className="text-primary"
              >
                View all <ExternalLink className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Books Restructure Suggestion */}
          {booksEntries.length > 0 && onRestructure && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    📚 Upgrade Your Books Collection
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Transform your "{booksEntries[0].title}" into a comprehensive database with ratings, reading status, genres, and more!
                  </p>
                </div>
                <BooksRestructureButton 
                  booksEntry={booksEntries[0]}
                  onRestructure={onRestructure}
                />
              </div>
            </div>
          )}
          <div className="space-y-4">
            {recentEntries.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No entries yet</p>
              </div>
            ) : (
              recentEntries.map((entry) => (
                <EntryItem
                  key={entry.id}
                  entry={entry}
                  onClick={handleEntryClick}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};
