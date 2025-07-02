
import { Button } from "@/components/ui/button";
import { Search, Mic, Plus, FileText } from "lucide-react";
import { VoiceInput } from "@/components/VoiceInput";
import { VoiceCommand } from "@/utils/voiceCommandProcessor";
import { useState } from "react";

interface NewQuickActionsProps {
  onAddEntry: () => void;
  onVoiceInput: () => void;
  onVoiceResult: (text: string) => void;
  onVoiceCommand: (command: VoiceCommand) => void;
  onCreateDocument: () => void;
}

export const NewQuickActions: React.FC<NewQuickActionsProps> = ({
  onAddEntry,
  onVoiceInput,
  onVoiceResult,
  onVoiceCommand,
  onCreateDocument,
}) => {
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-8">
      <div>
        <h3 className="text-lg font-semibold text-card-foreground mb-2">Quick Actions</h3>
        <p className="text-muted-foreground text-sm mb-4">Get started with these common tasks</p>
      </div>
      
      <div className="flex flex-wrap gap-3">
        <Button 
          onClick={() => {
            console.log('Add Entry button clicked');
            onAddEntry();
          }} 
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Entry</span>
        </Button>
        
        <Button 
          onClick={() => {
            console.log('Create Document button clicked');
            onCreateDocument();
          }} 
          variant="outline" 
          className="flex items-center space-x-2"
        >
          <FileText className="w-4 h-4" />
          <span>Create Document</span>
        </Button>
        
        <Button variant="outline" className="flex items-center space-x-2">
          <Search className="w-4 h-4" />
          <span>Search</span>
        </Button>
        
        <Button 
          onClick={() => {
            console.log('Voice Input button clicked');
            setShowVoiceInput(!showVoiceInput);
          }} 
          variant={showVoiceInput ? "default" : "outline"}
          className="flex items-center space-x-2"
        >
          <Mic className="w-4 h-4" />
          <span>Voice Commands</span>
        </Button>
      </div>
      
      {showVoiceInput && (
        <div className="mt-6 pt-6 border-t border-border">
          <VoiceInput 
            onVoiceResult={onVoiceResult}
            onVoiceCommand={onVoiceCommand}
          />
        </div>
      )}
    </div>
  );
};
