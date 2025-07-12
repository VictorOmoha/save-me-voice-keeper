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

  // Stop any existing global recognition first
  if ((window as any).__global_recognition) {
    console.log('Stopping existing global recognition...');
    try {
      (window as any).__global_recognition.abort();
    } catch (e) {
      console.log('Stop existing global recognition failed (expected):', e);
    }
    (window as any).__global_recognition = null;
  }

  const recognition = new SpeechRecognition();
  (window as any).__global_recognition = recognition; // Track globally
  
  // Configure recognition
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = localStorage.getItem('speech_language') || 'en-US';
  
  // Event handlers
  recognition.onstart = () => {
    console.log('Speech recognition started successfully');
    setIsListening(true);
    // Set global flag for tracking
    (window as any).__speech_recognition_active = true;
    toast.success('🎤 Listening for voice commands - try saying "Create new entry"');
  };
  
  recognition.onresult = (event) => {
    console.log('🎤 Voice input detected!', event);
    let finalTranscript = '';
    let interimTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      console.log(`Result ${i}: "${transcript}" (confidence: ${event.results[i][0].confidence}, final: ${event.results[i].isFinal})`);
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }
    
    const currentTranscript = finalTranscript || interimTranscript;
    console.log('Current transcript:', currentTranscript);
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
    console.error('🚨 Speech recognition error:', event.error, event);
    
    // Don't show errors for common/expected issues
    const isTTSSpeaking = (window as any).__tts_is_speaking;
    
    if (event.error === 'aborted' && isTTSSpeaking) {
      console.log('Speech recognition aborted due to TTS speaking - this is expected');
      return;
    }
    
    // Don't show toast errors for no-speech - this is normal when user isn't speaking
    if (event.error === 'no-speech') {
      console.log('No speech detected - this is normal, keep listening...');
      toast.info('🔇 No speech detected - please speak louder or closer to microphone');
      restartAttempts++;
      setIsListening(false);
      return;
    }
    
    // Show more specific error messages
    let errorMessage = `Speech recognition error: ${event.error}`;
    if (event.error === 'not-allowed') {
      errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings.';
    } else if (event.error === 'network') {
      errorMessage = 'Network error. Please check your internet connection.';
    } else if (event.error === 'audio-capture') {
      errorMessage = 'No microphone found. Please check your microphone connection.';
    }
    
    // Only show serious errors
    if (event.error !== 'aborted' && event.error !== 'no-speech') {
      toast.error(errorMessage);
    }
    
    setIsListening(false);
  };
  
  recognition.onend = () => {
    console.log('Speech recognition ended');
    setIsListening(false);
    // Clear global flag
    (window as any).__speech_recognition_active = false;
    (window as any).__global_recognition = null; // Clear global reference
    
    // Simple restart logic for conversation mode
    if (conversationState?.isActive && restartAttempts < maxRestartAttempts && recognitionRef.current) {
      console.log('Auto-restarting for conversation (attempt', restartAttempts + 1, 'of', maxRestartAttempts, ')');
      
      restartAttempts++;
      
      const attemptRestart = () => {
        try {
          // Check if we should still restart
          if (conversationState?.isActive && recognitionRef.current && !(window as any).__tts_is_speaking) {
            console.log('Restarting voice recognition...');
            recognitionRef.current.start();
            console.log('Voice recognition restarted successfully');
            restartAttempts = 0; // Reset on success
          } else if ((window as any).__tts_is_speaking) {
            console.log('TTS speaking, will wait for TTS completion event');
          } else {
            console.log('Conversation ended or recognition unavailable');
          }
        } catch (error) {
          console.log('Restart failed:', error.message);
          
          if (restartAttempts < maxRestartAttempts) {
            // Try again with longer delay
            setTimeout(attemptRestart, 2000 * restartAttempts);
          } else {
            console.log('Max restart attempts reached');
            toast.info('Voice recognition stopped. Click "Start Voice Commands" to continue.');
            restartAttempts = 0;
          }
        }
      };
      
      // Wait for any audio cleanup before restart
      const delay = (window as any).__tts_is_speaking ? 500 : 1000;
      setTimeout(attemptRestart, delay);
    } else if (restartAttempts >= maxRestartAttempts) {
      console.log('Max restart attempts reached, resetting counter');
      restartAttempts = 0;
    }
  };
  
  return recognition;
};