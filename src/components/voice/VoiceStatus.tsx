
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Volume2, Settings } from "lucide-react";

interface VoiceStatusProps {
  isListening: boolean;
  conversationState?: { isActive: boolean; currentStep?: { question: string } };
  onSettingsClick: () => void;
}

export const VoiceStatus: React.FC<VoiceStatusProps> = ({
  isListening,
  conversationState,
  onSettingsClick,
}) => {
  return (
    <div className="flex items-center justify-between transition-all duration-300 ease-in-out animate-fade-in">
      <div className="flex items-center gap-2">
        <Volume2 className={`h-4 w-4 text-muted-foreground transition-all duration-300 ease-in-out ${
          isListening ? 'text-primary animate-pulse' : ''
        }`} />
        <span className="text-sm font-medium transition-colors duration-200 ease-in-out hover:text-primary">
          Voice Commands
        </span>
        {isListening && (
          <Badge 
            variant="default" 
            className="text-xs animate-pulse transition-all duration-300 ease-in-out"
          >
            {conversationState?.isActive ? 'In Conversation' : 'Listening...'}
          </Badge>
        )}
        {conversationState?.isActive && !isListening && (
          <Badge 
            variant="secondary" 
            className="text-xs transition-all duration-200 ease-in-out hover:scale-105"
          >
            Conversation Active
          </Badge>
        )}
      </div>
      <Button
        onClick={onSettingsClick}
        variant="ghost"
        size="sm"
        className="text-xs transition-all duration-200 ease-in-out hover:scale-110 hover:-translate-y-1"
      >
        <Settings className="h-3 w-3 mr-1 transition-transform duration-200 ease-in-out hover:rotate-90" />
        Settings
      </Button>
    </div>
  );
};
