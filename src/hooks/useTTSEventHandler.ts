
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
        
        // Retry restart with exponential backoff for reliability
        let retryAttempts = 0;
        const maxRetries = 3;
        
        const attemptRestart = () => {
          try {
            // Double-check conditions before restart
            if (recognitionRef.current && 
                conversationState?.isActive && 
                !isListening &&
                !(window as any).__tts_is_speaking) {
              
              console.log('🎤 TTS Event Handler: Restarting speech recognition (attempt ' + (retryAttempts + 1) + ')');
              recognitionRef.current.start();
              setIsListening(true);
            } else {
              console.log('🚫 TTS Event Handler: Conditions changed, skipping restart');
            }
          } catch (error) {
            if (error.name === 'InvalidStateError' && retryAttempts < maxRetries) {
              retryAttempts++;
              const delay = Math.min(1000 * Math.pow(2, retryAttempts - 1), 3000);
              console.log(`⚠️ TTS Event Handler: Restart failed, retrying in ${delay}ms (attempt ${retryAttempts}/${maxRetries})`);
              
              restartTimeoutRef.current = setTimeout(attemptRestart, delay);
            } else {
              console.log('⚠️ TTS Event Handler: Restart failed permanently:', error);
            }
          }
        };
        
        // Initial delay before first attempt
        restartTimeoutRef.current = setTimeout(attemptRestart, 1500);
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
