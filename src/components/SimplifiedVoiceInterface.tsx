import React, { useEffect, useState, useRef, useCallback } from "react";
import { SavedEntry } from "@/types/dashboard";
import { speechRecognition } from "@/utils/speechRecognitionSingleton";
import { voiceProcessor } from "@/utils/simplifiedVoiceProcessor";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SimplifiedVoiceInterfaceProps {
  savedEntries: SavedEntry[];
  onCreateEntry: () => void;
  onEditEntry: (entry: SavedEntry) => void;
  onDeleteEntry: (id: string) => void;
  onCloseModal: () => void;
}

export const SimplifiedVoiceInterface: React.FC<SimplifiedVoiceInterfaceProps> = ({
  savedEntries,
  onCreateEntry,
  onEditEntry,
  onDeleteEntry,
  onCloseModal,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const [voiceState, setVoiceState] = useState(voiceProcessor.getState());
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update voice state when processor state changes
  const updateVoiceState = useCallback(() => {
    setVoiceState(voiceProcessor.getState());
  }, []);

  // Handle TTS completion events
  useEffect(() => {
    const handleTTSCompleted = () => {
      console.log('🔊 Simplified Voice: TTS completed, restarting recognition');
      
      // Clear any existing restart timeout
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      
      // Restart recognition after a short delay if we're active
      if (isActive && !isListening) {
        restartTimeoutRef.current = setTimeout(() => {
          if (recognitionRef.current && isActive) {
            try {
              console.log('🎤 Simplified Voice: Restarting recognition after TTS');
              recognitionRef.current.start();
            } catch (error) {
              console.log('⚠️ Simplified Voice: Recognition restart failed:', error);
            }
          }
        }, 500);
      }
    };

    const handleTTSStarted = () => {
      console.log('🔊 Simplified Voice: TTS started, stopping recognition');
      if (recognitionRef.current && isListening) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.log('⚠️ Simplified Voice: Recognition stop failed:', error);
        }
      }
    };

    window.addEventListener('tts-completed', handleTTSCompleted);
    window.addEventListener('tts-started', handleTTSStarted);

    return () => {
      window.removeEventListener('tts-completed', handleTTSCompleted);
      window.removeEventListener('tts-started', handleTTSStarted);
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, [isActive, isListening]);

  // Setup speech recognition
  useEffect(() => {
    if (!speechRecognition.isSupported()) {
      console.log('❌ Simplified Voice: Speech recognition not supported');
      return;
    }

    console.log('🎤 Simplified Voice: Setting up speech recognition');

    const recognition = speechRecognition.getRecognition();
    recognitionRef.current = recognition;

    // Set up callbacks
    speechRecognition.setCallbacks({
      onResult: async (transcript: string) => {
        const isFinal = true; // Assume final for simplified processing
        console.log('🎤 Simplified Voice: Transcript:', transcript, 'Final:', isFinal);
        setLastTranscript(transcript);
        
        if (isFinal && transcript.trim()) {
          try {
            await voiceProcessor.processCommand(transcript, {
              savedEntries,
              onCreateEntry,
              onDeleteEntry,
              onEditEntry,
              onCloseModal,
            });
            updateVoiceState();
          } catch (error) {
            console.error('❌ Simplified Voice: Command processing error:', error);
          }
        }
      },
      onStart: () => {
        console.log('🎤 Simplified Voice: Recognition started');
        setIsListening(true);
      },
      onEnd: () => {
        console.log('🔚 Simplified Voice: Recognition ended');
        setIsListening(false);
        
        // Auto-restart if we're still active and not awaiting confirmation
        if (isActive && !voiceState.awaitingConfirmation) {
          restartTimeoutRef.current = setTimeout(() => {
            if (recognitionRef.current && isActive) {
              try {
                console.log('🔄 Simplified Voice: Auto-restarting recognition');
                recognitionRef.current.start();
              } catch (error) {
                console.log('⚠️ Simplified Voice: Auto-restart failed:', error);
              }
            }
          }, 1000);
        }
      },
      onError: (error: any) => {
        console.error('❌ Simplified Voice: Recognition error:', error);
        setIsListening(false);
      }
    });

    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, [savedEntries, onCreateEntry, onDeleteEntry, onEditEntry, onCloseModal, isActive, voiceState.awaitingConfirmation, updateVoiceState]);

  const toggleVoice = () => {
    if (isActive) {
      console.log('🛑 Simplified Voice: Deactivating');
      setIsActive(false);
      voiceProcessor.reset();
      updateVoiceState();
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.log('⚠️ Simplified Voice: Stop failed:', error);
        }
      }
      
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    } else {
      console.log('🚀 Simplified Voice: Activating');
      setIsActive(true);
      voiceProcessor.reset();
      updateVoiceState();
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error('❌ Simplified Voice: Start failed:', error);
        }
      }
    }
  };

  const getStatusText = () => {
    if (voiceState.awaitingConfirmation) return 'Waiting for confirmation';
    if (isListening) return 'Listening';
    if (isActive) return 'Ready';
    return 'Inactive';
  };

  const getStatusColor = () => {
    if (voiceState.awaitingConfirmation) return 'destructive';
    if (isListening) return 'default';
    if (isActive) return 'secondary';
    return 'outline';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {/* Voice toggle button */}
      <Button
        onClick={toggleVoice}
        size="lg"
        variant={isActive ? "default" : "outline"}
        className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200"
      >
        {isActive ? (
          isListening ? (
            <Mic className="w-6 h-6 text-white animate-pulse" />
          ) : (
            <Volume2 className="w-6 h-6 text-white" />
          )
        ) : (
          <MicOff className="w-6 h-6" />
        )}
      </Button>

      {/* Status indicator */}
      {isActive && (
        <div className="flex flex-col items-end space-y-1">
          <Badge variant={getStatusColor()} className="text-xs">
            {getStatusText()}
          </Badge>
          
          {voiceState.awaitingConfirmation && (
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-md p-2 text-xs max-w-xs">
              <div className="text-orange-600 dark:text-orange-400 font-medium">
                Say "yes" to confirm or "no" to cancel
              </div>
            </div>
          )}
          
          {lastTranscript && (
            <div className="bg-background/90 border rounded-md p-2 text-xs max-w-xs">
              <div className="font-medium">Last heard:</div>
              <div className="text-muted-foreground truncate">{lastTranscript}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};