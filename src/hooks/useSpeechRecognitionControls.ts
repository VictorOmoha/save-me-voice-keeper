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
    console.log('recognitionRef.current:', !!recognitionRef.current);
    console.log('isListening:', isListening);
    
    if (recognitionRef.current && !isListening) {
      try {
        console.log('Starting speech recognition process...');
        // Clean state before starting
        setTranscript("");
        setLastProcessedTranscript("");
        console.log('State cleared, stopping any existing recognition...');
        
        // Stop first to ensure clean state
        try {
          recognitionRef.current.stop();
          console.log('Stopped existing recognition (if any)');
        } catch (e) {
          console.log('Stop call failed (expected if not running):', e);
        }
        
        // Brief delay then start
        setTimeout(() => {
          try {
            console.log('Attempting to start speech recognition now...');
            if (recognitionRef.current && !isListening) {
              console.log('Conditions met, calling recognition.start()...');
              recognitionRef.current.start();
              console.log('recognition.start() called successfully');
              toast.info('Voice recognition started - speak now');
            } else {
              console.log('Cannot start - conditions not met:', {
                recognitionRef: !!recognitionRef.current,
                isListening: isListening
              });
            }
          } catch (startError) {
            console.error('Error starting speech recognition:', startError);
            toast.error(`Failed to start voice recognition: ${startError.message}`);
          }
        }, 200);
        
      } catch (error) {
        console.error('Error in startListening:', error);
        toast.error('Failed to start voice recognition');
      }
    } else {
      console.log('Cannot start - recognitionRef:', !!recognitionRef.current, 'isListening:', isListening);
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