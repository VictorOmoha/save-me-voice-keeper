
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
    console.log('=== Starting voice recognition ===');
    console.log('Browser support:', isSupported);
    console.log('Currently listening:', isListening);
    
    if (!isSupported) {
      const errorMsg = 'Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.';
      console.error(errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    if (isListening) {
      console.log('Already listening, ignoring start request');
      return;
    }
    
    if (!recognitionRef.current) {
      console.error('No recognition reference available');
      toast.error('Speech recognition not properly initialized');
      return;
    }
    
    // Check microphone permissions
    try {
      console.log('Requesting microphone access...');
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone access granted');
    } catch (error) {
      console.error('Microphone access error:', error);
      toast.error('Unable to access microphone. Please check your permissions and try again.');
      return;
    }
    
    // Wait for TTS to finish if speaking
    if ((window as any).__tts_is_speaking) {
      console.log('TTS is speaking, waiting for completion...');
      toast.info('Waiting for system to finish speaking...');
      
      const waitForTTS = () => {
        if (!(window as any).__tts_is_speaking) {
          startListening(); // Retry after TTS completes
        } else {
          setTimeout(waitForTTS, 500);
        }
      };
      setTimeout(waitForTTS, 1000);
      return;
    }
    
    try {
      console.log('Starting speech recognition...');
      
      // Clean state before starting
      setTranscript("");
      setLastProcessedTranscript("");
      
      // Start recognition
      recognitionRef.current.start();
      console.log('Speech recognition start() called');
      
      // Immediate user feedback
      toast.success('🎤 Voice recognition starting...');
      
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      
      // Handle specific error cases
      if (error.name === 'InvalidStateError') {
        console.log('Recognition already running, attempting restart...');
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            if (recognitionRef.current) {
              recognitionRef.current.start();
              toast.success('🎤 Voice recognition restarted');
            }
          }, 500);
        } catch (restartError) {
          console.error('Failed to restart recognition:', restartError);
          toast.error('Failed to restart voice recognition. Please try again.');
        }
      } else {
        toast.error(`Failed to start voice recognition: ${error.message}`);
      }
    }
  };

  const stopListening = () => {
    console.log('=== Stopping voice recognition ===');
    
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
        console.log('Speech recognition stopped');
        toast.info('🔇 Voice recognition stopped');
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
    
    // Clean up global flags
    (window as any).__speech_recognition_active = false;
  };

  const resetListening = () => {
    console.log('=== Resetting voice recognition ===');
    
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
    
    toast.success('Voice recognition reset');
  };

  return {
    startListening,
    stopListening,
    resetListening,
  };
};
