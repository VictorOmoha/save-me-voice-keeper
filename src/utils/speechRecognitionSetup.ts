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
  
  
  let restartAttempts = 0;
  const maxRestartAttempts = 3;
  
  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    
    // Don't show errors for common/expected issues
    const isTTSSpeaking = (window as any).__tts_is_speaking;
    
    if (event.error === 'aborted' && isTTSSpeaking) {
      console.log('Speech recognition aborted due to TTS speaking - this is expected');
      return;
    }
    
    // Don't show toast errors for no-speech - this is normal when user isn't speaking
    if (event.error === 'no-speech') {
      console.log('No speech detected - this is normal');
      restartAttempts++;
      setIsListening(false);
      return;
    }
    
    // Only show serious errors
    if (event.error !== 'aborted' && event.error !== 'no-speech') {
      toast.error(`Speech recognition error: ${event.error}`);
    }
    
    setIsListening(false);
  };
  
  recognition.onend = () => {
    console.log('Speech recognition ended');
    setIsListening(false);
    
    // Check if TTS is currently speaking
    const isTTSSpeaking = (window as any).__tts_is_speaking;
    
    // Only auto-restart if we're in an active conversation AND we haven't had too many restart attempts
    if (conversationState?.isActive && restartAttempts < maxRestartAttempts && recognitionRef.current) {
      console.log('Auto-restarting voice recognition for conversation (attempt', restartAttempts + 1, 'of', maxRestartAttempts, ')');
      
      const attemptRestart = () => {
        try {
          // Critical: Check microphone availability before restart
          const isTTSSpeaking = (window as any).__tts_is_speaking;
          
          if (conversationState?.isActive && recognitionRef.current && !isTTSSpeaking) {
            console.log('Conditions met, starting voice recognition...');
            recognitionRef.current.start();
            setIsListening(true);
            console.log('Voice recognition restarted successfully');
            // Reset restart attempts on successful restart
            restartAttempts = 0;
          } else if (isTTSSpeaking) {
            console.log('TTS is still speaking, waiting longer...');
            setTimeout(attemptRestart, 2000); // Wait even longer
          } else {
            console.log('Conversation no longer active or recognition unavailable');
          }
        } catch (error) {
          console.error('Error restarting recognition:', error);
          restartAttempts++;
          
          // Only try final retry if we haven't exceeded max attempts
          if (restartAttempts < maxRestartAttempts) {
            setTimeout(() => {
              try {
                if (conversationState?.isActive && recognitionRef.current && !(window as any).__tts_is_speaking) {
                  recognitionRef.current.start();
                  setIsListening(true);
                  console.log('Voice recognition restarted on retry');
                  restartAttempts = 0;
                }
              } catch (retryError) {
                console.error('Retry failed:', retryError);
                restartAttempts++;
              }
            }, 3000 * restartAttempts); // Exponential backoff
          } else {
            console.log('Max restart attempts reached, stopping auto-restart');
            toast.info('Voice recognition stopped. Click "Start Voice Commands" to continue.');
          }
        }
      };
      
      // Calculate delay with exponential backoff
      const delay = isTTSSpeaking ? 3000 : Math.min(1500 * Math.pow(2, restartAttempts), 10000);
      
      console.log('Scheduling restart with delay:', delay);
      setTimeout(attemptRestart, delay);
    } else if (restartAttempts >= maxRestartAttempts) {
      console.log('Max restart attempts reached, not auto-restarting');
      restartAttempts = 0; // Reset for next manual start
    }
  };
  
  return recognition;
};