
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus } from "lucide-react";

interface CategoryHeaderProps {
  categoryName: string;
  entriesCount: number;
  onBack: () => void;
  onCreateEntry: () => void;
}

export const CategoryHeader: React.FC<CategoryHeaderProps> = ({
  categoryName,
  entriesCount,
  onBack,
  onCreateEntry
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button onClick={onBack} variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">{categoryName}</h1>
        <Badge variant="secondary">{entriesCount} entries</Badge>
      </div>
      
      <Button 
        onClick={onCreateEntry}
        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
      >
        <Plus className="w-4 h-4 mr-2" />
        Create {categoryName.slice(0, -1)}
      </Button>
    </div>
  );
};
