
import { Button } from "@/components/ui/button";
import { Search, Bell, Mic, MicOff, Brain } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { Sun, Moon } from "lucide-react";
import { SmartSearch } from "@/components/SmartSearch";
import { SavedEntry } from "@/pages/Dashboard";
import { VoiceInput } from "@/components/VoiceInput";
import { EnhancedVoiceInput } from "@/components/EnhancedVoiceInput";
import { VoiceCommand } from "@/utils/voiceCommandProcessor";
import { EnhancedVoiceCommand } from "@/utils/enhancedVoiceProcessor";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface DashboardTopHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  userName?: string;
  entries: SavedEntry[];
  onVoiceResult: (text: string) => void;
  onVoiceCommand: (command: VoiceCommand) => void;
  // Enhanced Voice Props
  onEnhancedVoiceInput?: (transcript: string) => void;
  isVoiceProcessing?: boolean;
  lastVoiceCommand?: EnhancedVoiceCommand | null;
  conversationState?: 'listening' | 'confirming' | 'idle';
  hasPendingConfirmation?: boolean;
  onCancelVoiceOperation?: () => void;
}

export const DashboardTopHeader = ({
  searchQuery,
  onSearchChange,
  userName,
  entries,
  onVoiceResult,
  onVoiceCommand,
  onEnhancedVoiceInput,
  isVoiceProcessing = false,
  lastVoiceCommand,
  conversationState = 'idle',
  hasPendingConfirmation = false,
  onCancelVoiceOperation,
}: DashboardTopHeaderProps) => {
  const { theme, setTheme } = useTheme();
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [useEnhancedVoice, setUseEnhancedVoice] = useState(true);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="relative">
      <header className="bg-background border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground z-10" />
              <SmartSearch
                entries={entries}
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
                placeholder="Search your entries..."
                className="w-full"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowVoiceInput(!showVoiceInput)}
              className={showVoiceInput ? "bg-accent" : ""}
            >
              {useEnhancedVoice ? (
                <>
                  <Brain className="w-4 h-4 mr-1" />
                  {showVoiceInput ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </>
              ) : (
                showVoiceInput ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />
              )}
            </Button>
            {useEnhancedVoice && (conversationState !== 'idle' || isVoiceProcessing) && (
              <Badge variant={conversationState === 'confirming' ? 'destructive' : 'default'} className="text-xs">
                {conversationState === 'confirming' ? 'Confirm?' : isVoiceProcessing ? 'Processing...' : conversationState}
              </Badge>
            )}
            <Button variant="ghost" size="sm">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-primary font-medium text-sm">
                {userName?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </header>
      
      {showVoiceInput && (
        <div className="absolute top-full left-0 right-0 z-50 bg-background border border-border shadow-lg p-4">
          <div className="mb-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUseEnhancedVoice(!useEnhancedVoice)}
            >
              {useEnhancedVoice ? 'Switch to Basic Voice' : 'Switch to AI Voice'}
              {useEnhancedVoice && <Brain className="w-4 h-4 ml-1" />}
            </Button>
          </div>
          
          {useEnhancedVoice && onEnhancedVoiceInput ? (
            <EnhancedVoiceInput
              onVoiceInput={onEnhancedVoiceInput}
              isProcessing={isVoiceProcessing}
              lastCommand={lastVoiceCommand}
              conversationState={conversationState}
              hasPendingConfirmation={hasPendingConfirmation}
              onCancel={onCancelVoiceOperation || (() => {})}
            />
          ) : (
            <VoiceInput 
              onVoiceResult={onVoiceResult}
              onVoiceCommand={onVoiceCommand}
            />
          )}
        </div>
      )}
    </div>
  );
};
