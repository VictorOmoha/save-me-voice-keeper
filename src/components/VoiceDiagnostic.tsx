
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
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startVoiceRecognition = () => {
    console.log('🧪 VOICE DIAGNOSTIC: Starting continuous voice recognition...');
    
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
    
    // Configure for continuous listening
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('✅ VOICE DIAGNOSTIC: Continuous voice recognition started');
      setIsListening(true);
      onVoiceStart?.();
      toast.success('🎤 Listening continuously - speak multiple commands!');
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
      setLastHeard(currentText);
      
      if (finalText && finalText.trim().length > 0) {
        console.log('🎯 VOICE DIAGNOSTIC: Processing command:', finalText);
        
        // Add to command history
        setCommandHistory(prev => [...prev.slice(-4), finalText]);
        
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
          toast.success(`✅ Command ${commandHistory.length + 1}: ${command.type.replace('_', ' ')}`);
        } else {
          toast.info(`📝 Heard: "${finalText}" - processing...`);
        }
        
        // Clear transcript and restart for next command
        setTimeout(() => {
          setLastHeard('');
        }, 2000);
      }
    };

    recognition.onerror = (event) => {
      console.error('❌ VOICE DIAGNOSTIC: Recognition error:', event.error);
      
      // Handle different error types
      switch (event.error) {
        case 'no-speech':
          console.log('No speech detected - continuing to listen...');
          // Don't show error for no-speech, it's normal for continuous listening
          break;
        case 'not-allowed':
          toast.error('Microphone access denied. Please allow microphone access.');
          onVoiceError?.(`Microphone access denied: ${event.error}`);
          setIsListening(false);
          break;
        case 'network':
          toast.error('Network error. Retrying...');
          // Try to restart after a brief delay
          setTimeout(() => {
            if (isListening && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.log('Auto-restart failed:', e);
              }
            }
          }, 2000);
          break;
        default:
          if (!['no-speech', 'aborted'].includes(event.error)) {
            toast.error(`Voice recognition error: ${event.error}`);
            onVoiceError?.(`Recognition error: ${event.error}`);
          }
          break;
      }
    };

    recognition.onend = () => {
      console.log('🔚 VOICE DIAGNOSTIC: Voice recognition ended, restarting for continuous listening...');
      
      // Auto-restart for continuous listening unless manually stopped
      if (isListening) {
        setTimeout(() => {
          try {
            if (recognitionRef.current && isListening) {
              console.log('🔄 VOICE DIAGNOSTIC: Auto-restarting for continuous listening...');
              recognitionRef.current.start();
            }
          } catch (error) {
            console.log('Auto-restart failed:', error);
            // If restart fails, show message but don't spam with errors
            if (!error.message.includes('already started')) {
              toast.info('Voice recognition stopped. Click "Start Voice Commands" to continue.');
              setIsListening(false);
              onVoiceEnd?.();
            }
          }
        }, 500);
      } else {
        onVoiceEnd?.();
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
    console.log('🛑 VOICE DIAGNOSTIC: Stopping continuous voice recognition');
    setIsListening(false);
    
    if (recognitionRef.current) {
      recognitionRef.current.stop(); // Use stop() instead of abort() for graceful shutdown
      recognitionRef.current = null;
    }
    
    onVoiceEnd?.();
    toast.info(`Voice recognition stopped. Processed ${commandHistory.length} commands.`);
  };

  return (
    <Card className="w-full max-w-md border-blue-200">
      <CardHeader>
        <CardTitle className="text-blue-600 flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Continuous Voice Commands
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
              Start Continuous Voice Commands
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
            <span className="text-green-700 text-sm font-medium">
              Listening continuously for commands... ({commandHistory.length} processed)
            </span>
          </div>
        )}

        {/* Last heard transcript */}
        {lastHeard && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900">Current:</p>
            <p className="text-blue-700 font-mono text-sm">"{lastHeard}"</p>
          </div>
        )}

        {/* Command history */}
        {commandHistory.length > 0 && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-900 mb-2">Recent Commands:</p>
            <div className="space-y-1">
              {commandHistory.slice(-3).map((cmd, index) => (
                <p key={index} className="text-gray-700 text-xs font-mono">
                  {commandHistory.length - 2 + index}: "{cmd}"
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Command examples */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Try multiple commands in sequence:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>"Create new entry"</strong> → <strong>"Open insurance"</strong></li>
            <li><strong>"Show all entries"</strong> → <strong>"Delete old files"</strong></li>
            <li><strong>"Create medical record"</strong> → <strong>"Save entry"</strong></li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
