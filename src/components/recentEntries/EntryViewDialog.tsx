
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SavedEntry } from "@/pages/Dashboard";
import { FileText, Edit } from "lucide-react";
import { getCategoryName, getEntryType } from "./categoryUtils";

interface EntryViewDialogProps {
  entry: SavedEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (entry: SavedEntry) => void;
  onFill?: (entry: SavedEntry) => void;
}

export const EntryViewDialog: React.FC<EntryViewDialogProps> = ({
  entry,
  isOpen,
  onClose,
  onEdit,
  onFill,
}) => {
  if (!entry) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            {entry.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Entry Metadata */}
          <div className="flex items-center justify-between text-sm text-muted-foreground border-b pb-4 border-border">
            <div>
              <p>Created: {new Date(entry.createdAt).toLocaleDateString()}</p>
              <p>Last Modified: {new Date(entry.updatedAt).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{getCategoryName(entry)}</Badge>
              <Badge variant="outline">{getEntryType(entry)}</Badge>
            </div>
          </div>

          {/* Entry Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Entry Details</h3>
            <div className="grid gap-4">
              {Object.entries(entry.fields).map(([key, value]) => (
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
                    onFill(entry);
                    onClose();
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
                    onEdit(entry);
                    onClose();
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
      </DialogContent>
    </Dialog>
  );
};
