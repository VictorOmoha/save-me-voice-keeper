import React, { useState, useEffect, useRef } from "react";
import { VoiceControlModal } from "./VoiceControlModal";
import { VoiceCommand, processVoiceCommand } from "@/utils/voiceCommandProcessor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Settings } from "lucide-react";
import { getElevenLabsApiKey, setElevenLabsApiKey } from "@/utils/textToSpeech";

interface VoiceInputProps {
  onVoiceResult: (text: string) => void;
  onVoiceCommand?: (command: VoiceCommand) => void;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onVoiceResult, onVoiceCommand }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const handleApiKeySetup = () => {
    const apiKey = prompt('Enter your ElevenLabs API key for voice responses (optional):');
    if (apiKey) {
      setElevenLabsApiKey(apiKey);
      alert('ElevenLabs API key saved! Voice responses will now use high-quality AI voices.');
    }
  };

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        console.log('Voice recognition started');
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const combinedTranscript = finalTranscript || interimTranscript;
        setTranscript(combinedTranscript);

        if (finalTranscript) {
          console.log('Final transcript:', finalTranscript);
          onVoiceResult(finalTranscript);
          
          // Process as voice command
          if (onVoiceCommand) {
            const command = processVoiceCommand(finalTranscript);
            setLastCommand(command);
            onVoiceCommand(command);
          }
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        console.log('Voice recognition ended');
      };
    }
  }, [onVoiceResult, onVoiceCommand]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript("");
      setLastCommand(null);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const handleVoiceModalClose = () => {
    setShowVoiceModal(false);
    stopListening();
  };

  if (!isSupported) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MicOff className="w-5 h-5" />
            Voice Input Not Supported
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Voice recognition is not supported in your browser. Please use Chrome, Edge, or Safari.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isListening ? (
              <Mic className="w-5 h-5 text-red-500" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
            Voice Control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isListening && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">Listening...</p>
              {transcript && (
                <p className="text-sm mt-1">{transcript}</p>
              )}
            </div>
          )}

          {lastCommand && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">Last command:</p>
              <p className="text-sm font-medium">{lastCommand.type}</p>
              <p className="text-xs text-muted-foreground">Parameters: {JSON.stringify(lastCommand.params || {})}</p>
            </div>
          )}

          <div className="flex gap-2">
            {isListening ? (
              <Button
                type="button"
                onClick={stopListening}
                variant="outline"
                className="flex-1"
              >
                <MicOff className="w-4 h-4 mr-2" />
                Stop
              </Button>
            ) : (
              <Button
                type="button"
                onClick={startListening}
                className="flex-1 bg-gradient-primary hover:opacity-90 text-primary-foreground"
              >
                <Mic className="w-4 h-4 mr-2" />
                Start Listening
              </Button>
            )}
            
            <Button
              type="button"
              onClick={() => setShowVoiceModal(true)}
              variant="outline"
              size="icon"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          {!getElevenLabsApiKey() && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground mb-2">
                Enhance your experience with premium AI voices
              </p>
              <Button
                onClick={handleApiKeySetup}
                variant="outline"
                size="sm"
              >
                Setup ElevenLabs API
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

    </>
  );
};