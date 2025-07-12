import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";

interface VoiceControlsProps {
  isListening: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  isListening,
  onStart,
  onStop,
  onReset,
}) => {
  return (
    <div className="flex gap-2">
      <Button
        onClick={isListening ? onStop : onStart}
        variant={isListening ? "destructive" : "default"}
        size="sm"
        className="flex-1"
      >
        {isListening ? (
          <>
            <MicOff className="h-4 w-4 mr-2" />
            Stop Listening
          </>
        ) : (
          <>
            <Mic className="h-4 w-4 mr-2" />
            Start Voice Commands
          </>
        )}
      </Button>
      <Button
        onClick={onReset}
        variant="outline"
        size="sm"
      >
        Reset
      </Button>
    </div>
  );
};