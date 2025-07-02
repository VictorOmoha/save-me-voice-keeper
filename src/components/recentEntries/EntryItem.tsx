
import { Badge } from "@/components/ui/badge";
import { SavedEntry } from "@/types/dashboard";
import { getCategoryIcon, getCategoryColor, getCategoryName } from "./categoryUtils";

interface EntryItemProps {
  entry: SavedEntry;
  onClick: (entry: SavedEntry) => void;
}

export const EntryItem: React.FC<EntryItemProps> = ({ entry, onClick }) => {
  const Icon = getCategoryIcon(entry);
  const categoryColor = getCategoryColor(entry);
  const categoryName = getCategoryName(entry);
  
  return (
    <div 
      className="flex items-start space-x-4 p-4 rounded-lg hover:bg-accent transition-colors cursor-pointer"
      onClick={() => onClick(entry)}
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
};
