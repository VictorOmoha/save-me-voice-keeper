
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
      
      // Enhanced restart logic with robust retry mechanism
      if (conversationState?.isActive && recognitionRef.current && !(window as any).__tts_is_speaking) {
        console.log('🔄 TTS Event Handler: Scheduling recognition restart after TTS completion');
        
        const performRobustRestart = async () => {
          let retryCount = 0;
          const maxRetries = 3;
          const baseDelay = 300;
          
          while (retryCount < maxRetries) {
            try {
              // Exponential backoff delay
              const delay = baseDelay * Math.pow(1.5, retryCount);
              await new Promise(resolve => setTimeout(resolve, delay));
              
              // Check if conditions still valid
              if (!conversationState?.isActive || (window as any).__tts_is_speaking || !recognitionRef.current) {
                console.log('🚫 TTS Event Handler: Aborting restart - conditions changed');
                return;
              }
              
              const currentState = recognitionRef.current ? (recognitionRef.current as any).state : 'null';
              console.log(`🧪 TTS Event Handler: Restart attempt ${retryCount + 1}/${maxRetries}`, {
                recognitionState: currentState,
                isActive: conversationState?.isActive,
                delay
              });
              
              // If already started, we're good
              if (currentState === 'started') {
                console.log('✅ TTS Event Handler: Recognition already running');
                setIsListening(true);
                return;
              }
              
              // Stop if not inactive
              if (currentState !== 'inactive') {
                console.log('🛑 TTS Event Handler: Stopping recognition before restart');
                recognitionRef.current.stop();
                await new Promise(resolve => setTimeout(resolve, 200));
              }
              
              // Safe restart with promise wrapper
              await new Promise<void>((resolve, reject) => {
                if (!recognitionRef.current) {
                  reject(new Error('No recognition object'));
                  return;
                }
                
                const timeout = setTimeout(() => {
                  cleanup();
                  reject(new Error('Start timeout'));
                }, 2000);
                
                const onStart = () => {
                  console.log('✅ TTS Event Handler: Recognition successfully started');
                  setIsListening(true);
                  cleanup();
                  resolve();
                };
                
                const onError = (error: any) => {
                  console.log('⚠️ TTS Event Handler: Recognition start error:', error);
                  cleanup();
                  reject(error);
                };
                
                const cleanup = () => {
                  clearTimeout(timeout);
                  if (recognitionRef.current) {
                    recognitionRef.current.removeEventListener('start', onStart);
                    recognitionRef.current.removeEventListener('error', onError);
                  }
                };
                
                recognitionRef.current.addEventListener('start', onStart);
                recognitionRef.current.addEventListener('error', onError);
                
                try {
                  recognitionRef.current.start();
                } catch (immediateError) {
                  cleanup();
                  reject(immediateError);
                }
              });
              
              // Success - exit retry loop
              return;
              
            } catch (error: any) {
              retryCount++;
              console.log(`⚠️ TTS Event Handler: Restart attempt ${retryCount} failed:`, error);
              
              if (error.name === 'InvalidStateError' || error.error === 'already-listening') {
                console.log('✅ TTS Event Handler: Recognition likely already running');
                setIsListening(true);
                return;
              }
              
              if (retryCount >= maxRetries) {
                console.log('❌ TTS Event Handler: Max retries reached, providing visual fallback');
                // Dispatch event for visual fallback
                window.dispatchEvent(new CustomEvent('voice-restart-failed', {
                  detail: { reason: 'max_retries_exceeded', error }
                }));
                return;
              }
            }
          }
        };
        
        performRobustRestart();
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
