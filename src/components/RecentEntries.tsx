
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SavedEntry } from "@/pages/Dashboard";
import { FileText, Heart, Users, DollarSign, User, ExternalLink, Edit } from "lucide-react";

interface RecentEntriesProps {
  entries: SavedEntry[];
  onEdit?: (entry: SavedEntry) => void;
  onFill?: (entry: SavedEntry) => void;
}

export const RecentEntries: React.FC<RecentEntriesProps> = ({ 
  entries, 
  onEdit,
  onFill 
}) => {
  const [viewingEntry, setViewingEntry] = useState<SavedEntry | null>(null);

  const getCategoryIcon = (title: string) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('document') || titleLower.includes('paper')) return FileText;
    if (titleLower.includes('health') || titleLower.includes('medical')) return Heart;
    if (titleLower.includes('contact') || titleLower.includes('people')) return Users;
    if (titleLower.includes('bank') || titleLower.includes('finance')) return DollarSign;
    return User;
  };

  const getCategoryColor = (title: string) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('document') || titleLower.includes('paper')) return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    if (titleLower.includes('health') || titleLower.includes('medical')) return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
    if (titleLower.includes('contact') || titleLower.includes('people')) return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
    if (titleLower.includes('bank') || titleLower.includes('finance')) return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
  };

  const getCategoryName = (entry: SavedEntry) => {
    // First check if the entry has a category field
    if (entry.fields?.category) {
      return entry.fields.category;
    }
    
    // Fallback to title-based categorization
    const titleLower = entry.title.toLowerCase();
    if (titleLower.includes('document') || titleLower.includes('paper')) return 'Documents';
    if (titleLower.includes('health') || titleLower.includes('medical')) return 'Health';
    if (titleLower.includes('contact') || titleLower.includes('people')) return 'Contacts';
    if (titleLower.includes('bank') || titleLower.includes('finance')) return 'Finance';
    return 'Personal';
  };

  const getEntryType = (entry: SavedEntry): string => {
    const fieldCount = Object.keys(entry.fields).length;
    if (fieldCount <= 2) return 'Simple';
    if (fieldCount <= 5) return 'Form';
    return 'Complex';
  };

  const recentEntries = entries.slice(0, 5);

  const handleEntryClick = (entry: SavedEntry) => {
    setViewingEntry(entry);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Recent Entries</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Your latest saved information</p>
          </div>
          <Button variant="ghost" size="sm" className="text-primary">
            View all <ExternalLink className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentEntries.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No entries yet</p>
              </div>
            ) : (
              recentEntries.map((entry) => {
                const Icon = getCategoryIcon(entry.title);
                const categoryColor = getCategoryColor(entry.title);
                const categoryName = getCategoryName(entry);
                
                return (
                  <div 
                    key={entry.id} 
                    className="flex items-start space-x-4 p-4 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => handleEntryClick(entry)}
                  >
                    <div className={`w-10 h-10 rounded-lg ${categoryColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-card-foreground truncate">{entry.title}</h4>
                        <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
                          {categoryName}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {Object.values(entry.fields).slice(0, 2).join(', ')}
                      </p>
                      <div className="flex items-center mt-2 space-x-3">
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Entry Dialog */}
      <Dialog open={viewingEntry !== null} onOpenChange={() => setViewingEntry(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">
              {viewingEntry?.title}
            </DialogTitle>
          </DialogHeader>
          
          {viewingEntry && (
            <div className="space-y-6">
              {/* Entry Metadata */}
              <div className="flex items-center justify-between text-sm text-muted-foreground border-b pb-4 border-border">
                <div>
                  <p>Created: {new Date(viewingEntry.createdAt).toLocaleDateString()}</p>
                  <p>Last Modified: {new Date(viewingEntry.updatedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{getCategoryName(viewingEntry)}</Badge>
                  <Badge variant="outline">{getEntryType(viewingEntry)}</Badge>
                </div>
              </div>

              {/* Entry Fields */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Entry Details</h3>
                <div className="grid gap-4">
                  {Object.entries(viewingEntry.fields).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <label className="text-sm font-medium text-foreground capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <div className="p-3 bg-muted rounded-md border border-border">
                        <p className="text-foreground whitespace-pre-wrap">
                          {String(value) || 'No data'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              {(onFill || onEdit) && (
                <div className="flex justify-end space-x-2 pt-4 border-t border-border">
                  {onFill && (
                    <Button
                      onClick={() => {
                        onFill(viewingEntry);
                        setViewingEntry(null);
                      }}
                      variant="outline"
                      className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Fill Form
                    </Button>
                  )}
                  {onEdit && (
                    <Button
                      onClick={() => {
                        onEdit(viewingEntry);
                        setViewingEntry(null);
                      }}
                      variant="outline"
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Entry
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
