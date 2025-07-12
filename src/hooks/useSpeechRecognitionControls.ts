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
        // Clean state before starting
        setTranscript("");
        setLastProcessedTranscript("");
        
        // Stop first to ensure clean state
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore stop errors
        }
        
        // Brief delay then start
        setTimeout(() => {
          try {
            if (recognitionRef.current && !isListening) {
              recognitionRef.current.start();
              toast.info('Voice recognition started - speak now');
            }
          } catch (startError) {
            console.error('Error starting speech recognition:', startError);
            toast.error('Failed to start voice recognition');
          }
        }, 200);
        
      } catch (error) {
        console.error('Error in startListening:', error);
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