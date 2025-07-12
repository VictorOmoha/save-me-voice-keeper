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
    
    console.log('About to request microphone permissions...');
    
    // Check for microphone permissions first
    try {
      console.log('Requesting microphone permissions...');
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone permissions granted');
    } catch (error) {
      console.error('Microphone permission denied:', error);
      toast.error('Microphone access denied. Please allow microphone access and try again.');
      return;
    }
    
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
    
    if (!recognitionRef.current) {
      console.error('No recognition reference available');
      toast.error('Speech recognition not properly initialized');
      return;
    }
    
    if (isListening) {
      console.log('Already listening, ignoring start request');
      return;
    }
    
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
      toast.error(`Failed to start: ${error.message}`);
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