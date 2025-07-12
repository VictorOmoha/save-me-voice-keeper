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
      
      // Only restart if in active conversation
      if (!conversationState?.isActive || !recognitionRef.current) {
        console.log('Not restarting - no active conversation or recognition ref');
        return;
      }

      console.log('TTS completed during conversation - preparing to restart speech recognition');
      
      // Simple, single timeout approach
      setTimeout(() => {
        // Double-check conditions haven't changed
        if (!conversationState?.isActive || !recognitionRef.current || (window as any).__tts_is_speaking) {
          console.log('Conditions changed, aborting restart');
          return;
        }

        try {
          // Always abort any existing recognition first
          if (recognitionRef.current) {
            console.log('Aborting any existing recognition...');
            recognitionRef.current.abort();
            setIsListening(false);
          }

          // Small delay then start fresh
          setTimeout(() => {
            if (conversationState?.isActive && recognitionRef.current && !(window as any).__tts_is_speaking) {
              console.log('Starting fresh speech recognition after TTS completion');
              recognitionRef.current.start();
              setIsListening(true);
            }
          }, 300);

        } catch (error) {
          console.error('Error restarting speech recognition after TTS:', error);
        }
      }, 1500); // Wait for TTS audio to fully complete
    };

    window.addEventListener('tts-completed', handleTTSCompleted as EventListener);
    return () => {
      window.removeEventListener('tts-completed', handleTTSCompleted as EventListener);
    };
  }, [conversationState?.isActive, isListening, recognitionRef, setIsListening]);
};