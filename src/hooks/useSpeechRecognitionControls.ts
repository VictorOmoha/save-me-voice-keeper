
import { toast } from "sonner";

interface UseSpeechRecognitionControlsProps {
  isSupported: boolean;
  isListening: boolean;
  recognitionRef: React.MutableRefObject<SpeechRecognition | null>;
  setTranscript: (value: string) => void;
  setLastProcessedTranscript: (value: string) => void;
  setIsListening: (value: boolean) => void;
}

export const useSpeechRecognitionControls = ({
  isSupported,
  isListening,
  recognitionRef,
  setTranscript,
  setLastProcessedTranscript,
  setIsListening,
}: UseSpeechRecognitionControlsProps) => {
  const startListening = async () => {
    console.log('=== Starting continuous voice recognition ===');
    
    if (!isSupported) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }
    
    if (isListening) {
      console.log('Already listening');
      return;
    }
    
    if (!recognitionRef.current) {
      console.error('No recognition reference available');
      toast.error('Speech recognition not properly initialized');
      return;
    }
    
    // Check microphone permissions
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      console.error('Microphone access error:', error);
      toast.error('Unable to access microphone. Please check your permissions.');
      return;
    }
    
    // Wait for TTS to finish if speaking
    if ((window as any).__tts_is_speaking) {
      console.log('Waiting for TTS to finish...');
      toast.info('Waiting for system to finish speaking...');
      
      const waitForTTS = () => {
        if (!(window as any).__tts_is_speaking) {
          startListening();
        } else {
          setTimeout(waitForTTS, 500);
        }
      };
      setTimeout(waitForTTS, 1000);
      return;
    }
    
    try {
      console.log('Starting continuous speech recognition...');
      
      // Clear manual stop flag and reset state
      (window as any).__manual_stop = false;
      setTranscript("");
      setLastProcessedTranscript("");
      
      // Start recognition
      recognitionRef.current.start();
      console.log('Speech recognition started for continuous listening');
      
      toast.success('🎤 Voice recognition active - say your commands!');
      
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      
      if (error.name === 'InvalidStateError') {
        console.log('Recognition already running, continuing...');
        setIsListening(true);
        toast.success('🎤 Voice recognition already active');
      } else {
        toast.error(`Failed to start voice recognition: ${error.message}`);
      }
    }
  };

  const stopListening = () => {
    console.log('=== Stopping voice recognition ===');
    
    // Set manual stop flag to prevent auto-restart
    (window as any).__manual_stop = true;
    
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
        console.log('Speech recognition stopped manually');
        toast.info('🔇 Voice recognition stopped');
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
    
    // Clean up global flags
    (window as any).__speech_recognition_active = false;
    setIsListening(false);
  };

  const resetListening = () => {
    console.log('=== Resetting voice recognition ===');
    
    // Set manual stop flag and abort
    (window as any).__manual_stop = true;
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (error) {
        console.error('Error aborting recognition:', error);
      }
    }
    
    // Reset all state
    setTranscript("");
    setLastProcessedTranscript("");
    setIsListening(false);
    (window as any).__speech_recognition_active = false;
    
    // Clear manual stop flag after reset
    setTimeout(() => {
      (window as any).__manual_stop = false;
    }, 1000);
    
    toast.success('Voice recognition reset - ready to start again');
  };

  return {
    startListening,
    stopListening,
    resetListening,
  };
};
