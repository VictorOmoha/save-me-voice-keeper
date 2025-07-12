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
  useEffect(() => {
    const handleTTSCompleted = (event: CustomEvent) => {
      console.log('TTS completed - preparing to restart speech recognition', {
        isConversationActive: conversationState?.isActive,
        isCurrentlyListening: isListening,
        recognitionExists: !!recognitionRef.current
      });
      
      // Only restart if we're in an active conversation and not already listening
      if (conversationState?.isActive && !isListening && recognitionRef.current) {
        console.log('Restarting speech recognition after TTS completion...');
        
        // Simple restart with error handling
        setTimeout(() => {
          try {
            // Double-check conditions before restart
            if (recognitionRef.current && conversationState?.isActive && !isListening) {
              // Stop first to ensure clean state
              try {
                recognitionRef.current.stop();
              } catch (e) {
                // Ignore stop errors
              }
              
              // Brief delay then start
              setTimeout(() => {
                try {
                  if (recognitionRef.current && conversationState?.isActive) {
                    recognitionRef.current.start();
                    console.log('Speech recognition restarted successfully');
                  }
                } catch (startError) {
                  console.log('Start attempt failed, will be handled by auto-restart logic');
                }
              }, 500);
            }
          } catch (error) {
            console.log('TTS restart handling failed, auto-restart will handle it');
          }
        }, 1500);
      }
    };

    window.addEventListener('tts-completed', handleTTSCompleted as EventListener);
    
    return () => {
      window.removeEventListener('tts-completed', handleTTSCompleted as EventListener);
    };
  }, [conversationState?.isActive, isListening, recognitionRef, setIsListening]);
};