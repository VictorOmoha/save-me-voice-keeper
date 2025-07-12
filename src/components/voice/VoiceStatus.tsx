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
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Volume2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Voice Commands</span>
        {isListening && (
          <Badge variant="default" className="text-xs animate-pulse">
            {conversationState?.isActive ? 'In Conversation' : 'Listening...'}
          </Badge>
        )}
        {conversationState?.isActive && !isListening && (
          <Badge variant="secondary" className="text-xs">
            Conversation Active
          </Badge>
        )}
      </div>
      <Button
        onClick={onSettingsClick}
        variant="ghost"
        size="sm"
        className="text-xs"
      >
        <Settings className="h-3 w-3 mr-1" />
        Settings
      </Button>
    </div>
  );
};