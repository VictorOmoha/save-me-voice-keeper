import { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Settings, Volume2, CheckCircle, AlertTriangle } from "lucide-react";
import { VoiceSettingsModal } from "./VoiceSettingsModal";
import { processVoiceCommand, VoiceCommand } from "@/utils/voiceCommandProcessor";
import { toast } from "sonner";

interface SimpleVoiceInputProps {
  onVoiceCommand?: (command: VoiceCommand) => void;
  onEnhancedVoiceInput?: (text: string) => void;
  conversationState?: { isActive: boolean; currentStep?: { question: string } };
}

export const SimpleVoiceInput: React.FC<SimpleVoiceInputProps> = ({
  onVoiceCommand,
  onEnhancedVoiceInput,
  conversationState,
}) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [lastProcessedTranscript, setLastProcessedTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      
      // Configure recognition
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = localStorage.getItem('speech_language') || 'en-US';
      
      // Event handlers
      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
      };
      
      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);
        
        // Process final results
        if (finalTranscript && finalTranscript !== lastProcessedTranscript) {
          console.log('Processing final transcript:', finalTranscript);
          setLastProcessedTranscript(finalTranscript);
          
          // Process the command
          const command = processVoiceCommand(finalTranscript);
          
          // Call the appropriate handler
          if (onVoiceCommand) {
            onVoiceCommand(command);
          } else if (onEnhancedVoiceInput) {
            onEnhancedVoiceInput(finalTranscript);
          }
          
          // Show feedback
          if (command.type !== 'unknown') {
            toast.success(`Voice command: ${command.type.replace('_', ' ')}`);
          } else {
            toast.info(`Voice input: "${finalTranscript}"`);
          }
          
          // Clear transcript after processing
          setTimeout(() => {
            setTranscript("");
          }, 2000);
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'aborted') {
          toast.error(`Speech recognition error: ${event.error}`);
        }
        setIsListening(false);
      };
      
      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
        
        // Auto-restart if we're in an active conversation and not manually stopped
        if (conversationState?.isActive && recognitionRef.current) {
          console.log('Auto-restarting voice recognition for conversation');
          setTimeout(() => {
            try {
              if (conversationState?.isActive && recognitionRef.current) {
                recognitionRef.current.start();
                setIsListening(true);
              }
            } catch (error) {
              console.error('Error restarting recognition:', error);
              // If restart fails, let user know they need to manually restart
              toast.info('Voice recognition stopped. Click "Start Voice Commands" to continue.');
            }
          }, 1000); // Longer delay to ensure clean restart
        }
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onVoiceCommand, onEnhancedVoiceInput, lastProcessedTranscript, conversationState?.isActive]);

  const startListening = () => {
    if (!isSupported) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }
    
    if (recognitionRef.current && !isListening) {
      try {
        setTranscript("");
        setLastProcessedTranscript("");
        recognitionRef.current.start();
        toast.info('Voice recognition started - speak now');
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        toast.error('Failed to start voice recognition');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      toast.info('Voice recognition stopped');
    }
  };

  const resetListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    setTranscript("");
    setLastProcessedTranscript("");
    setIsListening(false);
  };

  if (!isSupported) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">
              Speech recognition not supported in this browser. 
              Please use Chrome, Edge, or Safari.
            </span>
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
      <Card className={isListening ? "border-primary" : ""}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <span>Voice Input</span>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex gap-2">
            <Button
              onClick={isListening ? stopListening : startListening}
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
              onClick={resetListening}
              variant="outline"
              size="sm"
            >
              Reset
            </Button>
          </div>

          {/* Conversation Status */}
          {conversationState?.isActive && conversationState.currentStep && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
              <div className="flex items-center gap-2 mb-1">
                <Volume2 className="h-3 w-3 text-blue-600" />
                <span className="font-medium text-blue-700 dark:text-blue-300">System:</span>
              </div>
              <p className="text-blue-900 dark:text-blue-100">
                {conversationState.currentStep.question}
              </p>
            </div>
          )}

          {/* Transcript Display */}
          {transcript && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-muted-foreground">You said:</span>
              </div>
              <p className="text-foreground">"{transcript}"</p>
            </div>
          )}

          {/* Help Text */}
          {!isListening && !transcript && (
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