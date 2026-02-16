
import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, X, RotateCcw } from "lucide-react";

interface VoiceControlsProps {
  isActive?: boolean;
  isListening?: boolean;
  onActivate?: () => void;
  onDeactivate?: () => void;
  onStart?: () => void;
  onStop?: () => void;
  onReset?: () => void;
  onCancelConversation?: () => void;
  isInConversation?: boolean;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  isActive = false,
  isListening = false,
  onActivate,
  onDeactivate,
  onStart,
  onStop,
  onReset,
  onCancelConversation,
  isInConversation = false,
}) => {
  // Handle different control patterns
  if (onStart && onStop) {
    // Simple voice input pattern
    return (
      <div className="flex gap-2" role="toolbar" aria-label="Voice command controls">
        {!isListening ? (
          <Button
            onClick={onStart}
            className="flex items-center gap-2"
            variant="default"
            aria-label="Start voice recognition for commands"
          >
            <Mic className="h-4 w-4" aria-hidden="true" />
            Start Voice Commands
          </Button>
        ) : (
          <Button
            onClick={onStop}
            className="flex items-center gap-2"
            variant="outline"
            aria-label="Stop voice recognition"
          >
            <MicOff className="h-4 w-4" aria-hidden="true" />
            Stop Voice Commands
          </Button>
        )}

        {onReset && (
          <Button
            onClick={onReset}
            className="flex items-center gap-2"
            variant="ghost"
            size="sm"
            aria-label="Reset voice recognition system"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset
          </Button>
        )}

        {isInConversation && onCancelConversation && (
          <Button
            onClick={onCancelConversation}
            className="flex items-center gap-2"
            variant="destructive"
            size="sm"
            aria-label="Cancel current voice conversation"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Cancel Conversation
          </Button>
        )}
      </div>
    );
  }

  // Conversational voice interface pattern
  return (
    <div className="flex gap-2" role="toolbar" aria-label="Voice mode controls">
      {!isActive ? (
        <Button
          onClick={onActivate}
          className="flex items-center gap-2"
          variant="default"
          aria-label="Activate voice recognition mode"
        >
          <Mic className="h-4 w-4" aria-hidden="true" />
          Start Voice Mode
        </Button>
      ) : (
        <Button
          onClick={onDeactivate}
          className="flex items-center gap-2"
          variant="outline"
          aria-label="Deactivate voice recognition mode"
        >
          <MicOff className="h-4 w-4" aria-hidden="true" />
          Stop Voice Mode
        </Button>
      )}

      {isInConversation && onCancelConversation && (
        <Button
          onClick={onCancelConversation}
          className="flex items-center gap-2"
          variant="destructive"
          size="sm"
          aria-label="Cancel current voice conversation"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          Cancel Conversation
        </Button>
      )}
    </div>
  );
};
