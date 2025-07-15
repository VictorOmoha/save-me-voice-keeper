
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
  
  // Optimized configuration for better accuracy
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;
  
  console.log('🔧 Speech recognition configured with optimized settings');
  
  let restartAttempts = 0;
  const maxRestartAttempts = 3;
  let isProcessingCommand = false;
  
  // Event handlers
  recognition.onstart = () => {
    console.log('🎤 Speech recognition started successfully');
    setIsListening(true);
    (window as any).__speech_recognition_active = true;
    restartAttempts = 0; // Reset on successful start
    toast.success('🎤 Voice recognition active - speak your command');
  };
  
  recognition.onresult = (event) => {
    if (isProcessingCommand) {
      console.log('Already processing a command, ignoring new results');
      return;
    }

    console.log('🎤 Voice detected! Processing results...');
    
    let finalTranscript = '';
    let interimTranscript = '';
    let maxConfidence = 0;
    
    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence || 0;
      
      console.log(`Result ${i}:`, {
        transcript: `"${transcript}"`,
        confidence: confidence,
        isFinal: result.isFinal
      });
      
      if (result.isFinal) {
        finalTranscript += transcript;
        maxConfidence = Math.max(maxConfidence, confidence);
      } else {
        interimTranscript += transcript;
      }
    }
    
    const currentTranscript = finalTranscript || interimTranscript;
    setTranscript(currentTranscript);
    
    // Process final results
    if (finalTranscript && finalTranscript.trim() !== lastProcessedTranscript.trim()) {
      console.log('📝 Processing final transcript:', finalTranscript);
      console.log('📝 Confidence level:', maxConfidence);
      
      // Set processing flag to prevent duplicate processing
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
      } else {
        console.error('📝 No handlers available!');
      }
      
      // Show feedback based on command recognition
      if (command.type !== 'unknown') {
        toast.success(`✅ Command recognized: ${command.type.replace('_', ' ')}`);
      } else {
        toast.info(`📝 Heard: "${finalTranscript}" - trying to interpret...`);
      }
      
      // Reset processing flag and restart for next command
      setTimeout(() => {
        isProcessingCommand = false;
        setTranscript("");
        
        // Auto-restart for continuous listening
        if (recognitionRef.current && (window as any).__speech_recognition_active) {
          try {
            console.log('🔄 Restarting for next command...');
            recognitionRef.current.start();
          } catch (error) {
            console.log('Restart failed:', error.message);
            // Don't spam with error messages for expected restart failures
            if (error.message.includes('already started')) {
              console.log('Recognition already running, continuing...');
            } else {
              setIsListening(false);
              (window as any).__speech_recognition_active = false;
              toast.info('Voice recognition stopped. Click to restart.');
            }
          }
        }
      }, 2000);
    }
  };
  
  recognition.onerror = (event) => {
    console.error('🚨 Speech recognition error:', event.error);
    
    // Handle different error types appropriately
    switch (event.error) {
      case 'no-speech':
        console.log('No speech detected - this is normal');
        // Don't show error for no-speech, just continue
        break;
        
      case 'aborted':
        console.log('Speech recognition aborted - this may be intentional');
        break;
        
      case 'not-allowed':
        toast.error('Microphone access denied. Please allow microphone access in your browser settings.');
        setIsListening(false);
        break;
        
      case 'network':
        toast.error('Network error. Please check your internet connection.');
        setIsListening(false);
        break;
        
      case 'audio-capture':
        toast.error('No microphone found. Please check your microphone connection.');
        setIsListening(false);
        break;
        
      default:
        // Only show error toast for serious issues
        if (!['no-speech', 'aborted'].includes(event.error)) {
          toast.error(`Voice recognition error: ${event.error}`);
        }
        setIsListening(false);
    }
  };
  
  recognition.onend = () => {
    console.log('🔚 Speech recognition ended');
    setIsListening(false);
    (window as any).__speech_recognition_active = false;
    (window as any).__global_recognition = null;
    
    // Smart restart logic
    const shouldRestart = conversationState?.isActive && 
                         restartAttempts < maxRestartAttempts && 
                         recognitionRef.current &&
                         !(window as any).__tts_is_speaking;
    
    if (shouldRestart) {
      console.log(`Auto-restarting voice recognition (attempt ${restartAttempts + 1}/${maxRestartAttempts})`);
      restartAttempts++;
      
      const attemptRestart = () => {
        try {
          if (conversationState?.isActive && recognitionRef.current) {
            console.log('Restarting voice recognition...');
            recognitionRef.current.start();
          }
        } catch (error) {
          console.log('Restart failed:', error.message);
          
          if (restartAttempts < maxRestartAttempts) {
            // Exponential backoff for retries
            setTimeout(attemptRestart, 1000 * Math.pow(2, restartAttempts));
          } else {
            console.log('Max restart attempts reached');
            toast.info('Voice recognition stopped. Click "Start Voice Commands" to continue.');
            restartAttempts = 0;
          }
        }
      };
      
      // Wait before restart to allow cleanup
      setTimeout(attemptRestart, 1000);
    }
  };
  
  return recognition;
};
