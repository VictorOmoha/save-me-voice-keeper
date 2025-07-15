
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff } from "lucide-react";
import { toast } from 'sonner';
import { processVoiceCommand } from "@/utils/voiceCommandProcessor";

interface VoiceDiagnosticProps {
  onVoiceCommand?: (transcript: string) => void;
  onVoiceError?: (error: string) => void;
  onVoiceStart?: () => void;
  onVoiceEnd?: () => void;
}

export const VoiceDiagnostic: React.FC<VoiceDiagnosticProps> = ({ 
  onVoiceCommand,
  onVoiceError,
  onVoiceStart,
  onVoiceEnd 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [lastHeard, setLastHeard] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startVoiceRecognition = () => {
    console.log('🧪 VOICE DIAGNOSTIC: Starting voice recognition...');
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      const errorMsg = '❌ Speech recognition not supported in this browser';
      console.log(errorMsg);
      toast.error('Speech recognition not supported');
      onVoiceError?.(errorMsg);
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    // Configure recognition for better command processing
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('✅ VOICE DIAGNOSTIC: Voice recognition started');
      setIsListening(true);
      onVoiceStart?.();
      toast.success('🎤 Voice recognition active - speak your command!');
    };

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        
        if (result.isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }
      
      const currentText = finalText || interimText;
      console.log('🎯 VOICE DIAGNOSTIC: Current text:', currentText);
      setLastHeard(currentText);
      
      if (finalText && finalText.trim().length > 0) {
        console.log('🎯 VOICE DIAGNOSTIC: Processing final command:', finalText);
        
        // Process the voice command
        const command = processVoiceCommand(finalText);
        console.log('🎯 VOICE DIAGNOSTIC: Processed command:', command);
        
        // Send to parent component for processing
        if (onVoiceCommand) {
          console.log('🎯 VOICE DIAGNOSTIC: Calling onVoiceCommand with:', finalText);
          onVoiceCommand(finalText);
        }
        
        // Show command feedback
        if (command.type !== 'unknown') {
          toast.success(`✅ Command recognized: ${command.type.replace('_', ' ')}`);
        } else {
          toast.info(`📝 Heard: "${finalText}" - processing...`);
        }
        
        // Clear transcript and restart for next command
        setTimeout(() => {
          setLastHeard('');
          if (isListening && recognitionRef.current) {
            try {
              console.log('🔄 VOICE DIAGNOSTIC: Restarting for next command...');
              recognitionRef.current.start();
            } catch (error) {
              console.log('🔄 Auto-restart failed:', error);
              // Don't spam with errors for expected restart failures
            }
          }
        }, 2000);
      }
    };

    recognition.onerror = (event) => {
      console.error('❌ VOICE DIAGNOSTIC: Recognition error:', event.error);
      const errorMsg = `Voice recognition error: ${event.error}`;
      
      // Handle different error types
      switch (event.error) {
        case 'no-speech':
          console.log('No speech detected - continuing to listen...');
          // Don't show error for no-speech, it's normal
          break;
        case 'not-allowed':
          toast.error('Microphone access denied. Please allow microphone access.');
          onVoiceError?.(errorMsg);
          setIsListening(false);
          break;
        case 'network':
          toast.error('Network error. Please check your connection.');
          onVoiceError?.(errorMsg);
          setIsListening(false);
          break;
        default:
          if (!['no-speech', 'aborted'].includes(event.error)) {
            toast.error(errorMsg);
            onVoiceError?.(errorMsg);
          }
          break;
      }
    };

    recognition.onend = () => {
      console.log('🔚 VOICE DIAGNOSTIC: Voice recognition ended');
      setIsListening(false);
      onVoiceEnd?.();
      
      // Auto-restart if still supposed to be listening
      if (isListening) {
        setTimeout(() => {
          try {
            if (recognitionRef.current && isListening) {
              console.log('🔄 VOICE DIAGNOSTIC: Auto-restarting recognition...');
              recognitionRef.current.start();
            }
          } catch (error) {
            console.log('Auto-restart failed:', error);
            toast.info('Voice recognition stopped. Click "Start Voice Commands" to continue.');
          }
        }, 1000);
      }
    };

    try {
      recognition.start();
    } catch (error) {
      console.error('❌ VOICE DIAGNOSTIC: Failed to start recognition:', error);
      toast.error('Failed to start voice recognition');
      onVoiceError?.(`Failed to start: ${error.message}`);
    }
  };

  const stopVoiceRecognition = () => {
    console.log('🛑 VOICE DIAGNOSTIC: Stopping voice recognition');
    setIsListening(false);
    
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    
    onVoiceEnd?.();
    toast.info('Voice recognition stopped');
  };

  return (
    <Card className="w-full max-w-md border-blue-200">
      <CardHeader>
        <CardTitle className="text-blue-600 flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Voice Commands
          {isListening && <span className="text-green-500 text-sm">(Listening...)</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-2">
          {!isListening ? (
            <Button 
              onClick={startVoiceRecognition} 
              className="w-full"
              size="lg"
            >
              <Mic className="h-4 w-4 mr-2" />
              Start Voice Commands
            </Button>
          ) : (
            <Button 
              onClick={stopVoiceRecognition} 
              variant="destructive"
              className="w-full"
              size="lg"
            >
              <MicOff className="h-4 w-4 mr-2" />
              Stop Listening
            </Button>
          )}
        </div>

        {/* Status indicator */}
        {isListening && (
          <div className="flex items-center justify-center gap-2 p-2 bg-green-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-700 text-sm font-medium">Listening for commands...</span>
          </div>
        )}

        {/* Last heard transcript */}
        {lastHeard && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900">Heard:</p>
            <p className="text-blue-700 font-mono text-sm">"{lastHeard}"</p>
          </div>
        )}

        {/* Command examples */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Try these commands:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>"Create new entry"</strong> - Opens new entry form</li>
            <li><strong>"Open insurance policy"</strong> - Opens specific entry</li>
            <li><strong>"Show all entries"</strong> - View all entries</li>
            <li><strong>"Delete medical records"</strong> - Delete with confirmation</li>
            <li><strong>"Close" / "Cancel"</strong> - Closes current form</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
