/**
 * Legacy/local speech-recognition setup.
 *
 * Supports browser-side capture utilities and diagnostics.
 * Not part of the canonical Nova agent execution path.
 */
import { VoiceCommand, processVoiceCommandSync } from './voiceCommandProcessor';
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
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;

  // Enhanced conversation management
  let commandCounter = 0;
  let consecutiveErrors = 0;
  let lastCommandTime = Date.now();
  let silenceTimeout: NodeJS.Timeout | null = null;
  const MAX_CONSECUTIVE_ERRORS = 3;
  const SILENCE_TIMEOUT = 20000; // Increased from 15s
  const COMMAND_COOLDOWN = 800; // Reduced from 1000ms
  
  // Simplified TTS detection - rely mainly on the global flag
  const isTTSContent = (text: string): boolean => {
    // Primary check: if TTS is currently speaking
    if ((window as unknown).__tts_is_speaking) {
      console.log('🚫 SETUP: TTS is currently speaking, ignoring input');
      return true;
    }
    
    // Secondary check: very short or clearly system-generated text
    const cleanText = text.toLowerCase().trim();
    if (cleanText.length < 2) {
      console.log('🚫 SETUP: Text too short, ignoring:', text);
      return true;
    }
    
    // Only block obvious system responses
    const systemPhrases = [
      'voice mode activated',
      'listening for commands',
      'processing with ai',
      'ai voice assistant ready',
      'voice recognition',
      'speech recognition'
    ];
    
    const isSystemPhrase = systemPhrases.some(phrase => cleanText.includes(phrase));
    if (isSystemPhrase) {
      console.log('🚫 SETUP: System phrase detected, ignoring:', text);
      return true;
    }
    
    // Check recent TTS cache (shortened window)
    if ((window as unknown).__recent_tts_texts) {
      const recentTTS = (window as unknown).__recent_tts_texts as string[];
      const isRecentTTS = recentTTS.some(ttsText => {
        const similarity = cleanText.includes(ttsText.toLowerCase().substring(0, 15)) ||
                          ttsText.toLowerCase().includes(cleanText.substring(0, 15));
        return similarity;
      });
      if (isRecentTTS) {
        console.log('🚫 SETUP: Matches recent TTS, ignoring:', text);
        return true;
      }
    }
    
    return false;
  };

  recognition.onstart = () => {
    console.log('🎤 SETUP: Speech recognition started');
    setIsListening(true);
    globalRecognitionActive = true;
    (window as unknown).__speech_recognition_active = true;
    consecutiveErrors = 0;
    
    // Reset silence timeout
    if (silenceTimeout) {
      clearTimeout(silenceTimeout);
    }
    
    // Set silence timeout for auto-stop
    silenceTimeout = setTimeout(() => {
      if (!(window as unknown).__manual_stop && globalRecognitionActive) {
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

    // Process final results with improved filtering
    if (finalTranscript && finalTranscript !== lastProcessedTranscript) {
      const now = Date.now();
      
      // Check if this is TTS content
      if (isTTSContent(finalTranscript)) {
        console.log('🚫 SETUP: Skipping TTS-like content:', finalTranscript);
        return;
      }
      
      // Prevent rapid-fire duplicate commands
      if (now - lastCommandTime < COMMAND_COOLDOWN) {
        console.log('🕒 SETUP: Command cooldown active, skipping');
        return;
      }
      
      console.log('✅ SETUP: Processing user command:', finalTranscript);
      window.dispatchEvent(new CustomEvent('voice-debug-trace', {
        detail: {
          stage: 'speech.final_transcript',
          transcript: finalTranscript,
          timestamp: Date.now(),
        }
      }));
      
      commandCounter++;
      setLastProcessedTranscript(finalTranscript);
      lastCommandTime = now;
      
      // Reset silence timeout on new command
      if (silenceTimeout) {
        clearTimeout(silenceTimeout);
      }

      // Process the command with context preservation
      try {
        if (conversationState?.isActive && onEnhancedVoiceInput) {
          console.log('🗣️ SETUP: Conversation mode - using enhanced input');
          onEnhancedVoiceInput(finalTranscript);
        } else if (onVoiceCommand) {
          console.log('🎯 SETUP: Command mode - processing voice command');
          const command = processVoiceCommandSync(finalTranscript);
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

        // Set new silence timeout after command processing
        silenceTimeout = setTimeout(() => {
          if (!(window as unknown).__manual_stop && globalRecognitionActive) {
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
    if (event.error === 'aborted' && (window as unknown).__manual_stop) {
      console.log('🛑 SETUP: Manual stop detected, not restarting');
      setIsListening(false);
      globalRecognitionActive = false;
      return;
    }
    
    // Auto-restart for recoverable errors in continuous mode
    if (!((window as unknown).__manual_stop) && ['no-speech', 'aborted'].includes(event.error)) {
      console.log('🔄 SETUP: Recoverable error, attempting restart after delay');
      setTimeout(() => {
        if (!(window as unknown).__manual_stop && !globalRecognitionActive) {
          try {
            recognition.start();
          } catch (restartError) {
            console.error('🚨 SETUP: Failed to restart after error:', restartError);
          }
        }
      }, 1500); // Increased delay
    }
  };

  recognition.onend = () => {
    console.log('🔚 SETUP: Speech recognition ended');

    // Capture restart intent BEFORE resetting global flags
    const shouldAutoRestart =
      !(window as unknown).__manual_stop &&
      consecutiveErrors < MAX_CONSECUTIVE_ERRORS;

    setIsListening(false);
    globalRecognitionActive = false;
    (window as unknown).__speech_recognition_active = false;
    
    // Clear silence timeout
    if (silenceTimeout) {
      clearTimeout(silenceTimeout);
    }
    
    // Only auto-restart for certain error conditions, not normal manual stops
    if (shouldAutoRestart) {
      console.log('🔄 SETUP: Auto-restarting recognition');
      setTimeout(() => {
        if (!(window as unknown).__manual_stop && !globalRecognitionActive) {
          try {
            recognition.start();
            toast.info('🎤 Voice recognition resumed');
          } catch (error) {
            console.error('🚨 SETUP: Failed to auto-restart:', error);
            consecutiveErrors++;
          }
        }
      }, 1500);
    }
  };

  // Enhanced cleanup function
  const cleanup = () => {
    console.log('🧹 SETUP: Cleaning up speech recognition');
    
    if (silenceTimeout) {
      clearTimeout(silenceTimeout);
      silenceTimeout = null;
    }
    
    globalRecognitionActive = false;
    (window as unknown).__manual_stop = true;
    
    try {
      recognition.abort();
    } catch (error) {
      console.log('Error during cleanup:', error);
    }
  };

  // Store cleanup function on the recognition object
  (recognition as unknown).cleanup = cleanup;

  return recognition;
};
