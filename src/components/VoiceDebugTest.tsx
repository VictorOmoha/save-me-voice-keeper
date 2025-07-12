import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff } from "lucide-react";
import { toast } from 'sonner';

export const VoiceDebugTest: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  const startSimpleTest = () => {
    console.log('=== STARTING SIMPLE VOICE TEST ===');
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error('Speech Recognition not supported');
      return;
    }

    // Stop any existing recognition
    if (recognition) {
      try {
        recognition.abort();
      } catch (e) {
        console.log('Stop existing recognition:', e);
      }
    }

    const newRecognition = new SpeechRecognition();
    
    // Minimal configuration for testing
    newRecognition.continuous = false;
    newRecognition.interimResults = true;
    newRecognition.lang = 'en-US';
    
    console.log('📋 Test configuration:', {
      continuous: newRecognition.continuous,
      interimResults: newRecognition.interimResults,
      lang: newRecognition.lang
    });

    newRecognition.onstart = () => {
      console.log('✅ Test recognition started');
      setIsListening(true);
      toast.success('🎤 Test started - say "HELLO" loudly!');
    };

    newRecognition.onresult = (event) => {
      console.log('🎉 SPEECH DETECTED IN TEST!', event);
      
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        console.log(`Test result ${i}:`, {
          transcript: result[0].transcript,
          confidence: result[0].confidence,
          isFinal: result.isFinal
        });
        
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      
      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);
      
      if (finalTranscript) {
        toast.success(`✅ SUCCESS: "${finalTranscript}"`);
        console.log('🎯 Final result:', finalTranscript);
      }
    };

    newRecognition.onerror = (event) => {
      console.error('❌ Test recognition error:', event.error, event);
      setIsListening(false);
      
      if (event.error === 'no-speech') {
        toast.warning('No speech detected - try speaking MUCH LOUDER');
      } else if (event.error === 'audio-capture') {
        toast.error('Microphone not detected - check microphone connection');
      } else if (event.error === 'not-allowed') {
        toast.error('Microphone access denied - check browser permissions');
      } else {
        toast.error(`Test error: ${event.error}`);
      }
    };

    newRecognition.onend = () => {
      console.log('🔚 Test recognition ended');
      setIsListening(false);
      toast.info('Test ended');
    };

    try {
      console.log('🚀 Starting test recognition...');
      newRecognition.start();
      setRecognition(newRecognition);
    } catch (error) {
      console.error('Failed to start test:', error);
      toast.error(`Failed to start test: ${error.message}`);
    }
  };

  const stopTest = () => {
    if (recognition) {
      recognition.stop();
      setRecognition(null);
    }
    setIsListening(false);
  };

  const resetTest = () => {
    if (recognition) {
      recognition.abort();
      setRecognition(null);
    }
    setIsListening(false);
    setTranscript('');
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Voice Debug Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="text-center">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            isListening ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          }`}>
            {isListening ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Listening...
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                Ready
              </>
            )}
          </div>
        </div>

        {/* Transcript Display */}
        {transcript && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-700">Detected:</p>
            <p className="text-blue-600">"{transcript}"</p>
          </div>
        )}

        {/* Controls */}
        <div className="space-y-2">
          {!isListening ? (
            <Button onClick={startSimpleTest} className="w-full">
              <Mic className="h-4 w-4 mr-2" />
              Start Simple Test
            </Button>
          ) : (
            <Button onClick={stopTest} variant="destructive" className="w-full">
              <MicOff className="h-4 w-4 mr-2" />
              Stop Test
            </Button>
          )}
          
          <Button onClick={resetTest} variant="outline" className="w-full">
            Reset
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Test Instructions:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Click "Start Simple Test"</li>
            <li>When prompted, allow microphone access</li>
            <li>Say "HELLO" very loudly and clearly</li>
            <li>Check console for detailed logs</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};