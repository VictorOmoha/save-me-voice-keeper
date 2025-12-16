
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
  // Track if voice was active before TTS started
  const wasActiveBeforeTTSRef = useRef<boolean>(false);

  useEffect(() => {
const handleTTSCompleted = async (event: CustomEvent) => {
      // Mark TTS finished
      (window as any).__tts_is_speaking = false;
      (window as any).__last_tts_end_time = Date.now();
      // CRITICAL: Clear manual stop flag so recognition can restart
      (window as any).__manual_stop = false;

      console.log('🔊 TTS Event Handler: TTS completed, manual_stop cleared, wasActive:', wasActiveBeforeTTSRef.current);

      // Clear any existing restart timeout
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }

      // Restart if conversation is active OR if voice was active before TTS started
      if (conversationState?.isActive || wasActiveBeforeTTSRef.current) {
        // Give a small grace period before restarting to avoid feedback
        restartTimeoutRef.current = setTimeout(() => {
          try {
            // Ensure manual_stop is still false before starting
            (window as any).__manual_stop = false;
            // Reset restart attempts to allow fresh restart cycle
            speechRecognition.resetRestartAttempts();
            speechRecognition.start();
            console.log('🎤 TTS Event Handler: Recognition restarted after TTS');
          } catch (e) {
            console.log('TTS Event Handler: start after TTS failed', e);
          }
        }, 500);
      }

      // Reset the flag after handling
      wasActiveBeforeTTSRef.current = false;
    };

const handleTTSStarted = () => {
      // Remember if recognition was active before TTS
      wasActiveBeforeTTSRef.current = isListening || conversationState?.isActive || false;

      console.log('🔊 TTS Event Handler: TTS started - wasActive:', wasActiveBeforeTTSRef.current);
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
