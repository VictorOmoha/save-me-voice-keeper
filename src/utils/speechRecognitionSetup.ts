
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
  
  // Configure recognition settings for CONTINUOUS listening
  recognition.continuous = true;  // CRITICAL FIX: Enable continuous listening
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;

  // Enhanced conversation management
  let commandCounter = 0;
  let consecutiveErrors = 0;
  let lastCommandTime = Date.now();
  let silenceTimeout: NodeJS.Timeout | null = null;
  let conversationContext: any = null;
  const MAX_CONSECUTIVE_ERRORS = 3;
  const SILENCE_TIMEOUT = 15000; // 15 seconds of silence before auto-stop
  const COMMAND_COOLDOWN = 1000; // 1 second between commands

  recognition.onstart = () => {
    console.log('🎤 SETUP: Continuous speech recognition started');
    setIsListening(true);
    globalRecognitionActive = true;
    (window as any).__speech_recognition_active = true;
    consecutiveErrors = 0;
    
    // Reset silence timeout
    if (silenceTimeout) {
      clearTimeout(silenceTimeout);
    }
    
    // Set silence timeout for auto-stop
    silenceTimeout = setTimeout(() => {
      if (!(window as any).__manual_stop && globalRecognitionActive) {
        console.log('🔇 SETUP: Auto-stopping due to silence timeout');
        recognition.stop();
        toast.info('Voice recognition paused due to inactivity');
      }
    }, SILENCE_TIMEOUT);
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

    // Process final results with improved timing
    if (finalTranscript && finalTranscript !== lastProcessedTranscript) {
      const now = Date.now();
      
      // Prevent rapid-fire duplicate commands
      if (now - lastCommandTime < COMMAND_COOLDOWN) {
        console.log('🕒 SETUP: Command cooldown active, skipping');
        return;
      }
      
      console.log('🔄 SETUP: Processing final transcript:', finalTranscript);
      
      commandCounter++;
      setLastProcessedTranscript(finalTranscript);
      lastCommandTime = now;
      
      // Reset silence timeout on new command
      if (silenceTimeout) {
        clearTimeout(silenceTimeout);
      }
      
      // Clear processed commands cache periodically
      if (commandCounter % 5 === 0) {
        console.log('🧹 SETUP: Cleared processed commands cache');
        (window as any).__processed_commands = new Set();
      }

      // Process the command with context preservation
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
            timestamp: new Date().toLocaleTimeString(),
            continuous: true
          }
        }));

        // Provide immediate feedback for continuous listening
        import('@/utils/textToSpeech').then(({ speak }) => {
          // Only give feedback if it's a successful command and not during conversation
          if (!conversationState?.isActive) {
            // Brief confirmation without interrupting flow
            setTimeout(() => {
              if (globalRecognitionActive && !(window as any).__manual_stop) {
                console.log('🔄 SETUP: Ready for next command');
                // Don't speak feedback to avoid interrupting natural flow
              }
            }, 500);
          }
        });

        // Set new silence timeout after command processing
        silenceTimeout = setTimeout(() => {
          if (!(window as any).__manual_stop && globalRecognitionActive) {
            console.log('🔇 SETUP: Auto-stopping due to silence timeout');
            recognition.stop();
            toast.info('Voice recognition paused - say "start listening" to resume');
          }
        }, SILENCE_TIMEOUT);

      } catch (error) {
        console.error('🚨 SETUP: Error processing command:', error);
        consecutiveErrors++;
      }
    }
  };

  recognition.onerror = (event) => {
    console.error('🚨 SETUP: Speech recognition error:', event.error);
    consecutiveErrors++;
    
    // Clear silence timeout on error
    if (silenceTimeout) {
      clearTimeout(silenceTimeout);
    }
    
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
      console.log('🛑 SETUP: Too many consecutive errors, stopping continuous recognition');
      setIsListening(false);
      globalRecognitionActive = false;
      toast.error('Voice recognition encountered multiple errors. Please restart manually.');
      return;
    }
    
    // For continuous mode, handle aborted errors more gracefully
    if (event.error === 'aborted' && (window as any).__manual_stop) {
      console.log('🛑 SETUP: Manual stop detected, not restarting');
      setIsListening(false);
      globalRecognitionActive = false;
      return;
    }
    
    // Auto-restart for recoverable errors in continuous mode
    if (!((window as any).__manual_stop) && ['no-speech', 'aborted'].includes(event.error)) {
      console.log('🔄 SETUP: Recoverable error, attempting immediate restart');
      setTimeout(() => {
        if (!(window as any).__manual_stop && !globalRecognitionActive) {
          try {
            recognition.start();
          } catch (restartError) {
            console.error('🚨 SETUP: Failed to restart after error:', restartError);
          }
        }
      }, 1000); // Quick restart for continuous flow
    }
  };

  recognition.onend = () => {
    console.log('🔚 SETUP: Speech recognition ended');
    setIsListening(false);
    globalRecognitionActive = false;
    (window as any).__speech_recognition_active = false;
    
    // Clear silence timeout
    if (silenceTimeout) {
      clearTimeout(silenceTimeout);
    }
    
    // Auto-restart unless manually stopped or too many errors
    if (!(window as any).__manual_stop && consecutiveErrors < MAX_CONSECUTIVE_ERRORS) {
      console.log('🔄 SETUP: Auto-restarting continuous recognition');
      setTimeout(() => {
        if (!(window as any).__manual_stop && !globalRecognitionActive) {
          try {
            recognition.start();
            toast.info('🎤 Voice recognition resumed');
          } catch (error) {
            console.error('🚨 SETUP: Failed to auto-restart:', error);
            consecutiveErrors++;
          }
        }
      }, 2000); // 2-second delay for smooth restart
    }
  };

  // Enhanced cleanup function
  const cleanup = () => {
    console.log('🧹 SETUP: Cleaning up continuous speech recognition');
    
    if (silenceTimeout) {
      clearTimeout(silenceTimeout);
      silenceTimeout = null;
    }
    
    globalRecognitionActive = false;
    (window as any).__manual_stop = true;
    
    try {
      recognition.abort();
    } catch (error) {
      console.log('Error during cleanup:', error);
    }
  };

  // Store cleanup function and context on the recognition object
  (recognition as any).cleanup = cleanup;
  (recognition as any).setConversationContext = (context: any) => {
    conversationContext = context;
  };

  return recognition;
};
