import React, { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SimpleVoiceProcessor, SimpleVoiceCommand } from '@/utils/simpleVoiceProcessor';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface SimpleVoiceCommandProps {
  onCommand: (command: SimpleVoiceCommand) => void;
  isActive?: boolean;
}

export const SimpleVoiceCommandInterface: React.FC<SimpleVoiceCommandProps> = ({
  onCommand,
  isActive = true,
}) => {
  const [isListening, setIsListening] = useState(false);
  const processor = new SimpleVoiceProcessor();

  const {
    isListening: speechIsListening,
    transcript,
    startListening,
    stopListening,
  } = useSpeechRecognition({});

  useEffect(() => {
    if (transcript && transcript.trim()) {
      console.log('🎯 SimpleVoiceCommand: Processing transcript:', transcript);
      const command = processor.processCommand(transcript);
      if (command.type !== 'unknown' && command.confidence > 0.5) {
        console.log('🎯 SimpleVoiceCommand: Executing command:', command);
        onCommand(command);
      }
    }
  }, [transcript, onCommand]);

  const handleToggleListening = () => {
    if (speechIsListening) {
      stopListening();
      setIsListening(false);
    } else {
      startListening();
      setIsListening(true);
    }
  };

  if (!isActive) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant={speechIsListening ? "destructive" : "default"}
        size="sm"
        onClick={handleToggleListening}
        className="transition-all duration-200"
      >
        {speechIsListening ? (
          <>
            <MicOff className="h-4 w-4 mr-2" />
            Stop Listening
          </>
        ) : (
          <>
            <Mic className="h-4 w-4 mr-2" />
            Voice Commands
          </>
        )}
      </Button>
      
      {speechIsListening && (
        <div className="text-sm text-muted-foreground animate-pulse">
          Listening for commands...
        </div>
      )}
    </div>
  );
};