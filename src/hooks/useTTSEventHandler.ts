
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
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleTTSCompleted = (event: CustomEvent) => {
      console.log('🔊 TTS Event Handler: TTS completed', {
        isConversationActive: conversationState?.isActive,
        isCurrentlyListening: isListening,
        recognitionExists: !!recognitionRef.current
      });
      
      // Clear any existing restart timeout
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      
      // Only restart if we're in an active conversation and not already listening
      if (conversationState?.isActive && !isListening && recognitionRef.current) {
        console.log('🔄 TTS Event Handler: Scheduling recognition restart after TTS completion');
        
        // Wait longer for TTS to fully complete before restarting
        restartTimeoutRef.current = setTimeout(() => {
          try {
            // Double-check conditions before restart
            if (recognitionRef.current && 
                conversationState?.isActive && 
                !isListening &&
                !(window as any).__tts_is_speaking) {
              
              console.log('🎤 TTS Event Handler: Restarting speech recognition');
              recognitionRef.current.start();
            } else {
              console.log('🚫 TTS Event Handler: Conditions changed, skipping restart');
            }
          } catch (error) {
            console.log('⚠️ TTS Event Handler: Restart failed, will be handled by orchestrator:', error);
          }
        }, 2500); // Increased delay significantly
      }
    };

    const handleTTSStarted = () => {
      console.log('🔊 TTS Event Handler: TTS started - ensuring recognition is paused');
      
      // If we're currently listening, stop recognition to prevent feedback
      if (isListening && recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          console.log('🛑 TTS Event Handler: Stopped recognition due to TTS start');
        } catch (error) {
          console.log('Error stopping recognition on TTS start:', error);
        }
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
