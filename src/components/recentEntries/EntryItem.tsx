
import React from "react";
import { Badge } from "@/components/ui/badge";
import { SavedEntry } from "@/types/dashboard";
import { getCategoryIcon, getCategoryColor, getCategoryName } from "./categoryUtils";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { printProfessionally } from "@/components/entries/ProfessionalPrintView";
import { toast } from "sonner";

interface EntryItemProps {
  entry: SavedEntry;
  onClick: (entry: SavedEntry) => void;
}

const EntryItemComponent: React.FC<EntryItemProps> = ({ entry, onClick }) => {
  const Icon = getCategoryIcon(entry);
  const categoryColor = getCategoryColor(entry);
  const categoryName = getCategoryName(entry);
  
  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    printProfessionally([entry], { title: entry.title, includeMetadata: true });
    toast.success("Print dialog opened");
  };
  
  return (
    <div 
      className="flex items-start space-x-4 p-4 rounded-lg hover:bg-accent transition-all duration-300 ease-in-out cursor-pointer transform hover:scale-105 hover:-translate-y-1 group animate-fade-in"
      onClick={() => onClick(entry)}
    >
      <div className={`w-10 h-10 rounded-lg ${categoryColor} flex items-center justify-center flex-shrink-0 transition-all duration-300 ease-in-out group-hover:scale-110 group-hover:rotate-3`}>
        <Icon className="w-5 h-5 transition-transform duration-200 ease-in-out group-hover:scale-110" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-card-foreground truncate transition-all duration-200 ease-in-out group-hover:text-primary group-hover:scale-105">
            {entry.title}
          </h4>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handlePrint}
              variant="ghost"
              size="sm"
              className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-purple-600 hover:text-purple-700"
            >
              <Printer className="h-3 w-3" />
            </Button>
            <Badge 
              variant="secondary" 
              className="text-xs flex-shrink-0 transition-all duration-200 ease-in-out group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground"
            >
              {categoryName}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2 transition-colors duration-200 ease-in-out group-hover:text-foreground/80">
          {Object.values(entry.fields).slice(0, 2).join(', ')}
        </p>
        <div className="flex items-center mt-2 space-x-3">
          <span className="text-xs text-muted-foreground transition-colors duration-200 ease-in-out group-hover:text-foreground/70">
            {new Date(entry.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

// Memoized component to prevent unnecessary re-renders
export const EntryItem = React.memo(EntryItemComponent, (prevProps, nextProps) => {
  return (
    prevProps.entry.id === nextProps.entry.id &&
    prevProps.entry.updatedAt === nextProps.entry.updatedAt
  );
});
