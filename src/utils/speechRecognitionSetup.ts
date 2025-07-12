import { processVoiceCommand, VoiceCommand } from "@/utils/voiceCommandProcessor";
import { toast } from "sonner";

interface SpeechRecognitionSetupProps {
  onVoiceCommand?: (command: VoiceCommand) => void;
  onEnhancedVoiceInput?: (text: string) => void;
  conversationState?: { isActive: boolean };
  setIsListening: (value: boolean) => void;
  setTranscript: (value: string) => void;
  lastProcessedTranscript: string;
  setLastProcessedTranscript: (value: string) => void;
  recognitionRef: React.MutableRefObject<SpeechRecognition | null>;
}

export const setupSpeechRecognition = ({
  onVoiceCommand,
  onEnhancedVoiceInput,
  conversationState,
  setIsListening,
  setTranscript,
  lastProcessedTranscript,
  setLastProcessedTranscript,
  recognitionRef,
}: SpeechRecognitionSetupProps) => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    return null;
  }

  const recognition = new SpeechRecognition();
  
  // Configure recognition
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = localStorage.getItem('speech_language') || 'en-US';
  
  // Event handlers
  recognition.onstart = () => {
    console.log('Speech recognition started');
    setIsListening(true);
  };
  
  recognition.onresult = (event) => {
    let finalTranscript = '';
    let interimTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }
    
    const currentTranscript = finalTranscript || interimTranscript;
    setTranscript(currentTranscript);
    
    // Process final results
    if (finalTranscript && finalTranscript !== lastProcessedTranscript) {
      console.log('Processing final transcript:', finalTranscript);
      setLastProcessedTranscript(finalTranscript);
      
      // Process the command
      const command = processVoiceCommand(finalTranscript);
      
      // Call the appropriate handler
      if (onVoiceCommand) {
        onVoiceCommand(command);
      } else if (onEnhancedVoiceInput) {
        onEnhancedVoiceInput(finalTranscript);
      }
      
      // Show feedback
      if (command.type !== 'unknown') {
        toast.success(`Voice command: ${command.type.replace('_', ' ')}`);
      } else {
        toast.info(`Voice input: "${finalTranscript}"`);
      }
      
      // Clear transcript after processing
      setTimeout(() => {
        setTranscript("");
      }, 2000);
    }
  };
  
  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    
    // Don't show error for aborted recognition if TTS is speaking
    const isTTSSpeaking = (window as any).__tts_is_speaking;
    if (event.error === 'aborted' && isTTSSpeaking) {
      console.log('Speech recognition aborted due to TTS speaking - this is expected');
    } else if (event.error !== 'aborted') {
      toast.error(`Speech recognition error: ${event.error}`);
    }
    setIsListening(false);
  };
  
  recognition.onend = () => {
    console.log('Speech recognition ended');
    setIsListening(false);
    
    // Check if TTS is currently speaking
    const isTTSSpeaking = (window as any).__tts_is_speaking;
    
    // Auto-restart if we're in an active conversation and not manually stopped
    if (conversationState?.isActive && recognitionRef.current) {
      console.log('Auto-restarting voice recognition for conversation');
      
      const attemptRestart = () => {
        try {
          // Double-check conversation state and TTS state before restarting
          if (conversationState?.isActive && recognitionRef.current && !(window as any).__tts_is_speaking) {
            console.log('Conditions met, starting voice recognition...');
            recognitionRef.current.start();
            setIsListening(true);
            console.log('Voice recognition restarted successfully');
          } else if ((window as any).__tts_is_speaking) {
            console.log('TTS is still speaking, waiting longer...');
            setTimeout(attemptRestart, 1000);
          } else {
            console.log('Conversation no longer active or recognition unavailable');
          }
        } catch (error) {
          console.error('Error restarting recognition:', error);
          // Try one more time after a longer delay
          setTimeout(() => {
            try {
              if (conversationState?.isActive && recognitionRef.current && !(window as any).__tts_is_speaking) {
                recognitionRef.current.start();
                setIsListening(true);
              }
            } catch (retryError) {
              console.error('Retry failed:', retryError);
              toast.info('Voice recognition stopped. Click "Start Voice Commands" to continue.');
            }
          }, 2000);
        }
      };
      
      // If TTS is speaking, wait for it to finish
      if (isTTSSpeaking) {
        console.log('TTS is speaking, waiting for completion before restart...');
        setTimeout(attemptRestart, 3000); // Wait longer if TTS is speaking
      } else {
        setTimeout(attemptRestart, 1500); // Normal restart delay
      }
    }
  };
  
  return recognition;
};