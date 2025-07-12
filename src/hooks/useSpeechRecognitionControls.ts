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
  const startListening = () => {
    if (!isSupported) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }
    
    // Check if TTS is currently speaking
    if ((window as any).__tts_is_speaking) {
      console.log('TTS is speaking, waiting before starting voice recognition...');
      toast.info('Waiting for system to finish speaking...');
      
      // Wait for TTS to finish, then start
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
    
    if (recognitionRef.current && !isListening) {
      try {
        setTranscript("");
        setLastProcessedTranscript("");
        recognitionRef.current.start();
        toast.info('Voice recognition started - speak now');
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        toast.error('Failed to start voice recognition');
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