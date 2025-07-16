
import { VoiceCommand, processVoiceCommand } from './voiceCommandProcessor';
import { toast } from 'sonner';

interface SpeechRecognitionSetupProps {
  onVoiceCommand?: (command: VoiceCommand) => void;
  onEnhancedVoiceInput?: (text: string) => void;
  conversationState?: { isActive: boolean; currentStep?: { question: string } };
  setIsListening: (value: boolean) => void;
  setTranscript: (value: string) => void;
  lastProcessedTranscript: string;
  setLastProcessedTranscript: (value: string) => void;
  recognitionRef: React.MutableRefObject<SpeechRecognition | null>;
}

// Global flag to prevent multiple recognition instances
let globalRecognitionActive = false;

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
    console.error('Speech recognition not supported');
    return null;
  }

  // Check if recognition is already active globally
  if (globalRecognitionActive && recognitionRef.current) {
    console.log('🔄 SETUP: Using existing recognition instance');
    return recognitionRef.current;
  }

  const recognition = new SpeechRecognition();
  
  // Configure recognition settings
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;

  // Prevent too frequent restarts
  let isRestarting = false;
  let restartTimeout: NodeJS.Timeout | null = null;
  let commandCounter = 0;
  let consecutiveErrors = 0;
  const MAX_CONSECUTIVE_ERRORS = 3;

  recognition.onstart = () => {
    console.log('🎤 SETUP: Speech recognition started successfully');
    setIsListening(true);
    globalRecognitionActive = true;
    (window as any).__speech_recognition_active = true;
    isRestarting = false;
    consecutiveErrors = 0;
  };

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript.trim();
      
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    // Update transcript display
    const currentTranscript = finalTranscript || interimTranscript;
    setTranscript(currentTranscript);

    // Process final results
    if (finalTranscript && finalTranscript !== lastProcessedTranscript) {
      console.log('🔄 SETUP: Processing final transcript:', finalTranscript);
      
      commandCounter++;
      setLastProcessedTranscript(finalTranscript);
      
      // Clear processed commands cache periodically
      if (commandCounter % 5 === 0) {
        console.log('🧹 SETUP: Cleared processed commands cache');
        (window as any).__processed_commands = new Set();
      }

      // Process the command
      try {
        if (conversationState?.isActive && onEnhancedVoiceInput) {
          console.log('🗣️ SETUP: Conversation mode - using enhanced input');
          onEnhancedVoiceInput(finalTranscript);
        } else if (onVoiceCommand) {
          console.log('🎯 SETUP: Command mode - processing voice command');
          const command = processVoiceCommand(finalTranscript);
          onVoiceCommand(command);
        } else if (onEnhancedVoiceInput) {
          console.log('🔄 SETUP: Fallback to enhanced input');
          onEnhancedVoiceInput(finalTranscript);
        }

        // Dispatch custom event for logging
        window.dispatchEvent(new CustomEvent('voice-command-processed', {
          detail: {
            commandNumber: commandCounter,
            command: finalTranscript,
            timestamp: new Date().toLocaleTimeString()
          }
        }));
      } catch (error) {
        console.error('🚨 SETUP: Error processing command:', error);
      }
    }
  };

  recognition.onerror = (event) => {
    console.error('🚨 SETUP: Speech recognition error:', event.error);
    consecutiveErrors++;
    
    // Handle specific errors
    if (event.error === 'not-allowed') {
      toast.error('Microphone access denied. Please allow microphone access and try again.');
      setIsListening(false);
      globalRecognitionActive = false;
      return;
    }
    
    if (event.error === 'audio-capture') {
      toast.error('No microphone found. Please check your microphone connection.');
      setIsListening(false);
      globalRecognitionActive = false;
      return;
    } 
    
    if (event.error === 'network') {
      toast.error('Network error. Please check your internet connection.');
      setIsListening(false);
      globalRecognitionActive = false;
      return;
    }

    // Stop restarting after too many consecutive errors
    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      console.log('🛑 SETUP: Too many consecutive errors, stopping auto-restart');
      setIsListening(false);
      globalRecognitionActive = false;
      toast.error('Voice recognition encountered multiple errors. Please try restarting manually.');
      return;
    }
    
    // Only restart for recoverable errors and if not manually stopped
    if (!isRestarting && !(window as any).__manual_stop && 
        ['no-speech', 'aborted'].includes(event.error)) {
      scheduleRestart();
    } else {
      setIsListening(false);
      globalRecognitionActive = false;
    }
  };

  recognition.onend = () => {
    console.log('🔚 SETUP: Speech recognition ended');
    setIsListening(false);
    globalRecognitionActive = false;
    (window as any).__speech_recognition_active = false;
    
    // Only restart if not manually stopped and not too many errors
    if (!isRestarting && !(window as any).__manual_stop && consecutiveErrors < MAX_CONSECUTIVE_ERRORS) {
      scheduleRestart();
    }
  };

  const scheduleRestart = () => {
    if (isRestarting || (window as any).__manual_stop || globalRecognitionActive) {
      return;
    }
    
    isRestarting = true;
    console.log('🔄 SETUP: Scheduling restart in 3 seconds...');
    
    // Clear any existing restart timeout
    if (restartTimeout) {
      clearTimeout(restartTimeout);
    }
    
    restartTimeout = setTimeout(() => {
      if (!(window as any).__manual_stop && !globalRecognitionActive) {
        try {
          console.log('🔄 SETUP: Attempting restart');
          recognition.start();
        } catch (error) {
          console.error('🚨 SETUP: Failed to restart:', error);
          isRestarting = false;
          consecutiveErrors++;
        }
      } else {
        isRestarting = false;
      }
    }, 3000); // Increased delay to prevent rapid restarts
  };

  // Cleanup function
  const cleanup = () => {
    console.log('🧹 SETUP: Cleaning up speech recognition');
    if (restartTimeout) {
      clearTimeout(restartTimeout);
      restartTimeout = null;
    }
    isRestarting = false;
    globalRecognitionActive = false;
    (window as any).__manual_stop = true;
    try {
      recognition.abort();
    } catch (error) {
      console.log('Error during cleanup:', error);
    }
  };

  // Store cleanup function on the recognition object
  (recognition as any).cleanup = cleanup;

  return recognition;
};
