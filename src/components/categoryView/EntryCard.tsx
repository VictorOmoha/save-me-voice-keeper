
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SavedEntry } from "@/types/dashboard";
import { Download } from "lucide-react";

interface EntryCardProps {
  entry: SavedEntry;
  onEdit: (entry: SavedEntry) => void;
  onDelete: (id: string) => void;
  onFill: (entry: SavedEntry) => void;
  onDownload: (entry: SavedEntry) => void;
  isDownloading: boolean;
}

export const EntryCard: React.FC<EntryCardProps> = ({
  entry,
  onEdit,
  onDelete,
  onFill,
  onDownload,
  isDownloading
}) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl">{entry.title}</CardTitle>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {new Date(entry.createdAt).toLocaleDateString()}
          </Badge>
          {entry.fields.fileName && (
            <Badge variant="secondary" className="text-xs">
              {entry.fields.fileName}
            </Badge>
          )}
          {entry.fields.hasUploadedFile && entry.fields.fileName && (
            <Button
              onClick={() => onDownload(entry)}
              variant="outline"
              size="sm"
              disabled={isDownloading}
              className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
          <Button 
            onClick={() => {
              console.log('Fill button clicked for entry:', entry.title);
              onFill(entry);
            }}
            variant="outline" 
            size="sm"
            className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
          >
            Fill Form
          </Button>
          <Button 
            onClick={() => {
              console.log('Edit button clicked for entry:', entry.title);
              onEdit(entry);
            }}
            variant="outline" 
            size="sm"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Edit
          </Button>
          <Button 
            onClick={() => {
              console.log('Delete button clicked for entry:', entry.id);
              onDelete(entry.id);
            }}
            variant="outline" 
            size="sm"
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            Delete
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {Object.entries(entry.fields).map(([key, value]) => (
            <div key={key} className="flex flex-col sm:flex-row sm:items-center">
              <span className="font-medium text-foreground mb-1 sm:mb-0 sm:w-1/3">
                {key}:
              </span>
              <span className="text-foreground sm:w-2/3">
                {key === 'fileSize' && typeof value === 'number' 
                  ? `${(value / 1024).toFixed(1)} KB`
                  : String(value)
                }
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
