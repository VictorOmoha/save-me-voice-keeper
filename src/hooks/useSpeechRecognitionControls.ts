
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
      console.log('Already listening continuously');
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
      console.log('Waiting for TTS to finish before starting continuous listening...');
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
      
      // Start continuous recognition
      recognitionRef.current.start();
      console.log('Continuous speech recognition started successfully');
      
      toast.success('🎤 Continuous voice recognition active - speak multiple commands!', {
        description: 'I\'ll keep listening for your commands. Say "stop listening" to pause.',
        duration: 4000,
      });
      
    } catch (error) {
      console.error('Error starting continuous speech recognition:', error);
      
      if (error.name === 'InvalidStateError') {
        console.log('Recognition already running, continuing...');
        setIsListening(true);
        toast.success('🎤 Continuous voice recognition already active');
      } else {
        toast.error(`Failed to start voice recognition: ${error.message}`);
      }
    }
  };

  const stopListening = () => {
    console.log('=== Stopping continuous voice recognition ===');
    
    // Set manual stop flag to prevent auto-restart
    (window as any).__manual_stop = true;
    
    if (recognitionRef.current && isListening) {
      try {
        // Call cleanup if available
        if ((recognitionRef.current as any).cleanup) {
          (recognitionRef.current as any).cleanup();
        }
        
        recognitionRef.current.stop();
        console.log('Continuous speech recognition stopped manually');
        toast.info('🔇 Continuous voice recognition stopped - click start to resume');
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
    
    // Clean up global flags
    (window as any).__speech_recognition_active = false;
    setIsListening(false);
  };

  const resetListening = () => {
    console.log('=== Resetting continuous voice recognition ===');
    
    // Set manual stop flag and abort
    (window as any).__manual_stop = true;
    
    if (recognitionRef.current) {
      try {
        // Call cleanup if available
        if ((recognitionRef.current as any).cleanup) {
          (recognitionRef.current as any).cleanup();
        }
        
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
    (window as any).__processed_commands = new Set();
    
    // Clear manual stop flag after reset
    setTimeout(() => {
      (window as any).__manual_stop = false;
    }, 1000);
    
    toast.success('🔄 Voice recognition reset - ready for continuous commands', {
      description: 'Click "Start Voice Commands" to begin listening continuously',
    });
  };

  return {
    startListening,
    stopListening,
    resetListening,
  };
};
