
import { toast } from "sonner";
import { logVoice, logError } from "@/utils/logger";

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
    logVoice('=== Starting voice recognition ===');
    
    if (!isSupported) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }
    
    if (isListening) {
      logVoice('Already listening');
      return;
    }
    
    if (!recognitionRef.current) {
      logError('No recognition reference available');
      toast.error('Speech recognition not properly initialized');
      return;
    }
    
    // Check microphone permissions
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      logError('Microphone access error:', error);
      toast.error('Unable to access microphone. Please check your permissions.');
      return;
    }
    
    // Wait for TTS to finish if speaking
    if (window.__tts_is_speaking) {
      logVoice('Waiting for TTS to finish before starting listening...');
      toast.info('Waiting for system to finish speaking...');

      const waitForTTS = () => {
        if (!window.__tts_is_speaking) {
          // Don't recursively call startListening - directly start recognition
          try {
            window.__manual_stop = false;
            setTranscript("");
            setLastProcessedTranscript("");
            recognitionRef.current?.start();
            logVoice('Speech recognition started after TTS finished');
          } catch (e) {
            logVoice('Could not start after TTS:', e);
          }
        } else {
          setTimeout(waitForTTS, 500);
        }
      };
      setTimeout(waitForTTS, 500);
      return;
    }
    
    try {
      logVoice('Starting speech recognition...');
      
      // Clear manual stop flag and reset state
      window.__manual_stop = false;
      setTranscript("");
      setLastProcessedTranscript("");
      
      // Start recognition
      recognitionRef.current.start();
      logVoice('Speech recognition started successfully');
      
      toast.success('🎤 Voice recognition active - speak your commands!', {
        description: 'Say your voice commands clearly.',
        duration: 3000,
      });
      
    } catch (error) {
      logError('Error starting speech recognition:', error);
      
      if (error.name === 'InvalidStateError') {
        logVoice('Recognition already running, continuing...');
        setIsListening(true);
        toast.success('🎤 Voice recognition already active');
      } else {
        toast.error(`Failed to start voice recognition: ${error.message}`);
      }
    }
  };

  const stopListening = () => {
    logVoice('=== Stopping voice recognition ===');
    
    // Set manual stop flag to prevent auto-restart
    window.__manual_stop = true;
    
    if (recognitionRef.current && isListening) {
      try {
        // Call cleanup if available
        if ((recognitionRef.current as any).cleanup) {
          (recognitionRef.current as any).cleanup();
        }
        
        recognitionRef.current.stop();
        logVoice('Speech recognition stopped manually');
        toast.info('🔇 Voice recognition stopped - click start to resume');
      } catch (error) {
        logError('Error stopping recognition:', error);
      }
    }
    
    // Clean up global flags
    window.__speech_recognition_active = false;
    setIsListening(false);
  };

  const resetListening = () => {
    logVoice('=== Resetting voice recognition ===');
    
    // Set manual stop flag and abort
    window.__manual_stop = true;
    
    if (recognitionRef.current) {
      try {
        // Call cleanup if available
        if ((recognitionRef.current as any).cleanup) {
          (recognitionRef.current as any).cleanup();
        }
        
        recognitionRef.current.abort();
      } catch (error) {
        logError('Error aborting recognition:', error);
      }
    }
    
    // Reset all state
    setTranscript("");
    setLastProcessedTranscript("");
    setIsListening(false);
    window.__speech_recognition_active = false;
    window.__processed_commands = new Set();
    
    // Clear manual stop flag immediately after reset (not delayed)
    window.__manual_stop = false;
    
    toast.success('🔄 Voice recognition reset - ready for commands', {
      description: 'Click "Start Voice Commands" to begin listening',
    });
  };

  return {
    startListening,
    stopListening,
    resetListening,
  };
};
