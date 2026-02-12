import React, { useEffect, useRef } from 'react';
import { speechRecognition } from '@/utils/speechRecognitionSingleton';

interface UseTTSEventHandlerProps {
  conversationState?: {
    isActive: boolean;
    currentStep?: { question: string };
  };
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
  
  // Use refs to always have current values in event handlers
  const isListeningRef = useRef(isListening);
  const conversationActiveRef = useRef(conversationState?.isActive || false);
  
  // FIX: Local refs to replace window globals
  const ttsSpeakingRef = useRef(false);
  const lastTTSEndTimeRef = useRef(0);
  const manualStopRef = useRef(false);

  // Keep refs updated with latest values
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    conversationActiveRef.current = conversationState?.isActive || false;
  }, [conversationState?.isActive]);

  useEffect(() => {
    const handleTTSCompleted = async (event: CustomEvent) => {
      // Mark TTS finished - using local ref instead of window global
      ttsSpeakingRef.current = false;
      lastTTSEndTimeRef.current = Date.now();
      
      // CRITICAL: Clear manual stop flag so recognition can restart
      manualStopRef.current = false;
      
      console.log('🔊 TTS Event Handler: TTS completed, will restart recognition');

      // Clear any existing restart timeout
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }

      // ALWAYS try to restart after TTS - the singleton will manage actual state
      // Give a small grace period before restarting to avoid feedback
      restartTimeoutRef.current = setTimeout(() => {
        try {
          // Ensure manual_stop is still false before starting
          manualStopRef.current = false;
          
          // Reset restart attempts to allow fresh restart cycle
          speechRecognition.resetRestartAttempts();
          speechRecognition.start();
          console.log('🎤 TTS Event Handler: Recognition restarted after TTS');
        } catch (e) {
          console.log('TTS Event Handler: start after TTS failed', e);
        }
      }, 500);
    };

    const handleTTSStarted = () => {
      console.log('🔊 TTS Event Handler: TTS started - pausing recognition');
      // FIX: Using local ref instead of window global
      ttsSpeakingRef.current = true;
      
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - we use refs for current values
  
  // Return refs so other functions can check state
  return {
    isSpeaking: () => ttsSpeakingRef.current,
    getLastEndTime: () => lastTTSEndTimeRef.current,
    isManualStop: () => manualStopRef.current,
    setManualStop: (value: boolean) => { manualStopRef.current = value; },
  };
};
