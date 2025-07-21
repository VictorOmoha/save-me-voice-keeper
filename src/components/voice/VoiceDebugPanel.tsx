
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { speechRecognition } from '@/utils/speechRecognitionSingleton';

export const VoiceDebugPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    isListening: false,
    isTTSSpeaking: false,
    lastTranscript: '',
    commandCount: 0,
    lastCommand: '',
    lastCommandTime: '',
  });

  useEffect(() => {
    const updateDebugInfo = () => {
      setDebugInfo({
        isListening: speechRecognition.isCurrentlyListening(),
        isTTSSpeaking: !!(window as any).__tts_is_speaking,
        lastTranscript: (window as any).__last_transcript || '',
        commandCount: (window as any).__command_count || 0,
        lastCommand: (window as any).__last_command || '',
        lastCommandTime: (window as any).__last_command_time || '',
      });
    };

    // Update every second
    const interval = setInterval(updateDebugInfo, 1000);
    
    // Listen for voice events
    const handleTranscriptUpdate = (event: CustomEvent) => {
      (window as any).__last_transcript = event.detail.transcript;
    };

    const handleCommandProcessed = (event: CustomEvent) => {
      (window as any).__command_count = ((window as any).__command_count || 0) + 1;
      (window as any).__last_command = event.detail.command;
      (window as any).__last_command_time = event.detail.timestamp;
    };

    window.addEventListener('voice-transcript-update', handleTranscriptUpdate as EventListener);
    window.addEventListener('voice-command-processed', handleCommandProcessed as EventListener);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('voice-transcript-update', handleTranscriptUpdate as EventListener);
      window.removeEventListener('voice-command-processed', handleCommandProcessed as EventListener);
    };
  }, []);

  if (!isVisible) {
    return (
      <Button 
        onClick={() => setIsVisible(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50"
      >
        Debug Voice
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          Voice Debug Panel
          <Button onClick={() => setIsVisible(false)} variant="ghost" size="sm">✕</Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <span>Recognition:</span>
          <Badge variant={debugInfo.isListening ? "default" : "secondary"}>
            {debugInfo.isListening ? "Listening" : "Stopped"}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <span>TTS:</span>
          <Badge variant={debugInfo.isTTSSpeaking ? "destructive" : "secondary"}>
            {debugInfo.isTTSSpeaking ? "Speaking" : "Silent"}
          </Badge>
        </div>
        
        <div>
          <span className="font-medium">Commands:</span> {debugInfo.commandCount}
        </div>
        
        {debugInfo.lastTranscript && (
          <div>
            <span className="font-medium">Last Transcript:</span>
            <div className="bg-muted p-1 rounded text-xs">
              {debugInfo.lastTranscript}
            </div>
          </div>
        )}
        
        {debugInfo.lastCommand && (
          <div>
            <span className="font-medium">Last Command:</span>
            <div className="bg-muted p-1 rounded text-xs">
              {debugInfo.lastCommand} ({debugInfo.lastCommandTime})
            </div>
          </div>
        )}
        
        <div className="pt-2 border-t">
          <Button 
            onClick={() => speechRecognition.start()}
            size="sm"
            className="w-full mb-1"
          >
            Force Start Recognition
          </Button>
          <Button 
            onClick={() => speechRecognition.stop()}
            size="sm"
            variant="outline"
            className="w-full"
          >
            Stop Recognition
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
