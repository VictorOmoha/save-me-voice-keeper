
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface EmptyStateProps {
  categoryName: string;
  onCreateEntry: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  categoryName,
  onCreateEntry
}) => {
  return (
    <div className="transform transition-all duration-500 ease-in-out animate-fade-in">
      <Card className="transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-105">
        <CardContent className="text-center py-12">
          <div className="text-6xl mb-4 transition-all duration-300 ease-in-out hover:scale-110 hover:rotate-12 cursor-default">
            📝
          </div>
          <h3 className="text-xl font-semibold mb-2 transition-all duration-200 ease-in-out hover:text-primary">
            No {categoryName.toLowerCase()} entries yet
          </h3>
          <p className="text-gray-600 mb-6 transition-colors duration-200 ease-in-out hover:text-foreground/80">
            Create your first {categoryName.toLowerCase()} entry to get started!
          </p>
          <Button 
            onClick={onCreateEntry}
            className="bg-gradient-primary hover:opacity-90 text-primary-foreground transition-all duration-300 ease-in-out hover:scale-110 hover:-translate-y-1 hover:shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2 transition-transform duration-200 ease-in-out hover:rotate-90" />
            Create {categoryName.slice(0, -1)}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
