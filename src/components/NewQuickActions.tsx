
import { Button } from "@/components/ui/button";
import { Search, Mic, Plus, FileText } from "lucide-react";
import { VoiceInputFixed } from "@/components/VoiceInputFixed";
import { VoiceCommand } from "@/utils/voiceCommandProcessor";
import { useState } from "react";
import { SmartSearchWithBoundary as SmartSearch } from "@/components/SmartSearch";
import { SavedEntry } from "@/types/dashboard";

interface NewQuickActionsProps {
  onAddEntry: () => void;
  onVoiceInput: () => void;
  onEnhancedVoiceInput: (text: string) => void;
  onCreateDocument: () => void;
  isVoiceProcessing?: boolean;
  lastVoiceCommand?: unknown;
  conversationState?: 'listening' | 'confirming' | 'idle';
  hasPendingConfirmation?: boolean;
  onCancelVoice?: () => void;
  conversationData?: { isActive: boolean; currentStep?: { question: string } };
  entries: SavedEntry[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onEntrySelect?: (entry: SavedEntry) => void;
}

export const NewQuickActions: React.FC<NewQuickActionsProps> = ({
  onAddEntry,
  onVoiceInput,
  onEnhancedVoiceInput,
  onCreateDocument,
  isVoiceProcessing,
  lastVoiceCommand,
  conversationState,
  hasPendingConfirmation,
  onCancelVoice,
  conversationData,
  entries,
  searchQuery,
  onSearchChange,
  onEntrySelect,
}) => {
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6 mb-6 md:mb-8">
      <div>
        <h3 className="text-base md:text-lg font-semibold text-card-foreground mb-1 md:mb-2">Quick Actions</h3>
        <p className="text-muted-foreground text-xs md:text-sm mb-3 md:mb-4">Get started with these common tasks</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Action buttons row */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button
            onClick={() => {
              console.log('Add Entry button clicked');
              onAddEntry();
            }}
            className="flex items-center space-x-2 flex-1 sm:flex-none min-w-[120px]"
            size="sm"
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
            className="flex items-center space-x-2 flex-1 sm:flex-none min-w-[120px]"
            size="sm"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden xs:inline">Create </span>Doc
          </Button>

          <Button
            onClick={() => {
              console.log('Voice Input button clicked');
              setShowVoiceInput(!showVoiceInput);
            }}
            variant={showVoiceInput ? "default" : "outline"}
            className="flex items-center space-x-2 sm:hidden"
            size="sm"
          >
            <Mic className="w-4 h-4" />
            <span>Voice</span>
          </Button>
        </div>

        {/* Search - full width on mobile, flexible on desktop */}
        <div className="w-full sm:min-w-[200px] sm:flex-1 order-first sm:order-none mb-3 sm:mb-0">
          <SmartSearch
            entries={entries}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            onEntrySelect={onEntrySelect}
            placeholder="Search entries..."
          />
        </div>

        {/* Voice button - hidden on mobile (shown above), visible on desktop */}
        <Button
          onClick={() => {
            console.log('Voice Input button clicked');
            setShowVoiceInput(!showVoiceInput);
          }}
          variant={showVoiceInput ? "default" : "outline"}
          className="hidden sm:flex items-center space-x-2"
          size="sm"
        >
          <Mic className="w-4 h-4" />
          <span>Voice Commands</span>
        </Button>
      </div>

      {showVoiceInput && (
        <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-border">
          <VoiceInputFixed
            onEnhancedVoiceInput={onEnhancedVoiceInput}
            isVoiceProcessing={isVoiceProcessing || false}
            lastVoiceCommand={lastVoiceCommand}
            conversationState={conversationState || 'idle'}
            hasPendingConfirmation={hasPendingConfirmation || false}
            onCancelVoice={onCancelVoice || (() => {})}
            conversationData={conversationData}
          />
        </div>
      )}
    </div>
  );
};
