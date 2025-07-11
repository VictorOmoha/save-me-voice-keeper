
import React, { useState, useEffect, useRef } from "react";
import { VoiceControlModal } from "./VoiceControlModal";
import { VoiceSettingsModal } from "./VoiceSettingsModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Settings } from "lucide-react";
import { getElevenLabsApiKey } from "@/utils/textToSpeech";

interface VoiceInputProps {
  onEnhancedVoiceInput?: (text: string) => void;
  onVoiceResult?: (text: string) => void; // Keep for backward compatibility but won't use both
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ 
  onEnhancedVoiceInput, 
  onVoiceResult 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

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
          
          // Use enhanced voice input if available, otherwise fall back to legacy
          if (onEnhancedVoiceInput) {
            console.log('Using enhanced voice processing');
            onEnhancedVoiceInput(finalTranscript);
          } else if (onVoiceResult) {
            console.log('Using legacy voice processing');
            onVoiceResult(finalTranscript);
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
  }, [onEnhancedVoiceInput, onVoiceResult]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript("");
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
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
                variant="default"
                className="flex-1"
              >
                <Mic className="w-4 h-4 mr-2" />
                Start Listening
              </Button>
            )}
            
            <Button
              type="button"
              onClick={() => setShowSettingsModal(true)}
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
                onClick={() => setShowSettingsModal(true)}
                variant="outline"
                size="sm"
              >
                Configure Voice Settings
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <VoiceSettingsModal 
        isOpen={showSettingsModal}
        onOpenChange={setShowSettingsModal}
      />
    </>
  );
};
