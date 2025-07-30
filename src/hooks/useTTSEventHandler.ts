
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
      const recognitionState = recognitionRef.current ? (recognitionRef.current as any).state : 'null';
      console.log('🔊 TTS Event Handler: TTS completed', {
        isConversationActive: conversationState?.isActive,
        isCurrentlyListening: isListening,
        recognitionExists: !!recognitionRef.current,
        recognitionState,
        ttsSpeaking: !!(window as any).__tts_is_speaking
      });
      
      // Clear any existing restart timeout
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      
      // Only restart if we're in an active conversation and not already listening
      // Also check if TTS is truly finished to prevent feedback loops
      // Check the actual recognition state from singleton to avoid race conditions
      const isActuallyListening = recognitionRef.current && 
        (recognitionRef.current as any).state === 'started';
      
      if (conversationState?.isActive && !isListening && !isActuallyListening && 
          recognitionRef.current && !(window as any).__tts_is_speaking) {
        console.log('🔄 TTS Event Handler: Scheduling recognition restart after TTS completion');
        
        // Retry restart with exponential backoff for reliability
        let retryAttempts = 0;
        const maxRetries = 3;
        
        const attemptRestart = () => {
          try {
            // Check if recognition is already running to prevent InvalidStateError
            const recognitionState = recognitionRef.current ? (recognitionRef.current as any).state : 'null';
            const isAlreadyRunning = recognitionState === 'started';
            
            console.log('🧪 TTS Event Handler: Restart attempt diagnosis', {
              attempt: retryAttempts + 1,
              hasRecognition: !!recognitionRef.current,
              recognitionState,
              isActive: conversationState?.isActive,
              isListening,
              isAlreadyRunning,
              isTTSSpeaking: !!(window as any).__tts_is_speaking,
              globalListening: (window as any).__speech_listening
            });
            
            // If recognition is already started, we need to handle this properly
            if (isAlreadyRunning && recognitionRef.current) {
              console.log('🛑 TTS Event Handler: Recognition already running, forcing proper state');
              
              // Set up event handler for when it actually stops
              const handleEnded = () => {
                recognitionRef.current?.removeEventListener('end', handleEnded);
                console.log('🎤 TTS Event Handler: Recognition ended, starting fresh');
                
                if (recognitionRef.current && conversationState?.isActive) {
                  try {
                    recognitionRef.current.start();
                    setIsListening(true);
                    console.log('✅ TTS Event Handler: Successfully restarted recognition');
                  } catch (error) {
                    console.log('❌ TTS Event Handler: Failed to restart after stop:', error);
                  }
                }
              };
              
              recognitionRef.current.addEventListener('end', handleEnded);
              
              try {
                recognitionRef.current.stop();
                console.log('🛑 TTS Event Handler: Stopped existing recognition, waiting for end event');
              } catch (error) {
                console.log('❌ TTS Event Handler: Error stopping recognition:', error);
                recognitionRef.current?.removeEventListener('end', handleEnded);
              }
              return;
            }
            
            // Double-check conditions before restart
            if (recognitionRef.current && 
                conversationState?.isActive && 
                !isListening &&
                !isAlreadyRunning &&
                !(window as any).__tts_is_speaking) {
              
              console.log('🎤 TTS Event Handler: Restarting speech recognition (attempt ' + (retryAttempts + 1) + ')');
              recognitionRef.current.start();
              setIsListening(true);
            } else {
              console.log('🚫 TTS Event Handler: Conditions not met for restart');
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
