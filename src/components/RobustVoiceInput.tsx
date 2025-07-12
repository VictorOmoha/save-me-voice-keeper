import { useEffect, useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Settings, Volume2, CheckCircle, AlertTriangle } from "lucide-react";
import { VoiceSettingsModal } from "./VoiceSettingsModal";
import { processVoiceCommand, VoiceCommand } from "@/utils/voiceCommandProcessor";
import { toast } from "sonner";

interface RobustVoiceInputProps {
  onVoiceCommand?: (command: VoiceCommand) => void;
  onEnhancedVoiceInput?: (text: string) => void;
}

export const RobustVoiceInput: React.FC<RobustVoiceInputProps> = ({
  onVoiceCommand,
  onEnhancedVoiceInput,
}) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [lastProcessedTranscript, setLastProcessedTranscript] = useState("");
  const [processingCommand, setProcessingCommand] = useState(false);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  // Process transcript when it changes
  useEffect(() => {
    if (transcript && transcript !== lastProcessedTranscript && !processingCommand) {
      setProcessingCommand(true);
      setLastProcessedTranscript(transcript);
      
      console.log('Processing voice transcript:', transcript);
      
      // Process the command
      const command = processVoiceCommand(transcript);
      
      // Call the appropriate handler
      if (onVoiceCommand) {
        onVoiceCommand(command);
      } else if (onEnhancedVoiceInput) {
        onEnhancedVoiceInput(transcript);
      }
      
      // Show feedback
      if (command.type !== 'unknown') {
        toast.success(`Voice command: ${command.type}`);
      } else {
        toast.info(`Voice input: "${transcript}"`);
      }
      
      // Reset after processing
      setTimeout(() => {
        setProcessingCommand(false);
        resetTranscript();
      }, 2000);
    }
  }, [transcript, lastProcessedTranscript, processingCommand, onVoiceCommand, onEnhancedVoiceInput, resetTranscript]);

  const startListening = () => {
    if (!browserSupportsSpeechRecognition) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }
    
    if (!isMicrophoneAvailable) {
      toast.error('Microphone not available');
      return;
    }

    resetTranscript();
    setLastProcessedTranscript("");
    SpeechRecognition.startListening({ 
      continuous: true,
      language: localStorage.getItem('speech_language') || 'en-US'
    });
    toast.info('Voice recognition started');
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
    toast.info('Voice recognition stopped');
  };

  const resetListening = () => {
    stopListening();
    resetTranscript();
    setLastProcessedTranscript("");
    setProcessingCommand(false);
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Speech recognition not supported in this browser</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Voice Commands</span>
          {listening && (
            <Badge variant="default" className="text-xs animate-pulse">
              Listening
            </Badge>
          )}
          {processingCommand && (
            <Badge variant="secondary" className="text-xs">
              Processing
            </Badge>
          )}
        </div>
        <Button
          onClick={() => setShowSettingsModal(true)}
          variant="ghost"
          size="sm"
          className="text-xs"
        >
          <Settings className="h-3 w-3 mr-1" />
          Settings
        </Button>
      </div>

      {/* Voice Input Card */}
      <Card className={listening ? "border-primary" : ""}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <span>Voice Input</span>
            {isMicrophoneAvailable ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex gap-2">
            <Button
              onClick={listening ? stopListening : startListening}
              variant={listening ? "destructive" : "default"}
              size="sm"
              className="flex-1"
            >
              {listening ? (
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
              onClick={resetListening}
              variant="outline"
              size="sm"
            >
              Reset
            </Button>
          </div>

          {/* Transcript Display */}
          {transcript && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-muted-foreground">You said:</span>
                {processingCommand && (
                  <Badge variant="secondary" className="text-xs">
                    Processing...
                  </Badge>
                )}
              </div>
              <p className="text-foreground">"{transcript}"</p>
            </div>
          )}

          {/* Help Text */}
          {!listening && !transcript && (
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
          )}
        </CardContent>
      </Card>

      {/* Voice Settings Modal */}
      <VoiceSettingsModal 
        isOpen={showSettingsModal}
        onOpenChange={setShowSettingsModal}
      />
    </div>
  );
};