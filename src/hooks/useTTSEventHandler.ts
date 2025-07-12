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
      if (conversationState?.isActive && recognitionRef.current) {
        console.log('TTS completed during conversation - restarting speech recognition');
        console.log('Current listening state:', isListening);
        console.log('TTS speaking state:', (window as any).__tts_is_speaking);
        
        // Critical: Wait longer to ensure microphone is fully released
        setTimeout(() => {
          try {
            // Always try to restart when in conversation mode, regardless of current listening state
            if (conversationState?.isActive && recognitionRef.current && !(window as any).__tts_is_speaking) {
              console.log('Attempting to restart speech recognition...');
              
              // Stop any existing recognition first - MUST be synchronous
              if (isListening && recognitionRef.current) {
                try {
                  console.log('Stopping existing recognition...');
                  recognitionRef.current.abort();
                  setIsListening(false);
                  console.log('Stopped existing recognition before restart');
                  
                  // Wait for the abort to complete before starting new recognition
                  setTimeout(() => {
                    try {
                      if (conversationState?.isActive && recognitionRef.current && !(window as any).__tts_is_speaking) {
                        console.log('Starting fresh recognition after abort...');
                        recognitionRef.current.start();
                        setIsListening(true);
                        console.log('Speech recognition force-restarted after TTS completion');
                      }
                    } catch (startError) {
                      console.error('Error starting recognition after abort:', startError);
                      // Try one more time after longer delay
                      setTimeout(() => {
                        try {
                          if (conversationState?.isActive && recognitionRef.current && !isListening && !(window as any).__tts_is_speaking) {
                            recognitionRef.current.start();
                            setIsListening(true);
                            console.log('Speech recognition restarted on final retry');
                          }
                        } catch (finalError) {
                          console.error('Final recognition restart failed:', finalError);
                        }
                      }, 1000);
                    }
                  }, 750); // Wait for abort to complete
                  
                } catch (stopError) {
                  console.log('Error stopping existing recognition:', stopError);
                  // If we can't stop cleanly, wait longer and try fresh start
                  setTimeout(() => {
                    try {
                      if (conversationState?.isActive && recognitionRef.current && !(window as any).__tts_is_speaking) {
                        recognitionRef.current.start();
                        setIsListening(true);
                        console.log('Speech recognition started after stop error');
                      }
                    } catch (startError) {
                      console.error('Error starting recognition after stop error:', startError);
                    }
                  }, 1500);
                }
              } else {
                // No existing recognition, start fresh
                try {
                  console.log('Starting fresh recognition (no existing one)...');
                  recognitionRef.current.start();
                  setIsListening(true);
                  console.log('Speech recognition started fresh');
                } catch (startError) {
                  console.error('Error starting fresh recognition:', startError);
                }
              }
            } else {
              console.log('Conditions not met for restart:', {
                conversationActive: conversationState?.isActive,
                hasRecognition: !!recognitionRef.current,
                ttsSpeaking: (window as any).__tts_is_speaking
              });
            }
          } catch (error) {
            console.error('Error in TTS restart logic:', error);
          }
        }, 2000); // Increased delay to 2 seconds for better reliability
      }
    };

    window.addEventListener('tts-completed', handleTTSCompleted as EventListener);
    return () => {
      window.removeEventListener('tts-completed', handleTTSCompleted as EventListener);
    };
  }, [conversationState?.isActive, isListening, recognitionRef, setIsListening]);
};