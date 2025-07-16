
import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VoiceControlsProps {
  isListening: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  isSupported?: boolean;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  isListening,
  onStart,
  onStop,
  onReset,
  isSupported = true,
}) => {
  const handleStartStop = () => {
    console.log('VoiceControls: Button clicked, isListening:', isListening);
    
    if (isListening) {
      console.log('VoiceControls: Stopping voice recognition');
      onStop();
    } else {
      console.log('VoiceControls: Starting voice recognition');
      onStart();
    }
  };

  const handleReset = () => {
    console.log('VoiceControls: Reset button clicked');
    onReset();
  };

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg transition-all duration-300 ease-in-out animate-fade-in">
        <MicOff className="h-4 w-4 text-muted-foreground transition-all duration-200 ease-in-out" />
        <span className="text-sm text-muted-foreground">
          Voice recognition not supported in this browser
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Status indicator */}
      <div className="flex items-center gap-2 transition-all duration-300 ease-in-out">
        <div className={`w-2 h-2 rounded-full transition-all duration-300 ease-in-out ${
          isListening ? 'bg-red-500 animate-pulse scale-110' : 'bg-gray-400'
        }`} />
        <Badge 
          variant={isListening ? "default" : "secondary"} 
          className={`text-xs transition-all duration-300 ease-in-out ${
            isListening ? 'animate-pulse' : ''
          }`}
        >
          {isListening ? 'Listening...' : 'Ready'}
        </Badge>
      </div>
      
      {/* Control buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleStartStop}
          variant={isListening ? "destructive" : "default"}
          size="sm"
          className={`flex-1 transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-y-1 ${
            isListening ? 'animate-pulse' : ''
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="h-4 w-4 mr-2 transition-transform duration-200 ease-in-out hover:scale-110" />
              Stop Listening
            </>
          ) : (
            <>
              <Mic className="h-4 w-4 mr-2 transition-transform duration-200 ease-in-out hover:scale-110" />
              Start Voice Commands
            </>
          )}
        </Button>
        
        <Button
          onClick={handleReset}
          variant="outline"
          size="sm"
          title="Reset voice recognition"
          className="transition-all duration-200 ease-in-out hover:scale-110 hover:-translate-y-1"
        >
          <RotateCcw className="h-4 w-4 transition-transform duration-200 ease-in-out hover:rotate-180" />
        </Button>
      </div>
      
      {/* Quick tips */}
      {!isListening && (
        <div className="text-xs text-muted-foreground transition-all duration-300 ease-in-out animate-fade-in">
          <p className="hover:text-foreground/80 transition-colors duration-200">
            Try saying: "Create new entry", "Open insurance policy", or "Show all entries"
          </p>
        </div>
      )}
    </div>
  );
};
