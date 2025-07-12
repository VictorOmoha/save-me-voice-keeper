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
    console.log('=== useSpeechRecognitionControls: startListening called ===');
    console.log('isSupported:', isSupported, 'isListening:', isListening);
    
    if (!isSupported) {
      console.error('Speech recognition not supported');
      toast.error('Speech recognition not supported in this browser');
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
    
    console.log('About to check microphone permissions...');
    
    // Skip microphone permission check - let recognition handle it
    console.log('Skipping explicit permission check, letting recognition handle it...');
    
    console.log('Checking TTS speaking state...');
    // Check if TTS is currently speaking
    if ((window as any).__tts_is_speaking) {
      console.log('TTS is speaking, waiting before starting voice recognition...');
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
    
    console.log('TTS not speaking, proceeding with speech recognition...');
    console.log('Recognition status - available:', !!recognitionRef.current, 'listening:', isListening);
    
    try {
      console.log('Starting speech recognition process...');
      
      // Clean state before starting
      setTranscript("");
      setLastProcessedTranscript("");
      console.log('State cleared');
      
      // Simple direct start - no complex timing
      console.log('Calling recognition.start() directly...');
      recognitionRef.current.start();
      console.log('recognition.start() called - should see onstart event soon');
      
      // Show immediate feedback
      toast.success('Voice recognition starting...');
      
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      
      // More specific error handling
      if (error.name === 'InvalidStateError') {
        console.log('Recognition already running, stopping and restarting...');
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            if (recognitionRef.current) {
              recognitionRef.current.start();
            }
          }, 100);
        } catch (restartError) {
          console.error('Failed to restart recognition:', restartError);
          toast.error('Failed to restart speech recognition');
        }
      } else if (error.name === 'NotAllowedError') {
        toast.error('Microphone access denied. Please allow microphone access and try again.');
      } else {
        toast.error(`Failed to start: ${error.message}`);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      toast.info('Voice recognition stopped');
    }
  };

  const resetListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    setTranscript("");
    setLastProcessedTranscript("");
    setIsListening(false);
  };

  return {
    startListening,
    stopListening,
    resetListening,
  };
};