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
  const handleStartStop = () => {
    console.log('VoiceControls: Button clicked, isListening:', isListening);
    console.log('VoiceControls: onStart function type:', typeof onStart);
    console.log('VoiceControls: onStop function type:', typeof onStop);
    
    if (isListening) {
      console.log('VoiceControls: Calling onStop');
      onStop();
    } else {
      console.log('VoiceControls: Calling onStart');
      
      // Test browser compatibility
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      console.log('VoiceControls: SpeechRecognition available:', !!SpeechRecognition);
      
      if (!SpeechRecognition) {
        console.error('VoiceControls: Speech recognition not supported in this browser');
        return;
      }
      
      onStart();
    }
  };

  const handleReset = () => {
    console.log('VoiceControls: Reset button clicked');
    onReset();
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleStartStop}
        variant={isListening ? "destructive" : "default"}
        size="sm"
        className="flex-1"
        disabled={false} // Ensure button is not disabled
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
        onClick={handleReset}
        variant="outline"
        size="sm"
        disabled={false} // Ensure button is not disabled
      >
        Reset
      </Button>
    </div>
  );
};