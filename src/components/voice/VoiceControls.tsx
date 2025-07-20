
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
      <div className="flex gap-2">
        {!isListening ? (
          <Button
            onClick={onStart}
            className="flex items-center gap-2"
            variant="default"
          >
            <Mic className="h-4 w-4" />
            Start Voice Commands
          </Button>
        ) : (
          <Button
            onClick={onStop}
            className="flex items-center gap-2"
            variant="outline"
          >
            <MicOff className="h-4 w-4" />
            Stop Voice Commands
          </Button>
        )}

        {onReset && (
          <Button
            onClick={onReset}
            className="flex items-center gap-2"
            variant="ghost"
            size="sm"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        )}

        {isInConversation && onCancelConversation && (
          <Button
            onClick={onCancelConversation}
            className="flex items-center gap-2"
            variant="destructive"
            size="sm"
          >
            <X className="h-4 w-4" />
            Cancel Conversation
          </Button>
        )}
      </div>
    );
  }

  // Conversational voice interface pattern
  return (
    <div className="flex gap-2">
      {!isActive ? (
        <Button
          onClick={onActivate}
          className="flex items-center gap-2"
          variant="default"
        >
          <Mic className="h-4 w-4" />
          Start Voice Mode
        </Button>
      ) : (
        <Button
          onClick={onDeactivate}
          className="flex items-center gap-2"
          variant="outline"
        >
          <MicOff className="h-4 w-4" />
          Stop Voice Mode
        </Button>
      )}

      {isInConversation && onCancelConversation && (
        <Button
          onClick={onCancelConversation}
          className="flex items-center gap-2"
          variant="destructive"
          size="sm"
        >
          <X className="h-4 w-4" />
          Cancel Conversation
        </Button>
      )}
    </div>
  );
};
