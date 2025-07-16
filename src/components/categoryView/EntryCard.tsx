
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
    <div className="transform transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-y-2 animate-fade-in">
      <Card className="hover:shadow-2xl transition-all duration-300 ease-in-out border hover:border-primary/40 group cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 transition-all duration-200 ease-in-out">
          <CardTitle className="text-xl transition-all duration-200 ease-in-out group-hover:text-primary group-hover:scale-105">
            {entry.title}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="transition-all duration-200 ease-in-out hover:scale-105">
              {new Date(entry.createdAt).toLocaleDateString()}
            </Badge>
            {entry.fields.fileName && (
              <Badge variant="secondary" className="text-xs transition-all duration-200 ease-in-out hover:scale-105">
                {entry.fields.fileName}
              </Badge>
            )}
            {entry.fields.hasUploadedFile && entry.fields.fileName && (
              <Button
                onClick={() => onDownload(entry)}
                variant="outline"
                size="sm"
                disabled={isDownloading}
                className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-all duration-200 ease-in-out hover:scale-110 hover:-translate-y-1"
              >
                <Download className="w-4 h-4 transition-transform duration-200 ease-in-out hover:rotate-12" />
              </Button>
            )}
            <Button 
              onClick={() => {
                console.log('Fill button clicked for entry:', entry.title);
                onFill(entry);
              }}
              variant="outline" 
              size="sm"
              className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-all duration-200 ease-in-out hover:scale-110 hover:-translate-y-1"
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
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-all duration-200 ease-in-out hover:scale-110 hover:-translate-y-1"
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
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-all duration-200 ease-in-out hover:scale-110 hover:-translate-y-1"
            >
              Delete
            </Button>
          </div>
        </CardHeader>
        <CardContent className="transition-all duration-200 ease-in-out">
          <div className="grid gap-3">
            {Object.entries(entry.fields).map(([key, value], index) => (
              <div 
                key={key} 
                className="flex flex-col sm:flex-row sm:items-center transition-all duration-200 ease-in-out hover:bg-accent/30 rounded-md p-2 -m-2"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="font-medium text-foreground mb-1 sm:mb-0 sm:w-1/3 transition-colors duration-200 ease-in-out">
                  {key}:
                </span>
                <span className="text-foreground sm:w-2/3 transition-colors duration-200 ease-in-out">
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
    </div>
  );
};
