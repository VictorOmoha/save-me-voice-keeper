import React, { useEffect, useRef } from 'react';
import { speechRecognition } from '@/utils/speechRecognitionSingleton';

type TTSWindow = Window & {
  __tts_is_speaking?: boolean;
  __last_tts_end_time?: number;
  __manual_stop?: boolean;
};

interface UseTTSEventHandlerProps {
  conversationState?: {
    isActive: boolean;
    currentStep?: { question: string };
  };
  isListening: boolean;
  recognitionRef: React.MutableRefObject<SpeechRecognition | null>;
  setIsListening?: (value: boolean) => void;
}

// Global/shared TTS listener registration guards
let ttsHandlerRefCount = 0;
let globalRestartTimeout: NodeJS.Timeout | null = null;

const handleGlobalTTSStarted = () => {
  console.log('🔊 TTS Event Handler: TTS started - pausing recognition');
  try {
    speechRecognition.stop();
    console.log('🛑 TTS Event Handler: Stopped recognition due to TTS start');
  } catch (error) {
    console.log('Error stopping recognition on TTS start:', error);
  }
};

const handleGlobalTTSCompleted = () => {
  console.log('🔊 TTS Event Handler: TTS completed, will restart recognition');

  if (globalRestartTimeout) {
    clearTimeout(globalRestartTimeout);
    globalRestartTimeout = null;
  }

  globalRestartTimeout = setTimeout(() => {
    try {
      speechRecognition.resetRestartAttempts();
      speechRecognition.start();
      console.log('🎤 TTS Event Handler: Recognition restarted after TTS');
    } catch (e) {
      console.log('TTS Event Handler: start after TTS failed', e);
    }
  }, 500);
};

export const useTTSEventHandler = ({
  conversationState,
  isListening,
  recognitionRef,
  setIsListening = () => {},
}: UseTTSEventHandlerProps) => {
  const isListeningRef = useRef(isListening);
  const conversationActiveRef = useRef(conversationState?.isActive || false);

  // Keep refs updated (for compatibility with existing hook shape)
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    conversationActiveRef.current = conversationState?.isActive || false;
  }, [conversationState?.isActive]);

  useEffect(() => {
    ttsHandlerRefCount += 1;

    if (ttsHandlerRefCount === 1) {
      window.addEventListener('tts-completed', handleGlobalTTSCompleted as EventListener);
      window.addEventListener('tts-started', handleGlobalTTSStarted as EventListener);
    }

    return () => {
      ttsHandlerRefCount = Math.max(0, ttsHandlerRefCount - 1);

      if (ttsHandlerRefCount === 0) {
        window.removeEventListener('tts-completed', handleGlobalTTSCompleted as EventListener);
        window.removeEventListener('tts-started', handleGlobalTTSStarted as EventListener);

        if (globalRestartTimeout) {
          clearTimeout(globalRestartTimeout);
          globalRestartTimeout = null;
        }
      }
    };
  }, []);

  // Return shape preserved for compatibility
  return {
    isSpeaking: () => (window as TTSWindow).__tts_is_speaking === true,
    getLastEndTime: () => (window as TTSWindow).__last_tts_end_time || 0,
    isManualStop: () => (window as TTSWindow).__manual_stop === true,
    setManualStop: (value: boolean) => {
      (window as TTSWindow).__manual_stop = value;
    },
  };
};
