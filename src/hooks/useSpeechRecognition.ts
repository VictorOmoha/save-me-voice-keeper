
import { useEffect, useState, useRef } from 'react';
import { VoiceCommand } from "@/utils/voiceCommandProcessor";
import { useTTSEventHandler } from './useTTSEventHandler';
import { useSpeechRecognitionControls } from './useSpeechRecognitionControls';
import { setupSpeechRecognition } from '@/utils/speechRecognitionSetup';
import { toast } from 'sonner';

interface UseSpeechRecognitionProps {
  onVoiceCommand?: (command: VoiceCommand) => void;
  onEnhancedVoiceInput?: (text: string) => void;
  conversationState?: { isActive: boolean; currentStep?: { question: string } };
}

export const useSpeechRecognition = ({
  onVoiceCommand,
  onEnhancedVoiceInput,
  conversationState,
}: UseSpeechRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [lastProcessedTranscript, setLastProcessedTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isInitialized = useRef(false);

  // Handle TTS completion events
  useTTSEventHandler({
    conversationState,
    isListening,
    recognitionRef,
    setIsListening,
  });

  // Set up speech recognition only once
  useEffect(() => {
    if (isInitialized.current) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      
      console.log('🔧 SETUP: Initializing speech recognition');
      const recognition = setupSpeechRecognition({
        onVoiceCommand,
        onEnhancedVoiceInput,
        conversationState,
        setIsListening,
        setTranscript,
        lastProcessedTranscript,
        setLastProcessedTranscript,
        recognitionRef,
      });
      
      if (recognition) {
        recognitionRef.current = recognition;
        isInitialized.current = true;
        console.log('✅ SETUP: Speech recognition initialized successfully');
      }
    } else {
      console.warn('Speech recognition not supported in this browser');
    }
    
    // Add listener for forced voice restart when form opens
    const handleForceRestart = (event: CustomEvent) => {
      console.log('Force voice restart event received:', event.detail);
      if (event.detail.conversationActive && recognitionRef.current && !isListening) {
        setTimeout(() => {
          try {
            if (recognitionRef.current && !window.__manual_stop) {
              console.log('Forcing speech recognition restart after form opened');
              recognitionRef.current.start();
              toast.info('Voice recognition restarted - ready for your response');
            }
          } catch (error) {
            console.log('Force restart failed:', error);
          }
        }, 1000); // Increased delay
      }
    };
    
    window.addEventListener('force-voice-restart', handleForceRestart as EventListener);
    
    return () => {
      console.log('🧹 CLEANUP: Cleaning up speech recognition');
      if (recognitionRef.current) {
        window.__manual_stop = true;
        if ((recognitionRef.current as any).cleanup) {
          (recognitionRef.current as any).cleanup();
        }
        recognitionRef.current.abort();
      }
      window.removeEventListener('force-voice-restart', handleForceRestart as EventListener);
      isInitialized.current = false;
    };
  }, []); // Remove dependencies to prevent re-initialization

  // Get control methods
  const controls = useSpeechRecognitionControls({
    isSupported,
    isListening,
    recognitionRef,
    setTranscript,
    setLastProcessedTranscript,
    setIsListening,
  });

  console.log('useSpeechRecognition: Hook initialized, controls:', {
    startListening: typeof controls.startListening,
    stopListening: typeof controls.stopListening,
    resetListening: typeof controls.resetListening
  });

  return {
    isListening,
    transcript,
    isSupported,
    startListening: controls.startListening,
    stopListening: controls.stopListening,
    resetListening: controls.resetListening,
  };
};
