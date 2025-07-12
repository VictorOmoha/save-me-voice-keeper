import { useEffect, useRef } from 'react';

interface UseTTSEventHandlerProps {
  conversationState?: { isActive: boolean };
  isListening: boolean;
  recognitionRef: React.MutableRefObject<SpeechRecognition | null>;
  setIsListening: (value: boolean) => void;
}

export const useTTSEventHandler = ({
  conversationState,
  isListening,
  recognitionRef,
  setIsListening,
}: UseTTSEventHandlerProps) => {
  // Listen for TTS completion events to restart recognition during conversations
  useEffect(() => {
    const handleTTSCompleted = (event: CustomEvent) => {
      console.log('TTS completed event received:', event.detail);
      
      // Force restart recognition if in conversation mode
      if (conversationState?.isActive && recognitionRef.current && !isListening) {
        console.log('TTS completed during conversation - restarting speech recognition');
        setTimeout(() => {
          try {
            if (recognitionRef.current && conversationState?.isActive && !isListening) {
              recognitionRef.current.start();
              setIsListening(true);
              console.log('Speech recognition force-restarted after TTS completion');
            }
          } catch (error) {
            console.error('Error restarting recognition after TTS:', error);
            // Try again after a delay
            setTimeout(() => {
              try {
                if (recognitionRef.current && conversationState?.isActive && !isListening) {
                  recognitionRef.current.start();
                  setIsListening(true);
                }
              } catch (retryError) {
                console.error('Failed to restart recognition after retry:', retryError);
              }
            }, 1000);
          }
        }, 500);
      }
    };

    window.addEventListener('tts-completed', handleTTSCompleted as EventListener);
    return () => {
      window.removeEventListener('tts-completed', handleTTSCompleted as EventListener);
    };
  }, [conversationState?.isActive, isListening, recognitionRef, setIsListening]);
};