import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { toast } from 'sonner';

export const MicrophoneTest: React.FC = () => {
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>();

  const startMicTest = async () => {
    try {
      console.log('Starting microphone test...');
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      console.log('Microphone stream obtained:', stream);
      
      // Create audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioContext = audioContextRef.current;
      
      // Create analyser
      analyserRef.current = audioContext.createAnalyser();
      const analyser = analyserRef.current;
      analyser.fftSize = 256;
      
      // Connect microphone to analyser
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      console.log('Audio analysis setup complete');
      setIsTestingMic(true);
      toast.success('🎤 Microphone test started - speak now to see levels');
      
      // Start monitoring audio levels
      const monitorAudio = () => {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average);
        
        if (isTestingMic) {
          animationRef.current = requestAnimationFrame(monitorAudio);
        }
      };
      
      monitorAudio();
      
    } catch (error) {
      console.error('Microphone test failed:', error);
      toast.error(`Microphone test failed: ${error.message}`);
    }
  };

  const stopMicTest = () => {
    console.log('Stopping microphone test...');
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsTestingMic(false);
    setAudioLevel(0);
    toast.info('Microphone test stopped');
  };

  useEffect(() => {
    return () => {
      if (isTestingMic) {
        stopMicTest();
      }
    };
  }, []);

  const testSpeechRecognition = () => {
    console.log('Testing basic speech recognition...');
    
    // Stop any existing recognition first
    if ((window as any).__global_recognition) {
      console.log('Stopping existing recognition...');
      try {
        (window as any).__global_recognition.abort();
      } catch (e) {
        console.log('Stop existing recognition failed (expected):', e);
      }
      (window as any).__global_recognition = null;
    }
    
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error('Speech Recognition not supported in this browser');
      return;
    }
    
    const recognition = new SpeechRecognition();
    (window as any).__global_recognition = recognition; // Track globally
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      console.log('Basic speech recognition started');
      toast.success('🎤 Basic speech test started - say something!');
    };
    
    recognition.onresult = (event) => {
      console.log('Speech detected!', event);
      const transcript = event.results[0][0].transcript;
      toast.success(`✅ Speech detected: "${transcript}"`);
      recognition.stop();
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error, event);
      if (event.error !== 'aborted') {
        toast.error(`Speech recognition error: ${event.error}`);
      } else {
        console.log('Speech recognition was aborted (likely due to conflict)');
        toast.warning('Speech recognition was interrupted. Try again.');
      }
    };
    
    recognition.onend = () => {
      console.log('Basic speech recognition ended');
      (window as any).__global_recognition = null; // Clear global reference
    };
    
    try {
      recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      toast.error(`Failed to start: ${error.message}`);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Microphone Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Microphone Level Test */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">Microphone Level:</span>
            <span className="text-sm">{Math.round(audioLevel)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-100"
              style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
            />
          </div>
          {isTestingMic && (
            <p className="text-xs text-muted-foreground mt-1">
              {audioLevel > 10 ? '✅ Microphone working!' : '🔇 Speak louder...'}
            </p>
          )}
        </div>
        
        {/* Test Buttons */}
        <div className="space-y-2">
          <Button 
            onClick={isTestingMic ? stopMicTest : startMicTest}
            variant={isTestingMic ? "destructive" : "default"}
            className="w-full"
          >
            {isTestingMic ? (
              <>
                <MicOff className="h-4 w-4 mr-2" />
                Stop Mic Test
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Test Microphone
              </>
            )}
          </Button>
          
          <Button 
            onClick={testSpeechRecognition}
            variant="outline"
            className="w-full"
          >
            <Volume2 className="h-4 w-4 mr-2" />
            Test Speech Recognition
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground">
          <p className="font-medium">Troubleshooting:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Make sure microphone is not muted</li>
            <li>Check browser microphone permissions</li>
            <li>Try using Chrome browser</li>
            <li>Speak clearly and loudly</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};