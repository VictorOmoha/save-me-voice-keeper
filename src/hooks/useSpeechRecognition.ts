import { useEffect, useState, useRef } from 'react';
import { VoiceCommand } from "@/utils/voiceCommandProcessor";
import { useTTSEventHandler } from './useTTSEventHandler';
import { useSpeechRecognitionControls } from './useSpeechRecognitionControls';
import { setupSpeechRecognition } from '@/utils/speechRecognitionSetup';

interface UseSpeechRecognitionProps {
  onVoiceCommand?: (command: VoiceCommand) => void;
  onEnhancedVoiceInput?: (text: string) => void;
  conversationState?: { isActive: boolean; currentStep?: { question: string } };
}

export const useSpeechRecognition = ({
  onVoiceCommand,
  onEnhancedVoiceInput,
  conversationState,
}: UseSpeechRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [lastProcessedTranscript, setLastProcessedTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Handle TTS completion events
  useTTSEventHandler({
    conversationState,
    isListening,
    recognitionRef,
    setIsListening,
  });

  // Set up speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      
      const recognition = setupSpeechRecognition({
        onVoiceCommand,
        onEnhancedVoiceInput,
        conversationState,
        setIsListening,
        setTranscript,
        lastProcessedTranscript,
        setLastProcessedTranscript,
        recognitionRef,
      });
      
      if (recognition) {
        recognitionRef.current = recognition;
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onVoiceCommand, onEnhancedVoiceInput, lastProcessedTranscript, conversationState?.isActive]);

  // Get control methods
  const controls = useSpeechRecognitionControls({
    isSupported,
    isListening,
    recognitionRef,
    setTranscript,
    setLastProcessedTranscript,
    setIsListening,
  });

  return {
    isListening,
    transcript,
    isSupported,
    ...controls,
  };
};