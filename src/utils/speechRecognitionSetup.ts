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

  // Stop any existing global recognition first and wait
  if ((window as any).__global_recognition) {
    console.log('Stopping existing global recognition...');
    try {
      (window as any).__global_recognition.abort();
      (window as any).__global_recognition.onend = null;
      (window as any).__global_recognition.onerror = null;
      (window as any).__global_recognition.onresult = null;
      (window as any).__global_recognition.onstart = null;
    } catch (e) {
      console.log('Stop existing global recognition failed (expected):', e);
    }
    (window as any).__global_recognition = null;
  }

  // Ensure only one recognition instance exists globally
  if ((window as any).__creating_recognition) {
    console.log('Already creating recognition, waiting...');
    return null;
  }
  
  (window as any).__creating_recognition = true;
  
  const recognition = new SpeechRecognition();
  (window as any).__global_recognition = recognition; // Track globally
  (window as any).__creating_recognition = false;
  
  // Use the same simple configuration that works in the debug test
  recognition.continuous = false; // Single command mode like the working test
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;
  
  console.log('🔧 Speech recognition configured (simplified):', {
    continuous: recognition.continuous,
    interimResults: recognition.interimResults,
    lang: recognition.lang
  });
  
  // Event handlers
  recognition.onstart = () => {
    console.log('🎤 Speech recognition started successfully');
    setIsListening(true);
    (window as any).__speech_recognition_active = true;
    toast.success('🎤 Listening... Say "CREATE NEW ENTRY" or any command');
  };
  
  recognition.onresult = (event) => {
    console.log('🎤 Voice detected! Processing results...');
    
    let finalTranscript = '';
    let interimTranscript = '';
    
    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;
      
      console.log(`Result ${i}:`, {
        transcript: `"${transcript}"`,
        confidence: result[0].confidence,
        isFinal: result.isFinal
      });
      
      if (result.isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }
    
    const currentTranscript = finalTranscript || interimTranscript;
    setTranscript(currentTranscript);
    
    // Process final results immediately
    if (finalTranscript && finalTranscript.trim() !== lastProcessedTranscript.trim()) {
      console.log('📝 Processing final transcript:', finalTranscript);
      console.log('📝 setupSpeechRecognition: onVoiceCommand available:', !!onVoiceCommand);
      console.log('📝 setupSpeechRecognition: onEnhancedVoiceInput available:', !!onEnhancedVoiceInput);
      setLastProcessedTranscript(finalTranscript);
      
      // Process the command
      const command = processVoiceCommand(finalTranscript);
      console.log('📝 setupSpeechRecognition: Processed command:', command);
      
      // Call the appropriate handler
      if (onVoiceCommand) {
        console.log('📝 setupSpeechRecognition: Calling onVoiceCommand');
        onVoiceCommand(command);
      } else if (onEnhancedVoiceInput) {
        console.log('📝 setupSpeechRecognition: Calling onEnhancedVoiceInput with:', finalTranscript);
        onEnhancedVoiceInput(finalTranscript);
      } else {
        console.error('📝 setupSpeechRecognition: No handlers available!');
      }
      
      // Show feedback
      if (command.type !== 'unknown') {
        toast.success(`✅ Command: ${command.type.replace('_', ' ')}`);
      } else {
        toast.info(`📝 Heard: "${finalTranscript}"`);
      }
      
      // Clear transcript and restart for next command
      setTimeout(() => {
        setTranscript("");
        if (recognitionRef.current && (window as any).__speech_recognition_active) {
          try {
            console.log('🔄 Restarting for next command...');
            recognitionRef.current.start();
          } catch (error) {
            console.log('Restart failed:', error.message);
            setIsListening(false);
            (window as any).__speech_recognition_active = false;
            toast.info('Voice commands stopped. Click "Start Voice Commands" to continue.');
          }
        }
      }, 1500);
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
    
    // Show more helpful error messages
    if (event.error === 'no-speech') {
      console.log('No speech detected - this is normal when not speaking');
      toast.info('🔇 No speech detected - try speaking louder or click to restart');
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