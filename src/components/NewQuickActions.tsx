
import { Button } from "@/components/ui/button";
import { Search, Mic, Plus, FileText } from "lucide-react";

interface NewQuickActionsProps {
  onAddEntry: () => void;
  onVoiceInput: () => void;
  onCreateDocument: () => void;
}

export const NewQuickActions: React.FC<NewQuickActionsProps> = ({
  onAddEntry,
  onVoiceInput,
  onCreateDocument,
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Actions</h3>
        <p className="text-gray-600 text-sm mb-4">Get started with these common tasks</p>
      </div>
      
      <div className="flex flex-wrap gap-3">
        <Button onClick={onAddEntry} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Entry</span>
        </Button>
        
        <Button onClick={onCreateDocument} variant="outline" className="flex items-center space-x-2">
          <FileText className="w-4 h-4" />
          <span>Create Document</span>
        </Button>
        
        <Button variant="outline" className="flex items-center space-x-2">
          <Search className="w-4 h-4" />
          <span>Search</span>
        </Button>
        
        <Button onClick={onVoiceInput} variant="outline" className="flex items-center space-x-2">
          <Mic className="w-4 h-4" />
          <span>Voice Input</span>
        </Button>
      </div>
    </div>
  );
};
