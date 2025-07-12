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
              
              // Stop any existing recognition first
              if (isListening) {
                try {
                  recognitionRef.current.abort();
                  setIsListening(false);
                  console.log('Stopped existing recognition before restart');
                } catch (stopError) {
                  console.log('Error stopping existing recognition:', stopError);
                }
              }
              
              // Start fresh recognition
              setTimeout(() => {
                try {
                  recognitionRef.current.start();
                  setIsListening(true);
                  console.log('Speech recognition force-restarted after TTS completion');
                } catch (startError) {
                  console.error('Error starting recognition:', startError);
                  throw startError;
                }
              }, 500); // Small delay for cleanup
            } else {
              console.log('Conditions not met for restart:', {
                conversationActive: conversationState?.isActive,
                hasRecognition: !!recognitionRef.current,
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
        }, 2000); // Increased delay to 2 seconds for better reliability
      }
    };

    window.addEventListener('tts-completed', handleTTSCompleted as EventListener);
    return () => {
      window.removeEventListener('tts-completed', handleTTSCompleted as EventListener);
    };
  }, [conversationState?.isActive, isListening, recognitionRef, setIsListening]);
};