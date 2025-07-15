
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
    console.error('🚨 Speech recognition not supported');
    return null;
  }

  // Clean up any existing recognition
  if ((window as any).__global_recognition) {
    try {
      (window as any).__global_recognition.abort();
    } catch (e) {
      console.log('🧹 Cleanup of existing recognition:', e);
    }
    (window as any).__global_recognition = null;
  }

  const recognition = new SpeechRecognition();
  (window as any).__global_recognition = recognition;
  
  // Configuration for reliable continuous listening
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;
  
  console.log('🔧 SETUP: Speech recognition configured');
  
  let restartTimeout: NodeJS.Timeout | null = null;
  let isProcessingCommand = false;
  let commandCounter = 0;
  
  // Event handlers
  recognition.onstart = () => {
    console.log('🎤 SETUP: Speech recognition started - ready for commands');
    setIsListening(true);
    (window as any).__speech_recognition_active = true;
    
    // Clear any pending restarts
    if (restartTimeout) {
      clearTimeout(restartTimeout);
      restartTimeout = null;
    }
  };
  
  recognition.onresult = (event) => {
    console.log(`🎤 SETUP: Voice result received - ${event.results.length} results, processing: ${isProcessingCommand}`);
    
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
    
    // Process final results with strict duplicate prevention
    if (finalTranscript && finalTranscript.trim() !== lastProcessedTranscript.trim()) {
      console.log(`📝 SETUP: Processing final command [${++commandCounter}]:`, finalTranscript);
      console.log(`📝 SETUP: Last processed was:`, lastProcessedTranscript);
      
      // Strict duplicate and processing check
      if (isProcessingCommand) {
        console.log('⚠️ SETUP: Already processing command, skipping duplicate');
        return;
      }
      
      // Check if this is too similar to recent command
      const similarity = calculateSimilarity(finalTranscript.trim(), lastProcessedTranscript.trim());
      if (similarity > 0.8 && lastProcessedTranscript.length > 0) {
        console.log(`⚠️ SETUP: Command too similar (${similarity}), skipping:`, finalTranscript);
        return;
      }
      
      isProcessingCommand = true;
      setLastProcessedTranscript(finalTranscript);
      console.log(`🔒 SETUP: Locked processing for command [${commandCounter}]`);
      
      // Process the command
      try {
        const command = processVoiceCommand(finalTranscript);
        console.log(`📝 SETUP: Processed command [${commandCounter}]:`, command);
        
        // Call the appropriate handler
        if (onVoiceCommand) {
          console.log(`📝 SETUP: Calling onVoiceCommand [${commandCounter}]`);
          onVoiceCommand(command);
        } else if (onEnhancedVoiceInput) {
          console.log(`📝 SETUP: Calling onEnhancedVoiceInput [${commandCounter}] with:`, finalTranscript);
          onEnhancedVoiceInput(finalTranscript);
        }
        
        // Show feedback only once
        if (command.type !== 'unknown') {
          console.log(`✅ SETUP: Showing success toast for command [${commandCounter}]`);
          toast.success(`✅ Command ${commandCounter}: ${command.type.replace('_', ' ')}`);
        } else {
          console.log(`ℹ️ SETUP: Showing info toast for command [${commandCounter}]`);
          toast.info(`📝 Processing: "${finalTranscript}"`);
        }
      } catch (error) {
        console.error(`🚨 SETUP: Error processing command [${commandCounter}]:`, error);
        toast.error('Failed to process voice command');
      }
      
      // Reset for next command with longer delay to prevent duplicates
      setTimeout(() => {
        console.log(`🔓 SETUP: Unlocking processing after command [${commandCounter}]`);
        isProcessingCommand = false;
        setTranscript("");
        
        // Continue listening for next command
        if ((window as any).__speech_recognition_active && recognitionRef.current) {
          console.log(`🔄 SETUP: Ready for next command after [${commandCounter}]`);
        }
      }, 2000); // Increased delay to prevent duplicates
    }
  };
  
  recognition.onerror = (event) => {
    console.error(`🚨 SETUP: Speech recognition error [${commandCounter}]:`, event.error);
    
    // Handle different error types
    switch (event.error) {
      case 'no-speech':
        console.log('🔇 SETUP: No speech detected - continuing to listen...');
        break;
        
      case 'aborted':
        console.log('🛑 SETUP: Speech recognition aborted');
        setIsListening(false);
        isProcessingCommand = false;
        break;
        
      case 'not-allowed':
        console.error('🚫 SETUP: Microphone access denied');
        toast.error('Microphone access denied. Please allow microphone access.');
        setIsListening(false);
        (window as any).__speech_recognition_active = false;
        isProcessingCommand = false;
        break;
        
      case 'network':
        console.error('🌐 SETUP: Network error, attempting restart');
        toast.error('Network error. Retrying...');
        scheduleRestart();
        break;
        
      default:
        console.log(`🚨 SETUP: Speech recognition error [${commandCounter}]:`, event.error);
        if (!['no-speech', 'aborted'].includes(event.error)) {
          scheduleRestart();
        }
    }
  };
  
  recognition.onend = () => {
    console.log(`🔚 SETUP: Speech recognition ended [${commandCounter}]`);
    setIsListening(false);
    (window as any).__speech_recognition_active = false;
    
    // Auto-restart for continuous listening if not manually stopped
    if (recognitionRef.current && !(window as any).__manual_stop && !isProcessingCommand) {
      console.log(`🔄 SETUP: Auto-restarting after command [${commandCounter}]`);
      scheduleRestart();
    } else {
      console.log(`🚫 SETUP: Not restarting - manual stop: ${!!(window as any).__manual_stop}, processing: ${isProcessingCommand}`);
    }
  };
  
  // Helper function to schedule restart with backoff
  const scheduleRestart = () => {
    if (restartTimeout) {
      clearTimeout(restartTimeout);
    }
    
    restartTimeout = setTimeout(() => {
      if (recognitionRef.current && !(window as any).__manual_stop && !isProcessingCommand) {
        try {
          console.log(`🔄 SETUP: Attempting restart after command [${commandCounter}]`);
          recognitionRef.current.start();
        } catch (error) {
          console.log(`❌ SETUP: Restart failed [${commandCounter}]:`, error.message);
          
          if (error.message.includes('already started')) {
            console.log('✅ SETUP: Recognition already running');
            setIsListening(true);
          } else {
            // Retry with longer delay
            setTimeout(() => scheduleRestart(), 2000);
          }
        }
      }
    }, 1000);
  };
  
  return recognition;
};

// Helper function to calculate string similarity
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}
