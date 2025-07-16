
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

  const recognition = new SpeechRecognition();
  
  // Configure recognition settings
  recognition.continuous = false; // Change to false to prevent constant restarts
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;

  // Prevent too frequent restarts
  let isRestarting = false;
  let restartTimeout: NodeJS.Timeout | null = null;
  let commandCounter = 0;
  let isRecognitionRunning = false;

  recognition.onstart = () => {
    console.log('🎤 SETUP: Speech recognition started - ready for individual commands');
    setIsListening(true);
    (window as any).__speech_recognition_active = true;
    isRestarting = false;
    isRecognitionRunning = true;
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
    }
  };

  recognition.onerror = (event) => {
    console.error('🚨 SETUP: Speech recognition error:', event.error);
    
    // Handle specific errors
    if (event.error === 'not-allowed') {
      toast.error('Microphone access denied. Please allow microphone access and try again.');
      setIsListening(false);
      isRecognitionRunning = false;
      return;
    }
    
    if (event.error === 'no-speech') {
      console.log('📢 SETUP: No speech detected, will restart');
    } else if (event.error === 'audio-capture') {
      toast.error('No microphone found. Please check your microphone connection.');
      setIsListening(false);
      isRecognitionRunning = false;
      return;
    } else if (event.error === 'network') {
      toast.error('Network error. Please check your internet connection.');
      setIsListening(false);
      isRecognitionRunning = false;
      return;
    }
    
    // Only restart for recoverable errors and if not manually stopped
    if (!isRestarting && !(window as any).__manual_stop && 
        ['no-speech', 'aborted'].includes(event.error)) {
      scheduleRestart();
    } else {
      setIsListening(false);
      isRecognitionRunning = false;
    }
  };

  recognition.onend = () => {
    console.log('🔚 SETUP: Speech recognition ended');
    setIsListening(false);
    (window as any).__speech_recognition_active = false;
    isRecognitionRunning = false;
    
    // Only restart if not manually stopped and not already restarting
    if (!isRestarting && !(window as any).__manual_stop) {
      scheduleRestart();
    }
  };

  const scheduleRestart = () => {
    if (isRestarting || (window as any).__manual_stop) {
      return;
    }
    
    isRestarting = true;
    console.log('🔄 SETUP: Scheduling restart in 2 seconds...');
    
    // Clear any existing restart timeout
    if (restartTimeout) {
      clearTimeout(restartTimeout);
    }
    
    restartTimeout = setTimeout(() => {
      if (!(window as any).__manual_stop && !isRecognitionRunning) {
        try {
          console.log('🔄 SETUP: Attempting restart');
          recognition.start();
        } catch (error) {
          console.error('🚨 SETUP: Failed to restart:', error);
          isRestarting = false;
        }
      } else {
        isRestarting = false;
      }
    }, 2000); // Increased delay to prevent rapid restarts
  };

  // Cleanup function
  const cleanup = () => {
    if (restartTimeout) {
      clearTimeout(restartTimeout);
      restartTimeout = null;
    }
    isRestarting = false;
    isRecognitionRunning = false;
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
