
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
      
      // Only restart if we're in an active conversation
      if (conversationState?.isActive && recognitionRef.current && !(window as any).__tts_is_speaking) {
        console.log('🔄 TTS Event Handler: Scheduling recognition restart after TTS completion');
        
        const attemptRestart = () => {
          try {
            // Get fresh state
            const currentState = recognitionRef.current ? (recognitionRef.current as any).state : 'null';
            
            console.log('🧪 TTS Event Handler: Restart attempt', {
              hasRecognition: !!recognitionRef.current,
              recognitionState: currentState,
              isActive: conversationState?.isActive,
              isTTSSpeaking: !!(window as any).__tts_is_speaking
            });
            
            // If already started, we're good
            if (currentState === 'started') {
              console.log('✅ TTS Event Handler: Recognition already running');
              setIsListening(true);
              return;
            }
            
            // CRITICAL FIX: Always stop before starting to prevent InvalidStateError
            if (recognitionRef.current && currentState !== 'inactive') {
              console.log('🛑 TTS Event Handler: Stopping recognition before restart');
              recognitionRef.current.stop();
              
              // Wait for stop to complete before starting
              setTimeout(() => {
                if (conversationState?.isActive && !(window as any).__tts_is_speaking && recognitionRef.current) {
                  try {
                    console.log('🎤 TTS Event Handler: Starting recognition after stop');
                    recognitionRef.current.start();
                    setIsListening(true);
                    console.log('✅ TTS Event Handler: Successfully started recognition');
                  } catch (startError) {
                    console.log('⚠️ TTS Event Handler: Start after stop failed:', startError);
                    if (startError.name === 'InvalidStateError') {
                      console.log('✅ TTS Event Handler: Recognition likely already running');
                      setIsListening(true);
                    }
                  }
                }
              }, 200);
            } else if (conversationState?.isActive && !(window as any).__tts_is_speaking) {
              console.log('🎤 TTS Event Handler: Starting recognition (inactive state)');
              recognitionRef.current.start();
              setIsListening(true);
              console.log('✅ TTS Event Handler: Successfully started recognition');
            }
          } catch (error) {
            console.log('⚠️ TTS Event Handler: Restart failed:', error);
            // If we get InvalidStateError, recognition might already be running
            if (error.name === 'InvalidStateError') {
              console.log('✅ TTS Event Handler: Recognition likely already running');
              setIsListening(true);
            }
          }
        };
        
        // Give a brief delay for TTS to fully complete
        restartTimeoutRef.current = setTimeout(attemptRestart, 800);
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
