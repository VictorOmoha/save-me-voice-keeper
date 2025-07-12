import React from "react";
import { Badge } from "@/components/ui/badge";

interface VoiceHelpProps {
  isListening: boolean;
  transcript: string;
}

export const VoiceHelp: React.FC<VoiceHelpProps> = ({
  isListening,
  transcript,
}) => {
  if (isListening || transcript) {
    return null;
  }

  return (
    <div className="text-center py-4">
      <p className="text-xs text-muted-foreground mb-2">Click "Start Voice Commands" and try saying:</p>
      <div className="flex flex-wrap gap-1 justify-center">
        <Badge variant="outline" className="text-xs">
          "Create a new entry"
        </Badge>
        <Badge variant="outline" className="text-xs">
          "Show my documents"
        </Badge>
        <Badge variant="outline" className="text-xs">
          "Delete old entries"
        </Badge>
      </div>
    </div>
  );
};