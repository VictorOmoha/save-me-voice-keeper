
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
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const lastProcessedCommandRef = useRef<string>('');
  const commandCounterRef = useRef<number>(0);
  const processedTranscriptRef = useRef<string>('');

  const addDebugInfo = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const debugMessage = `[${timestamp}] ${message}`;
    console.log('🧪 DIAGNOSTIC:', debugMessage);
    setDebugInfo(prev => [...prev.slice(-4), debugMessage]);
  };

  const startVoiceRecognition = () => {
    console.log('🧪 DIAGNOSTIC: Starting segmented voice recognition...');
    addDebugInfo('Starting segmented voice recognition...');
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      const errorMsg = '❌ Speech recognition not supported in this browser';
      console.log(errorMsg);
      addDebugInfo(errorMsg);
      toast.error('Speech recognition not supported');
      onVoiceError?.(errorMsg);
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.abort();
      addDebugInfo('Stopped existing recognition');
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('✅ DIAGNOSTIC: Voice recognition started');
      addDebugInfo('Voice recognition started successfully');
      setIsListening(true);
      onVoiceStart?.();
      toast.success('🎤 Diagnostic listening started - speak individual commands!');
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
        // Segment commands from the final text
        const newText = finalText.startsWith(processedTranscriptRef.current) 
          ? finalText.substring(processedTranscriptRef.current.length).trim()
          : finalText;
        
        if (!newText) return;
        
        // Split into individual commands
        const commands = newText.split(/[.!?]+/)
          .map(s => s.trim())
          .filter(s => s.length > 2)
          .filter(s => !s.toLowerCase().includes('this is a test'));
        
        if (commands.length === 0) return;
        
        addDebugInfo(`Found ${commands.length} commands: ${commands.join(', ')}`);
        processedTranscriptRef.current = finalText;
        
        // Process each command
        commands.forEach((commandText, index) => {
          setTimeout(() => {
            const commandNum = ++commandCounterRef.current;
            console.log(`🎯 DIAGNOSTIC: Processing command ${commandNum}:`, commandText);
            addDebugInfo(`Command ${commandNum}: "${commandText}"`);
            
            // Add to command history
            setCommandHistory(prev => [...prev.slice(-4), `${commandNum}: ${commandText}`]);
            
            // Process the voice command
            const command = processVoiceCommand(commandText);
            console.log(`🎯 DIAGNOSTIC: Processed command ${commandNum}:`, command);
            addDebugInfo(`Processed as: ${command.type}`);
            
            // Send to parent component for processing
            if (onVoiceCommand) {
              console.log(`🎯 DIAGNOSTIC: Executing command ${commandNum}`);
              addDebugInfo(`Executing command ${commandNum}`);
              onVoiceCommand(commandText);
            }
            
            // Show command feedback
            if (command.type !== 'unknown') {
              toast.success(`✅ Command ${commandNum}: ${command.type.replace('_', ' ')}`);
            } else {
              toast.info(`📝 Command ${commandNum}: "${commandText}"`);
            }
          }, index * 300); // Stagger command processing
        });
        
        // Clear transcript after processing
        setTimeout(() => {
          setLastHeard('');
          addDebugInfo(`Ready for next commands after batch`);
        }, commands.length * 300 + 1000);
      }
    };

    recognition.onerror = (event) => {
      console.error('❌ DIAGNOSTIC: Recognition error:', event.error);
      addDebugInfo(`ERROR: ${event.error}`);
      
      switch (event.error) {
        case 'no-speech':
          addDebugInfo('No speech detected - continuing...');
          break;
        case 'not-allowed':
          toast.error('Microphone access denied. Please allow microphone access.');
          onVoiceError?.(`Microphone access denied: ${event.error}`);
          setIsListening(false);
          addDebugInfo('Microphone access denied');
          break;
        case 'network':
          toast.error('Network error. Retrying...');
          addDebugInfo('Network error - will retry');
          setTimeout(() => {
            if (isListening && recognitionRef.current) {
              try {
                recognitionRef.current.start();
                addDebugInfo('Auto-restart attempted');
              } catch (e) {
                console.log('Auto-restart failed:', e);
                addDebugInfo('Auto-restart failed');
              }
            }
          }, 2000);
          break;
        default:
          if (!['no-speech', 'aborted'].includes(event.error)) {
            toast.error(`Voice recognition error: ${event.error}`);
            onVoiceError?.(`Recognition error: ${event.error}`);
            addDebugInfo(`Unhandled error: ${event.error}`);
          }
          break;
      }
    };

    recognition.onend = () => {
      console.log('🔚 DIAGNOSTIC: Voice recognition ended');
      addDebugInfo('Voice recognition ended - attempting restart');
      
      if (isListening) {
        setTimeout(() => {
          try {
            if (recognitionRef.current && isListening) {
              console.log('🔄 DIAGNOSTIC: Auto-restarting for continuous listening...');
              addDebugInfo('Auto-restarting recognition');
              recognitionRef.current.start();
            }
          } catch (error) {
            console.log('Auto-restart failed:', error);
            addDebugInfo('Auto-restart failed - click Start to resume');
            if (!error.message.includes('already started')) {
              toast.info('Voice recognition stopped. Click "Start" to continue.');
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
      addDebugInfo('Recognition start attempted');
    } catch (error) {
      console.error('❌ DIAGNOSTIC: Failed to start recognition:', error);
      addDebugInfo(`Failed to start: ${error.message}`);
      toast.error('Failed to start voice recognition');
      onVoiceError?.(`Failed to start: ${error.message}`);
    }
  };

  const stopVoiceRecognition = () => {
    console.log('🛑 DIAGNOSTIC: Stopping voice recognition');
    addDebugInfo('Stopping voice recognition');
    setIsListening(false);
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    onVoiceEnd?.();
    toast.info(`Voice recognition stopped. Processed ${commandCounterRef.current} commands.`);
  };

  const clearDiagnostics = () => {
    setDebugInfo([]);
    setCommandHistory([]);
    setLastHeard('');
    commandCounterRef.current = 0;
    lastProcessedCommandRef.current = '';
    processedTranscriptRef.current = '';
    addDebugInfo('Diagnostics cleared - ready for segmented commands');
  };

  return (
    <Card className="w-full max-w-md border-blue-200">
      <CardHeader>
        <CardTitle className="text-blue-600 flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Voice Diagnostic Tool (Segmented)
          {isListening && <span className="text-green-500 text-sm">(Active)</span>}
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
              Start Segmented Listening
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
          
          <Button 
            onClick={clearDiagnostics} 
            variant="outline"
            size="sm"
            className="w-full"
          >
            Clear Diagnostics
          </Button>
        </div>

        {/* Status indicator */}
        {isListening && (
          <div className="flex items-center justify-center gap-2 p-2 bg-green-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-700 text-sm font-medium">
              Active - Commands processed: {commandCounterRef.current}
            </span>
          </div>
        )}

        {/* Current transcript */}
        {lastHeard && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900">Current Input:</p>
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
                  {cmd}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Debug info */}
        {debugInfo.length > 0 && (
          <div className="p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm font-medium text-yellow-900 mb-2">Debug Log:</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {debugInfo.map((info, index) => (
                <p key={index} className="text-yellow-800 text-xs font-mono">
                  {info}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Test commands */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Test Commands (speak separately):</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>"open insurance"</strong></li>
            <li><strong>"create new entry"</strong></li>
            <li><strong>"show all entries"</strong></li>
          </ul>
          <p className="text-orange-600 font-medium">Note: Speak each command separately and clearly</p>
        </div>
      </CardContent>
    </Card>
  );
};
