import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic } from "lucide-react";
import { toast } from 'sonner';
import { processVoiceCommand } from "@/utils/voiceCommandProcessor";

interface VoiceDiagnosticProps {
  onVoiceCommand?: (transcript: string) => void;
}

export const VoiceDiagnostic: React.FC<VoiceDiagnosticProps> = ({ onVoiceCommand }) => {
  const [isListening, setIsListening] = useState(false);
  const [lastHeard, setLastHeard] = useState('');

  const testVoice = () => {
    console.log('🧪 VOICE COMMAND: Starting voice command system...');
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.log('❌ VOICE COMMAND: No speech recognition');
      toast.error('Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;  // Changed to false - process one command at a time
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('✅ VOICE COMMAND: Listening for commands...');
      setIsListening(true);
      toast.success('🎤 Say "CREATE NEW ENTRY" or any command!');
    };

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }
      
      const currentText = finalText || interimText;
      console.log('🎯 VOICE COMMAND: Current text:', currentText);
      setLastHeard(currentText);
      
      if (finalText) {
        console.log('🎯 VOICE COMMAND: Final text:', finalText);
        
        // Process the voice command
        const command = processVoiceCommand(finalText);
        console.log('🎯 VOICE COMMAND: Processed command:', command);
        
        // Send to parent component (VoiceInputFixed)
        if (onVoiceCommand) {
          console.log('🎯 VOICE COMMAND: Calling onVoiceCommand with:', finalText);
          onVoiceCommand(finalText);
        }
        
        // Show command feedback
        if (command.type !== 'unknown') {
          toast.success(`✅ Command: ${command.type.replace('_', ' ')}`);
        } else {
          toast.info(`📝 Heard: "${finalText}"`);
        }
      }
    };

    recognition.onerror = (event) => {
      console.log('❌ VOICE COMMAND: Error:', event.error);
      setIsListening(false);
      toast.error(`Error: ${event.error}`);
    };

    recognition.onend = () => {
      console.log('🔚 VOICE COMMAND: Voice ended');
      // Only auto-restart if still supposed to be listening and not manually stopped
      if (isListening) {
        setTimeout(() => {
          try {
            console.log('🔄 VOICE COMMAND: Auto-restarting for next command...');
            recognition.start();
          } catch (error) {
            console.log('Auto-restart failed:', error.message);
            setIsListening(false);
            toast.info('Voice ended. Click "Start Voice Commands" to continue.');
          }
        }, 1000);
      }
    };

    try {
      recognition.start();
    } catch (error) {
      console.log('❌ VOICE COMMAND: Start failed:', error);
      toast.error('Failed to start');
    }
  };

  const stopVoice = () => {
    setIsListening(false);
    toast.info('Voice commands stopped');
  };

  return (
    <Card className="w-full max-w-md border-blue-200">
      <CardHeader>
        <CardTitle className="text-blue-600">🎤 Voice Commands (Working)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-2">
          <Button 
            onClick={testVoice} 
            disabled={isListening}
            className="w-full"
          >
            <Mic className="h-4 w-4 mr-2" />
            {isListening ? 'Listening for Commands...' : 'Start Voice Commands'}
          </Button>
          
          {isListening && (
            <Button 
              onClick={stopVoice} 
              variant="outline"
              className="w-full"
            >
              Stop Listening
            </Button>
          )}
        </div>

        {lastHeard && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium">Last heard:</p>
            <p className="text-blue-700">"{lastHeard}"</p>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p className="font-medium">Try these commands:</p>
          <ul className="list-disc list-inside">
            <li><strong>"CREATE NEW ENTRY"</strong> - Opens new entry form</li>
            <li><strong>"TITLE MY DOCUMENT"</strong> - Sets title when form is open</li>
            <li><strong>"ADD FIELD NAME"</strong> - Adds a field called "Name"</li>
            <li><strong>"CREATE FIELD EMAIL"</strong> - Adds an email field</li>
            <li><strong>"SHOW ALL ENTRIES"</strong> - Shows all entries</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};