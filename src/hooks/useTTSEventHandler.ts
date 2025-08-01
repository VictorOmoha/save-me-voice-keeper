
import { useEffect, useRef } from 'react';

interface UseTTSEventHandlerProps {
  conversationState?: { isActive: boolean; currentStep?: { question: string } };
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

  useEffect(() => {
    const handleTTSCompleted = async (event: CustomEvent) => {
      const recognitionState = recognitionRef.current ? (recognitionRef.current as any).state : 'null';
      console.log('🔊 TTS Event Handler: TTS completed', {
        isConversationActive: conversationState?.isActive,
        isCurrentlyListening: isListening,
        recognitionExists: !!recognitionRef.current,
        recognitionState,
        ttsSpeaking: !!(window as any).__tts_is_speaking,
        currentStep: conversationState?.currentStep?.question
      });
      
      // Clear any existing restart timeout
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      
      // Only restart if we're in an active conversation (including confirmation prompts)
      if (conversationState?.isActive && recognitionRef.current && !(window as any).__tts_is_speaking) {
        console.log('🔄 TTS Event Handler: Scheduling recognition restart after TTS completion', {
          conversationActive: conversationState?.isActive,
          hasRecognition: !!recognitionRef.current,
          ttsNotSpeaking: !(window as any).__tts_is_speaking,
          currentStep: conversationState?.currentStep?.question
        });
        
        const attemptRestart = async () => {
          try {
            // Shorter wait for confirmation prompts to be more responsive
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Check if we should still proceed
            if (!conversationState?.isActive || (window as any).__tts_is_speaking || !recognitionRef.current) {
              console.log('🚫 TTS Event Handler: Aborting restart - conditions changed');
              return;
            }
            
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
            
            // ENHANCED FIX: More robust restart sequence
            const performSafeRestart = () => {
              return new Promise<void>((resolve, reject) => {
                try {
                  if (!recognitionRef.current) {
                    reject(new Error('No recognition object'));
                    return;
                  }
                  
                  // Add event listeners for this restart attempt
                  const onStart = () => {
                    console.log('✅ TTS Event Handler: Recognition successfully started');
                    setIsListening(true);
                    cleanup();
                    resolve();
                  };
                  
                  const onError = (error: any) => {
                    console.log('⚠️ TTS Event Handler: Recognition start error:', error);
                    if (error.error === 'not-allowed' || error.error === 'service-not-allowed') {
                      console.log('🚫 TTS Event Handler: Permission denied for microphone');
                    }
                    cleanup();
                    reject(error);
                  };
                  
                  const cleanup = () => {
                    if (recognitionRef.current) {
                      recognitionRef.current.removeEventListener('start', onStart);
                      recognitionRef.current.removeEventListener('error', onError);
                    }
                  };
                  
                  recognitionRef.current.addEventListener('start', onStart);
                  recognitionRef.current.addEventListener('error', onError);
                  
                  // Start with error handling
                  try {
                    recognitionRef.current.start();
                  } catch (immediateError) {
                    cleanup();
                    reject(immediateError);
                  }
                } catch (setupError) {
                  reject(setupError);
                }
              });
            };
            
            // If not inactive, stop first
            if (currentState !== 'inactive') {
              console.log('🛑 TTS Event Handler: Stopping recognition before restart');
              recognitionRef.current.stop();
              
              // Wait for stop to complete
              await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            // Now try to start
            await performSafeRestart();
            
          } catch (error: any) {
            console.log('⚠️ TTS Event Handler: Restart failed:', error);
            // If we get InvalidStateError, recognition might already be running
            if (error.name === 'InvalidStateError') {
              console.log('✅ TTS Event Handler: Recognition likely already running (InvalidStateError)');
              setIsListening(true);
            } else if (error.error === 'already-listening') {
              console.log('✅ TTS Event Handler: Recognition already listening');
              setIsListening(true);
            }
          }
        };
        
        // Start the restart attempt
        attemptRestart();
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
