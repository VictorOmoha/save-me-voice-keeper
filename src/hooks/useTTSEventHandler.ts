
import React, { useEffect, useRef } from 'react';
import { speechRecognition } from '@/utils/speechRecognitionSingleton';

interface UseTTSEventHandlerProps {
  conversationState?: { isActive: boolean; currentStep?: { question: string } };
  isListening: boolean;
  recognitionRef: React.MutableRefObject<SpeechRecognition | null>;
  setIsListening?: (value: boolean) => void;
}

export const useTTSEventHandler = ({
  conversationState,
  isListening,
  recognitionRef,
  setIsListening = () => {},
}: UseTTSEventHandlerProps) => {
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
const handleTTSCompleted = async (event: CustomEvent) => {
      // Mark TTS finished
      (window as any).__tts_is_speaking = false;
      (window as any).__last_tts_end_time = Date.now();

      console.log('🔊 TTS Event Handler: TTS completed');

      // Clear any existing restart timeout
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }

      if (conversationState?.isActive) {
        // Give a small grace period before restarting to avoid feedback
        restartTimeoutRef.current = setTimeout(() => {
          try {
            speechRecognition.start();
          } catch (e) {
            console.log('TTS Event Handler: start after TTS failed', e);
          }
        }, 500);
      }
    };

const handleTTSStarted = () => {
      console.log('🔊 TTS Event Handler: TTS started - ensuring recognition is paused');
      (window as any).__tts_is_speaking = true;
      try {
        speechRecognition.stop();
        console.log('🛑 TTS Event Handler: Stopped recognition due to TTS start');
      } catch (error) {
        console.log('Error stopping recognition on TTS start:', error);
      }
    };

    window.addEventListener('tts-completed', handleTTSCompleted as EventListener);
    window.addEventListener('tts-started', handleTTSStarted as EventListener);
    
    return () => {
      window.removeEventListener('tts-completed', handleTTSCompleted as EventListener);
      window.removeEventListener('tts-started', handleTTSStarted as EventListener);
      
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
    };
  }, [conversationState?.isActive, isListening, recognitionRef, setIsListening]);
};
