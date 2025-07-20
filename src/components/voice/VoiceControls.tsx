
import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, X } from "lucide-react";

interface VoiceControlsProps {
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  onCancelConversation?: () => void;
  isInConversation?: boolean;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  isActive,
  onActivate,
  onDeactivate,
  onCancelConversation,
  isInConversation = false,
}) => {
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
