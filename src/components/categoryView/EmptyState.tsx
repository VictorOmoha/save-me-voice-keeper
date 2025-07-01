
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
    <Card>
      <CardContent className="text-center py-12">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-xl font-semibold mb-2">No {categoryName.toLowerCase()} entries yet</h3>
        <p className="text-gray-600 mb-6">
          Create your first {categoryName.toLowerCase()} entry to get started!
        </p>
        <Button 
          onClick={onCreateEntry}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create {categoryName.slice(0, -1)}
        </Button>
      </CardContent>
    </Card>
  );
};
