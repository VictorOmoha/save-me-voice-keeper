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

  // Clean up any existing recognition
  if ((window as any).__global_recognition) {
    try {
      (window as any).__global_recognition.abort();
    } catch (e) {
      console.log('Cleanup of existing recognition:', e);
    }
    (window as any).__global_recognition = null;
  }

  const recognition = new SpeechRecognition();
  (window as any).__global_recognition = recognition;
  
  // Optimized configuration for continuous listening
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;
  
  console.log('🔧 Speech recognition configured with continuous listening');
  
  let restartTimeout: NodeJS.Timeout | null = null;
  let isProcessingCommand = false;
  
  // Event handlers
  recognition.onstart = () => {
    console.log('🎤 Speech recognition started - ready for commands');
    setIsListening(true);
    (window as any).__speech_recognition_active = true;
    
    // Clear any pending restarts
    if (restartTimeout) {
      clearTimeout(restartTimeout);
      restartTimeout = null;
    }
  };
  
  recognition.onresult = (event) => {
    console.log('🎤 Voice result received, processing:', event.results.length, 'results');
    
    let finalTranscript = '';
    let interimTranscript = '';
    
    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;
      
      if (result.isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }
    
    const currentTranscript = finalTranscript || interimTranscript;
    setTranscript(currentTranscript);
    
    // Process final results
    if (finalTranscript && finalTranscript.trim() !== lastProcessedTranscript.trim()) {
      console.log('📝 Processing final command:', finalTranscript);
      
      // Prevent duplicate processing
      if (isProcessingCommand) {
        console.log('📝 Already processing, skipping duplicate');
        return;
      }
      
      isProcessingCommand = true;
      setLastProcessedTranscript(finalTranscript);
      
      // Process the command
      const command = processVoiceCommand(finalTranscript);
      console.log('📝 Processed command:', command);
      
      // Call the appropriate handler
      if (onVoiceCommand) {
        console.log('📝 Calling onVoiceCommand');
        onVoiceCommand(command);
      } else if (onEnhancedVoiceInput) {
        console.log('📝 Calling onEnhancedVoiceInput with:', finalTranscript);
        onEnhancedVoiceInput(finalTranscript);
      }
      
      // Show feedback
      if (command.type !== 'unknown') {
        toast.success(`✅ Command executed: ${command.type.replace('_', ' ')}`);
      } else {
        toast.info(`📝 Processing: "${finalTranscript}"`);
      }
      
      // Reset for next command after a short delay
      setTimeout(() => {
        console.log('🔄 Resetting for next command');
        isProcessingCommand = false;
        setTranscript("");
        
        // Continue listening immediately if recognition is still active
        if ((window as any).__speech_recognition_active && recognitionRef.current) {
          console.log('🔄 Continuing to listen for next command...');
          // No need to restart - continuous mode should keep listening
        }
      }, 1000);
    }
  };
  
  recognition.onerror = (event) => {
    console.error('🚨 Speech recognition error:', event.error);
    
    // Handle different error types
    switch (event.error) {
      case 'no-speech':
        console.log('No speech detected - continuing to listen...');
        // Don't treat this as an error, just continue
        break;
        
      case 'aborted':
        console.log('Speech recognition aborted');
        setIsListening(false);
        break;
        
      case 'not-allowed':
        toast.error('Microphone access denied. Please allow microphone access.');
        setIsListening(false);
        (window as any).__speech_recognition_active = false;
        break;
        
      case 'network':
        toast.error('Network error. Retrying...');
        // Try to restart after network error
        scheduleRestart();
        break;
        
      default:
        console.log('Speech recognition error:', event.error);
        if (!['no-speech', 'aborted'].includes(event.error)) {
          scheduleRestart();
        }
    }
  };
  
  recognition.onend = () => {
    console.log('🔚 Speech recognition ended');
    setIsListening(false);
    (window as any).__speech_recognition_active = false;
    
    // Auto-restart for continuous listening
    if (recognitionRef.current && !(window as any).__manual_stop) {
      console.log('🔄 Auto-restarting speech recognition for continuous listening');
      scheduleRestart();
    }
  };
  
  // Helper function to schedule restart with backoff
  const scheduleRestart = () => {
    if (restartTimeout) {
      clearTimeout(restartTimeout);
    }
    
    restartTimeout = setTimeout(() => {
      if (recognitionRef.current && !(window as any).__manual_stop) {
        try {
          console.log('🔄 Restarting speech recognition...');
          recognitionRef.current.start();
        } catch (error) {
          console.log('Restart failed:', error.message);
          
          // If restart fails, try again with longer delay
          if (error.message.includes('already started')) {
            console.log('Recognition already running');
          } else {
            setTimeout(() => scheduleRestart(), 2000);
          }
        }
      }
    }, 500);
  };
  
  return recognition;
};
