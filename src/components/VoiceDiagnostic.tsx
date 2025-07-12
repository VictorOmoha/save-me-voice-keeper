import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic } from "lucide-react";
import { toast } from 'sonner';

export const VoiceDiagnostic: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [lastHeard, setLastHeard] = useState('');

  const testVoice = () => {
    console.log('🧪 DIAGNOSTIC: Starting voice test...');
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.log('❌ DIAGNOSTIC: No speech recognition');
      toast.error('Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('✅ DIAGNOSTIC: Voice started');
      setIsListening(true);
      toast.success('🎤 Say something now!');
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      console.log('🎯 DIAGNOSTIC: Heard:', text);
      setLastHeard(text);
      toast.success(`Heard: "${text}"`);
      
      // Test the processing
      if (text.toLowerCase().includes('test')) {
        console.log('✅ DIAGNOSTIC: Test word detected!');
        toast.success('✅ Test word detected!');
      }
      
      if (text.toLowerCase().includes('title') || text.toLowerCase().includes('call')) {
        console.log('✅ DIAGNOSTIC: Title-like word detected!');
        toast.success('✅ Title command detected!');
      }
    };

    recognition.onerror = (event) => {
      console.log('❌ DIAGNOSTIC: Error:', event.error);
      setIsListening(false);
      toast.error(`Error: ${event.error}`);
    };

    recognition.onend = () => {
      console.log('🔚 DIAGNOSTIC: Voice ended');
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (error) {
      console.log('❌ DIAGNOSTIC: Start failed:', error);
      toast.error('Failed to start');
    }
  };

  return (
    <Card className="w-full max-w-md border-red-200">
      <CardHeader>
        <CardTitle className="text-red-600">🧪 Voice Diagnostic</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <Button 
            onClick={testVoice} 
            disabled={isListening}
            className="w-full"
          >
            <Mic className="h-4 w-4 mr-2" />
            {isListening ? 'Listening...' : 'Test Voice'}
          </Button>
        </div>

        {lastHeard && (
          <div className="p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm font-medium">Last heard:</p>
            <p className="text-yellow-700">"{lastHeard}"</p>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p className="font-medium">Test by saying:</p>
          <ul className="list-disc list-inside">
            <li>"TEST" - Should trigger test detection</li>
            <li>"TITLE MY DOCUMENT" - Should trigger title detection</li>
            <li>"CALL IT HELLO" - Should trigger title detection</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};