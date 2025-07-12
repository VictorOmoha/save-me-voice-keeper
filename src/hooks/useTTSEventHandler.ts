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
        
        // Critical: Wait longer to ensure microphone is fully released
        setTimeout(() => {
          try {
            // Double-check all conditions before restarting
            if (conversationState?.isActive && recognitionRef.current && !isListening && !(window as any).__tts_is_speaking) {
              console.log('Attempting to restart speech recognition...');
              recognitionRef.current.start();
              setIsListening(true);
              console.log('Speech recognition force-restarted after TTS completion');
            } else {
              console.log('Conditions not met for restart:', {
                conversationActive: conversationState?.isActive,
                hasRecognition: !!recognitionRef.current,
                isListening,
                ttsSpeaking: (window as any).__tts_is_speaking
              });
            }
          } catch (error) {
            console.error('Error restarting recognition after TTS:', error);
            // Try again after a longer delay
            setTimeout(() => {
              try {
                if (conversationState?.isActive && recognitionRef.current && !isListening && !(window as any).__tts_is_speaking) {
                  recognitionRef.current.start();
                  setIsListening(true);
                  console.log('Speech recognition restarted on retry');
                }
              } catch (retryError) {
                console.error('Failed to restart recognition after retry:', retryError);
              }
            }, 2000);
          }
        }, 1500); // Increased delay to 1.5 seconds
      }
    };

    window.addEventListener('tts-completed', handleTTSCompleted as EventListener);
    return () => {
      window.removeEventListener('tts-completed', handleTTSCompleted as EventListener);
    };
  }, [conversationState?.isActive, isListening, recognitionRef, setIsListening]);
};