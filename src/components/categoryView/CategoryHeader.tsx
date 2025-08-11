
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus } from "lucide-react";

interface CategoryHeaderProps {
  categoryName: string;
  entriesCount: number;
  onBack?: () => void;
  onCreateEntry: () => void;
}

export const CategoryHeader: React.FC<CategoryHeaderProps> = ({
  categoryName,
  entriesCount,
  onBack,
  onCreateEntry
}) => {
  return (
    <div className="flex items-center justify-between mb-6 animate-fade-in">
      <div className="flex items-center space-x-4">
        {onBack && (
          <Button 
            onClick={onBack} 
            variant="ghost" 
            size="sm"
            className="transition-all duration-200 ease-in-out hover:scale-110 hover:-translate-x-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform duration-200 ease-in-out hover:-translate-x-1" />
            Back
          </Button>
        )}
        <h1 className="text-2xl font-bold transition-all duration-200 ease-in-out hover:text-primary hover:scale-105">
          {categoryName}
        </h1>
        <Badge 
          variant="secondary" 
          className="transition-all duration-200 ease-in-out hover:scale-110 hover:bg-primary hover:text-primary-foreground"
        >
          {entriesCount} entries
        </Badge>
      </div>
      
      <Button 
        onClick={onCreateEntry}
        className="bg-gradient-primary hover:opacity-90 text-primary-foreground transition-all duration-300 ease-in-out hover:scale-110 hover:-translate-y-1 hover:shadow-lg"
      >
        <Plus className="w-4 h-4 mr-2 transition-transform duration-200 ease-in-out hover:rotate-90" />
        Create {categoryName.slice(0, -1)}
      </Button>
    </div>
  );
};
