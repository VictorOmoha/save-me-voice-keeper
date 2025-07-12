import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Square } from "lucide-react";
import { toast } from 'sonner';
import { processVoiceCommand } from "@/utils/voiceCommandProcessor";

interface SimpleVoiceComponentProps {
  onEnhancedVoiceInput?: (text: string) => void;
}

export const SimpleVoiceComponent: React.FC<SimpleVoiceComponentProps> = ({
  onEnhancedVoiceInput
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isInitializedRef = useRef(false);

  const initializeRecognition = () => {
    if (isInitializedRef.current) return recognitionRef.current;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error('Speech Recognition not supported in this browser');
      return null;
    }

    // Clean up any existing recognition
    if ((window as any).__global_simple_recognition) {
      try {
        (window as any).__global_simple_recognition.abort();
      } catch (e) {
        console.log('Cleaned up existing recognition');
      }
    }

    const recognition = new SpeechRecognition();
    (window as any).__global_simple_recognition = recognition;
    
    // Simple configuration that works
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('✅ Simple voice started');
      setIsListening(true);
      toast.success('🎤 Listening... Say "CREATE NEW ENTRY"');
    };

    recognition.onresult = (event) => {
      console.log('🎯 Simple voice detected speech!', event);
      
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        
        console.log(`Simple result ${i}:`, {
          text: `"${text}"`,
          isFinal: result.isFinal,
          confidence: result[0].confidence
        });
        
        if (result.isFinal) {
          finalTranscript += text;
        } else {
          interimTranscript += text;
        }
      }
      
      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);
      
      if (finalTranscript) {
        console.log('🎉 Processing final transcript:', finalTranscript);
        
        // Process the command
        const command = processVoiceCommand(finalTranscript);
        console.log('📋 Processed command:', command);
        
        // Call the handler
        if (onEnhancedVoiceInput) {
          onEnhancedVoiceInput(finalTranscript);
        }
        
        // Show success feedback
        if (command.type !== 'unknown') {
          toast.success(`✅ Command: ${command.type.replace('_', ' ')}`);
        } else {
          toast.info(`📝 Heard: "${finalTranscript}"`);
        }
        
        // Auto-stop and allow restart
        setTimeout(() => {
          setTranscript('');
          setIsListening(false);
          toast.info('Ready for next command!');
        }, 2000);
      }
    };

    recognition.onerror = (event) => {
      console.error('❌ Simple voice error:', event.error);
      setIsListening(false);
      
      if (event.error === 'no-speech') {
        toast.warning('No speech detected - try speaking louder');
      } else if (event.error === 'not-allowed') {
        toast.error('Microphone access denied');
      } else {
        toast.error(`Voice error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      console.log('🔚 Simple voice ended');
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    isInitializedRef.current = true;
    return recognition;
  };

  const startListening = () => {
    console.log('🚀 Starting simple voice...');
    
    const recognition = initializeRecognition();
    if (!recognition) return;

    if (isListening) {
      console.log('Already listening, ignoring');
      return;
    }

    try {
      setTranscript('');
      recognition.start();
      console.log('Simple voice start() called');
    } catch (error) {
      console.error('Failed to start simple voice:', error);
      toast.error(`Failed to start: ${error.message}`);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      toast.info('Voice stopped');
    }
  };

  const resetVoice = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    setIsListening(false);
    setTranscript('');
    isInitializedRef.current = false;
    recognitionRef.current = null;
    (window as any).__global_simple_recognition = null;
    toast.info('Voice reset');
  };

  return (
    <Card className={`w-full ${isListening ? 'border-green-500 border-2' : ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Simple Voice Commands
          {isListening && (
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="text-center">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            isListening ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          }`}>
            {isListening ? 'Listening for commands...' : 'Ready to listen'}
          </div>
        </div>

        {/* Transcript */}
        {transcript && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600">"{transcript}"</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {!isListening ? (
            <Button onClick={startListening} className="flex-1">
              <Mic className="h-4 w-4 mr-2" />
              Start Voice Commands
            </Button>
          ) : (
            <Button onClick={stopListening} variant="destructive" className="flex-1">
              <Square className="h-4 w-4 mr-2" />
              Stop Listening
            </Button>
          )}
          
          <Button onClick={resetVoice} variant="outline">
            Reset
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground">
          <p className="font-medium">Try saying:</p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>"CREATE NEW ENTRY"</li>
            <li>"SHOW ALL ENTRIES"</li>
            <li>"HELLO WORLD"</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};